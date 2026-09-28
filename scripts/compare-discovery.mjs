import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { resolve } from "node:path";
import { URL } from "node:url";
import { createGatewayApp } from "../dist/packages/company-mcp-gateway/src/http.js";
import { createRuntimeApp } from "../dist/packages/server-plugin-runtime/src/http.js";
import {
  persistDiscoveryEvidence,
  prepareDiscoveryEvidence,
  readGeneratedPluginIdentity,
} from "./discovery-evidence.mjs";
import { root } from "./lib.mjs";

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  return value;
}

function canonicalTools(result) {
  return canonicalize(
    result.tools
      .map(({ name, description, inputSchema, outputSchema }) => ({
        name,
        ...(description === undefined ? {} : { description }),
        inputSchema,
        ...(outputSchema === undefined ? {} : { outputSchema }),
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
  );
}

const discoveryDirectory = resolve(root, "artifacts/discovery");
await prepareDiscoveryEvidence(discoveryDirectory);
const runtime = await createRuntimeApp();
await new Promise((resolveListen) =>
  runtime.listen(0, "127.0.0.1", resolveListen),
);
const runtimeAddress = runtime.address();
if (!runtimeAddress || typeof runtimeAddress === "string")
  throw new Error("Plugin runtime did not start.");
const gateway = createGatewayApp(
  `http://127.0.0.1:${runtimeAddress.port}/internal/mcp`,
);
await new Promise((resolveListen) =>
  gateway.listen(0, "127.0.0.1", resolveListen),
);
const gatewayAddress = gateway.address();
if (!gatewayAddress || typeof gatewayAddress === "string")
  throw new Error("Company MCP gateway did not start.");

const localClient = new Client({ name: "discovery-local", version: "1.0.0" });
const remoteTestClient = new Client({
  name: "discovery-remote-test",
  version: "1.0.0",
});

try {
  await localClient.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [resolve(root, "plugins/local/dist/plugin/stdio.js")],
      cwd: resolve(root, "plugins/local"),
    }),
  );
  await remoteTestClient.connect(
    new StreamableHTTPClientTransport(
      new URL(`http://127.0.0.1:${gatewayAddress.port}/mcp`),
      { requestInit: { headers: { origin: "http://127.0.0.1:3000" } } },
    ),
  );

  const local = canonicalTools(await localClient.listTools());
  const remoteTest = canonicalTools(await remoteTestClient.listTools());
  const pluginIdentity = await readGeneratedPluginIdentity(root);
  await persistDiscoveryEvidence({
    directory: discoveryDirectory,
    local,
    remoteTest,
    pluginIdentity,
  });
  console.log(
    `Discovery parity passed for ${local.length} tools over stdio and loopback Streamable HTTP.`,
  );
} finally {
  await Promise.allSettled([localClient.close(), remoteTestClient.close()]);
  await Promise.all([
    new Promise((resolveClose, reject) =>
      gateway.close((error) => (error ? reject(error) : resolveClose())),
    ),
    new Promise((resolveClose, reject) =>
      runtime.close((error) => (error ? reject(error) : resolveClose())),
    ),
  ]);
}

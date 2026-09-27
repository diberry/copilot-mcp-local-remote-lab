import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { resolve } from "node:path";
import { URL } from "node:url";
import { createHttpApp } from "../dist/packages/mcp-server/src/http.js";
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
const app = createHttpApp();
await new Promise((resolveListen) => app.listen(0, "127.0.0.1", resolveListen));
const address = app.address();
if (!address || typeof address === "string")
  throw new Error("HTTP discovery adapter did not start.");

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
      new URL(`http://127.0.0.1:${address.port}/mcp`),
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
  await new Promise((resolveClose, reject) =>
    app.close((error) => (error ? reject(error) : resolveClose())),
  );
}

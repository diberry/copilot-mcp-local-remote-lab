import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createGatewayApp } from "../../packages/company-mcp-gateway/src/http.js";
import { createRuntimeApp } from "../../packages/server-plugin-runtime/src/http.js";

const servers: Array<ReturnType<typeof createGatewayApp>> = [];

afterEach(async () => {
  await Promise.all(
    servers
      .splice(0)
      .map(
        (server) =>
          new Promise<void>((resolveClose, reject) =>
            server.close((error) => (error ? reject(error) : resolveClose())),
          ),
      ),
  );
});

async function listen(server: Awaited<ReturnType<typeof createRuntimeApp>>) {
  servers.push(server);
  await new Promise<void>((resolveListen) =>
    server.listen(0, "127.0.0.1", resolveListen),
  );
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error("Test server did not bind a TCP port.");
  return address.port;
}

describe("company MCP plugin artifact runtime", () => {
  it("executes the exact generated plugin artifact through the gateway", async () => {
    const artifactRoot = resolve("artifacts/plugin/runtime");
    const manifest = JSON.parse(
      await readFile(resolve(artifactRoot, "artifact.json"), "utf8"),
    ) as { payloadSha256: string };
    const runtime = await createRuntimeApp(artifactRoot);
    const runtimePort = await listen(runtime);
    const gateway = createGatewayApp(
      `http://127.0.0.1:${runtimePort}/internal/mcp`,
    );
    const gatewayPort = await listen(gateway);
    const client = new Client({
      name: "artifact-runtime-test",
      version: "1.0.0",
    });

    try {
      await client.connect(
        new StreamableHTTPClientTransport(
          new URL(`http://127.0.0.1:${gatewayPort}/mcp`),
          {
            requestInit: {
              headers: { origin: "http://127.0.0.1:3000" },
            },
          },
        ),
      );
      const discovery = await client.listTools();
      expect(discovery.tools.map(({ name }) => name)).toEqual([
        "reset_todos",
        "add_todo",
        "list_todos",
        "complete_todo",
        "diagnostics",
      ]);
      const result = await client.callTool({
        name: "diagnostics",
        arguments: { includeContextStudy: true },
      });
      expect(result.structuredContent).toMatchObject({
        outcome: "success",
        pluginId: "copilot-mcp-local-remote-lab",
        pluginVersion: "1.0.0",
        data: {
          placement: "company-mcp",
          contextStudy: {
            pluginLocation: "company-runtime",
            artifactIdentity: "copilot-mcp-local-remote-lab@1.0.0",
          },
        },
      });
      await client.callTool({ name: "reset_todos", arguments: {} });
      await client.callTool({
        name: "add_todo",
        arguments: { title: "persists across MCP requests" },
      });
      const list = await client.callTool({
        name: "list_todos",
        arguments: {},
      });
      expect(list.structuredContent).toMatchObject({
        outcome: "success",
        data: {
          todos: [
            {
              id: "todo-1",
              title: "persists across MCP requests",
              completed: false,
            },
          ],
        },
      });
      const health = await fetch(
        `http://127.0.0.1:${runtimePort}/healthz`,
      ).then((response) => response.json());
      expect(health).toMatchObject({
        artifactSha256: manifest.payloadSha256,
      });
    } finally {
      await client.close();
    }
  });
});

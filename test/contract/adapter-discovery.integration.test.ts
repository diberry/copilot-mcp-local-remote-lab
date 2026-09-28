import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHttpApp } from "../../packages/mcp-server/src/http.js";

const app = createHttpApp();
const clients: Client[] = [];

beforeAll(async () => {
  await new Promise<void>((resolve) => app.listen(0, "127.0.0.1", resolve));
});

afterAll(async () => {
  await Promise.allSettled(clients.map((client) => client.close()));
  await new Promise<void>((resolve, reject) =>
    app.close((error) => (error ? reject(error) : resolve())),
  );
});

describe("client-visible adapter discovery", () => {
  it("discovers equal tools through real stdio and HTTP transports", async () => {
    const address = app.address();
    if (!address || typeof address === "string") throw new Error("No address");
    const local = new Client({ name: "test-local", version: "1.0.0" });
    const remoteTest = new Client({
      name: "test-remote-test",
      version: "1.0.0",
    });
    clients.push(local, remoteTest);
    await local.connect(
      new StdioClientTransport({
        command: process.execPath,
        args: [
          "node_modules/tsx/dist/cli.mjs",
          "packages/mcp-server/src/stdio.ts",
        ],
      }),
    );
    await remoteTest.connect(
      new StreamableHTTPClientTransport(
        new URL(`http://127.0.0.1:${address.port}/mcp`),
        { requestInit: { headers: { origin: "http://127.0.0.1:3000" } } },
      ),
    );

    const normalize = (
      tools: Awaited<ReturnType<Client["listTools"]>>["tools"],
    ) => tools.map((tool) => tool.name).sort();
    expect(normalize((await local.listTools()).tools)).toEqual(
      normalize((await remoteTest.listTools()).tools),
    );
    expect(normalize((await local.listTools()).tools)).toHaveLength(5);
  });
});

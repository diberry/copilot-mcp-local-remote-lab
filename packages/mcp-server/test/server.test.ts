import { afterEach, describe, expect, it } from "vitest";
import { app, toInternalRequestUrl } from "../src/http.js";
import { createToolExecutor } from "../src/create-server.js";
import { sanitizeTelemetry } from "../src/telemetry.js";

afterEach(() => {
  delete process.env.MCP_BEARER_TOKEN;
});

describe.each(["stdio", "streamable-http"] as const)(
  "shared %s contract",
  (transport) => {
    it("returns equivalent wrapped results for all tools", async () => {
      const invoke = createToolExecutor(transport);
      for (const [name, input] of [
        ["reset_todos", {}],
        ["add_todo", { title: "synthetic-alpha" }],
        ["list_todos", {}],
        ["complete_todo", { id: "todo-1" }],
        ["diagnostics", {}],
      ] as const) {
        const result = await invoke(name, input);
        expect(result).toMatchObject({
          operation: name,
          outcome: "success",
          serverVersion: "1.0.0",
        });
      }
    });

    it("exposes synthetic context and responsibility evidence for the active boundary", async () => {
      const result = await createToolExecutor(transport)("diagnostics", {
        includeContextStudy: true,
      });
      expect(result).toMatchObject({
        outcome: "success",
        data: {
          transport,
          contextStudy: {
            modelLocation: "copilot-client",
            pluginLocation: "copilot-client",
            toolExecution:
              transport === "stdio" ? "learner-device" : "shared-service",
            syntheticDecisionEvidence: {
              source:
                transport === "stdio"
                  ? "learner-approved-local-fixture"
                  : "operator-curated-team-fixture",
              recommendation: transport === "stdio" ? "todo-1" : "todo-3",
            },
          },
        },
      });
    });
  },
);

describe("HTTP defenses", () => {
  it("uses a fixed internal origin while preserving path and query", () => {
    expect(toInternalRequestUrl("/mcp?request=1")).toBe(
      "http://mcp.internal/mcp?request=1",
    );
    expect(toInternalRequestUrl("//evil.example/mcp?request=1")).toBe(
      "http://mcp.internal/mcp?request=1",
    );
  });

  it("rejects method, media type, origin, and missing auth", async () => {
    process.env.NODE_ENV = "test";
    await new Promise<void>((resolve) => app.listen(0, "127.0.0.1", resolve));
    const address = app.address();
    if (!address || typeof address === "string") throw new Error("No address");
    const url = `http://127.0.0.1:${address.port}/mcp`;
    const initialize = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        origin: "http://127.0.0.1:3000",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2026-07-28",
          capabilities: {},
          clientInfo: { name: "lab-test", version: "1.0.0" },
        },
      }),
    });
    expect(initialize.status).toBe(200);
    expect(await initialize.text()).toContain('"serverInfo"');
    const maliciousHost = await fetch(url, {
      method: "POST",
      headers: {
        host: "evil.example",
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        origin: "http://127.0.0.1:3000",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "initialize",
        params: {
          protocolVersion: "2026-07-28",
          capabilities: {},
          clientInfo: { name: "host-header-test", version: "1.0.0" },
        },
      }),
    });
    expect(maliciousHost.status).toBe(200);
    expect(await maliciousHost.text()).toContain('"serverInfo"');
    expect((await fetch(url)).status).toBe(405);
    expect(
      (
        await fetch(url, {
          method: "POST",
          headers: { "content-type": "text/plain" },
          body: "{}",
        })
      ).status,
    ).toBe(415);
    expect(
      (
        await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            origin: "https://evil.example",
          },
          body: "{}",
        })
      ).status,
    ).toBe(403);
    process.env.MCP_BEARER_TOKEN = "test-token";
    expect(
      (
        await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        })
      ).status,
    ).toBe(401);
    await new Promise<void>((resolve, reject) =>
      app.close((error) => (error ? reject(error) : resolve())),
    );
  });
  it("allows only telemetry fields", () => {
    expect(
      sanitizeTelemetry({
        requestId: "r",
        prompt: "secret",
        headers: "secret",
        todoText: "secret",
      }),
    ).toEqual({ requestId: "r" });
  });
});

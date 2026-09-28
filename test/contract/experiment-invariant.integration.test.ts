import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { afterEach, describe, expect, it } from "vitest";
import { runScenario } from "../../packages/experiment-runner/src/scenario.js";
import { createHttpApp } from "../../packages/mcp-server/src/http.js";

const clients: Client[] = [];
const app = createHttpApp();

afterEach(async () => {
  await Promise.allSettled(clients.splice(0).map((client) => client.close()));
  if (app.listening)
    await new Promise<void>((resolve, reject) =>
      app.close((error) => (error ? reject(error) : resolve())),
    );
});

function finalTodos(
  result: Awaited<ReturnType<typeof runScenario>>,
): Array<{ id: string; title: string; completed: boolean }> {
  const final = result.results.at(-1)?.structuredContent as {
    data: {
      todos: Array<{ id: string; title: string; completed: boolean }>;
    };
  };
  return final.data.todos.map(({ id, title, completed }) => ({
    id,
    title,
    completed,
  }));
}

function contextStudy(result: Awaited<ReturnType<Client["callTool"]>>) {
  return (
    result.structuredContent as {
      data: {
        contextStudy: {
          modelLocation: string;
          pluginLocation: string;
          toolExecution: string;
          syntheticDecisionEvidence: {
            source: string;
            recommendation: string;
          };
          userResponsibilities: string[];
          operatorResponsibilities: string[];
        };
      };
    }
  ).data.contextStudy;
}

describe("learning contract: same behavior, different MCP boundary", () => {
  it("reaches the same domain outcome through real stdio and HTTP clients", async () => {
    await new Promise<void>((resolve) => app.listen(0, "127.0.0.1", resolve));
    const address = app.address();
    if (!address || typeof address === "string") throw new Error("No address");

    const local = new Client({ name: "invariant-local", version: "1.0.0" });
    const remote = new Client({ name: "invariant-remote", version: "1.0.0" });
    clients.push(local, remote);

    await local.connect(
      new StdioClientTransport({
        command: process.execPath,
        args: ["--import", "tsx", "packages/mcp-server/src/stdio.ts"],
      }),
    );
    await remote.connect(
      new StreamableHTTPClientTransport(
        new URL(`http://127.0.0.1:${address.port}/mcp`),
        { requestInit: { headers: { origin: "http://127.0.0.1:3000" } } },
      ),
    );

    const localResult = await runScenario(local, "stdio");
    const remoteResult = await runScenario(remote, "streamable-http");

    expect(finalTodos(localResult)).toEqual(finalTodos(remoteResult));
    expect(finalTodos(localResult)).toEqual([
      { id: "todo-1", title: "synthetic-alpha", completed: false },
      { id: "todo-2", title: "synthetic-beta", completed: true },
      { id: "todo-3", title: "synthetic-gamma", completed: false },
    ]);

    const localStudy = contextStudy(
      await local.callTool({
        name: "diagnostics",
        arguments: { includeContextStudy: true },
      }),
    );
    const remoteStudy = contextStudy(
      await remote.callTool({
        name: "diagnostics",
        arguments: { includeContextStudy: true },
      }),
    );

    expect(localStudy).toMatchObject({
      modelLocation: "copilot-client",
      pluginLocation: "copilot-client",
      toolExecution: "learner-device",
      syntheticDecisionEvidence: {
        source: "learner-approved-local-fixture",
        recommendation: "todo-1",
      },
    });
    expect(remoteStudy).toMatchObject({
      modelLocation: "copilot-client",
      pluginLocation: "copilot-client",
      toolExecution: "shared-service",
      syntheticDecisionEvidence: {
        source: "operator-curated-team-fixture",
        recommendation: "todo-3",
      },
    });
    expect(localStudy.userResponsibilities).not.toEqual(
      remoteStudy.userResponsibilities,
    );
    expect(localStudy.operatorResponsibilities).not.toEqual(
      remoteStudy.operatorResponsibilities,
    );
  });
});

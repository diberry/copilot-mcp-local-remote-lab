import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { afterEach, describe, expect, it } from "vitest";
import todos from "../fixtures/deterministic-todos.json" with { type: "json" };

let client: Client | undefined;

afterEach(async () => {
  await client?.close();
  client = undefined;
});

describe("local profile", () => {
  it("runs the deterministic todo flow through the stdio adapter", async () => {
    client = new Client({ name: "e2e-local", version: "1.0.0" });
    await client.connect(
      new StdioClientTransport({
        command: process.execPath,
        args: ["--import", "tsx", "packages/mcp-server/src/stdio.ts"],
      }),
    );

    const tools = await client.listTools();
    expect(tools.tools.map(({ name }) => name).sort()).toEqual([
      "add_todo",
      "complete_todo",
      "diagnostics",
      "list_todos",
      "reset_todos",
    ]);

    await client.callTool({ name: "reset_todos", arguments: {} });
    for (const title of todos.titles)
      await client.callTool({ name: "add_todo", arguments: { title } });
    await client.callTool({
      name: "complete_todo",
      arguments: { id: todos.completedId },
    });

    const listed = await client.callTool({
      name: "list_todos",
      arguments: {},
    });
    const state = (
      listed.structuredContent as {
        data: {
          todos: Array<{ id: string; title: string; completed: boolean }>;
        };
      }
    ).data;
    expect(state.todos.map(({ title }) => title)).toEqual(todos.titles);
    expect(
      state.todos.find(({ id }) => id === todos.completedId)?.completed,
    ).toBe(true);
  });
});

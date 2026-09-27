import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { afterEach, describe, expect, it } from "vitest";
import { createHttpApp } from "../../packages/mcp-server/src/http.js";
import {
  InMemoryTodoStorage,
  TodoService,
} from "../../packages/todo-core/src/index.js";
import clock from "../fixtures/deterministic-clock.json" with { type: "json" };
import todos from "../fixtures/deterministic-todos.json" with { type: "json" };

const app = createHttpApp(
  new TodoService(new InMemoryTodoStorage(), () => clock.iso),
);
let client: Client | undefined;

afterEach(async () => {
  await client?.close();
  client = undefined;
  if (app.listening)
    await new Promise<void>((resolve, reject) =>
      app.close((error) => (error ? reject(error) : resolve())),
    );
});

describe("remote profile", () => {
  it("runs the deterministic todo flow through Streamable HTTP", async () => {
    await new Promise<void>((resolve) => app.listen(0, "127.0.0.1", resolve));
    const address = app.address();
    if (!address || typeof address === "string") throw new Error("No address");

    client = new Client({ name: "e2e-remote", version: "1.0.0" });
    await client.connect(
      new StreamableHTTPClientTransport(
        new URL(`http://127.0.0.1:${address.port}/mcp`),
        { requestInit: { headers: { origin: "http://127.0.0.1:3000" } } },
      ),
    );

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
          todos: Array<{
            id: string;
            title: string;
            completed: boolean;
            createdAt: string;
          }>;
        };
      }
    ).data;
    expect(state.todos.map(({ title }) => title)).toEqual(todos.titles);
    expect(state.todos.every(({ createdAt }) => createdAt === clock.iso)).toBe(
      true,
    );
    expect(
      state.todos.find(({ id }) => id === todos.completedId)?.completed,
    ).toBe(true);
  });
});

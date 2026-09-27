import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/server";
import {
  AddTodoInputSchema,
  CompleteTodoInputSchema,
  InMemoryTodoStorage,
  normalizeError,
  TodoService,
} from "../../todo-core/src/index.js";
import { emitTelemetry } from "./telemetry.js";

export type TransportName = "stdio" | "streamable-http";
export const SERVER_VERSION = "1.0.0";

export function createToolExecutor(
  transport: TransportName,
  service = new TodoService(new InMemoryTodoStorage()),
) {
  return async (operation: string, input: Record<string, unknown> = {}) => {
    const requestId = randomUUID();
    const start = performance.now();
    try {
      let data: unknown;
      if (operation === "reset_todos") data = service.reset();
      else if (operation === "add_todo")
        data = service.add(AddTodoInputSchema.parse(input).title);
      else if (operation === "list_todos") data = service.list();
      else if (operation === "complete_todo")
        data = service.complete(CompleteTodoInputSchema.parse(input).id);
      else if (operation === "diagnostics")
        data = { transport, healthy: true, pluginVersion: SERVER_VERSION };
      else throw new Error("Unknown operation");
      const result = {
        requestId,
        operation,
        outcome: "success",
        serverVersion: SERVER_VERSION,
        data,
      };
      emitTelemetry({
        requestId,
        transport,
        operation,
        outcome: "success",
        serverDurationMs: performance.now() - start,
        serverVersion: SERVER_VERSION,
      });
      return result;
    } catch (error) {
      const normalized = normalizeError(error);
      emitTelemetry({
        requestId,
        transport,
        operation,
        outcome: "error",
        errorCategory: normalized.category,
        serverDurationMs: performance.now() - start,
        serverVersion: SERVER_VERSION,
      });
      return {
        requestId,
        operation,
        outcome: "error",
        serverVersion: SERVER_VERSION,
        error: normalized,
      };
    }
  };
}

export function registerTodoTools(
  server: McpServer,
  transport: TransportName,
  service = new TodoService(new InMemoryTodoStorage()),
) {
  const execute = createToolExecutor(transport, service);
  const register = (name: string, description: string, inputSchema: any) =>
    server.registerTool(
      name,
      { description, inputSchema },
      async (input: Record<string, unknown>) => {
        const result = await execute(name, input);
        return {
          content: [{ type: "text" as const, text: JSON.stringify(result) }],
          structuredContent: result as Record<string, unknown>,
          isError: result.outcome === "error",
        };
      },
    );
  register("reset_todos", "Reset the synthetic todo board.", {});
  register("add_todo", "Add one validated synthetic todo.", {
    title: AddTodoInputSchema.shape.title,
  });
  register("list_todos", "List todos in stable insertion order.", {});
  register("complete_todo", "Complete a todo by its stable ID.", {
    id: CompleteTodoInputSchema.shape.id,
  });
  register(
    "diagnostics",
    "Return safe server and active transport metadata.",
    {},
  );
  return server;
}

export function createServer(
  transport: TransportName,
  service = new TodoService(new InMemoryTodoStorage()),
) {
  return registerTodoTools(
    new McpServer({ name: "todo-boundary-lab", version: SERVER_VERSION }),
    transport,
    service,
  );
}

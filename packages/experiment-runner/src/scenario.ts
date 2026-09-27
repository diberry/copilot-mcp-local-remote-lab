import type { Client } from "@modelcontextprotocol/client";
import { performance } from "node:perf_hooks";
import type { TransportName } from "../../mcp-server/src/create-server.js";

// Both clients execute this exact sequence so transport is the only intended
// variable in a baseline pair.
export const scenario = [
  ["reset_todos", {}],
  ["add_todo", { title: "synthetic-alpha" }],
  ["add_todo", { title: "synthetic-beta" }],
  ["add_todo", { title: "synthetic-gamma" }],
  ["list_todos", {}],
  ["complete_todo", { id: "todo-2" }],
  ["list_todos", {}],
] as const;

export async function runScenario(client: Client, transport: TransportName) {
  const started = performance.now();
  const results = [];
  for (const [operation, input] of scenario) {
    const result = await client.callTool({ name: operation, arguments: input });
    if (result.isError)
      throw new Error(`${transport} tool failed: ${operation}`);
    results.push(result);
  }
  return { transport, durationMs: performance.now() - started, results };
}

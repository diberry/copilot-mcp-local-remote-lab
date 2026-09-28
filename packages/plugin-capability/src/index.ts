import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/server";
import {
  AddTodoInputSchema,
  CompleteTodoInputSchema,
  DiagnosticsInputSchema,
  InMemoryTodoStorage,
  normalizeError,
  TodoService,
} from "../../todo-core/src/index.js";

export const PLUGIN_ID = "copilot-mcp-local-remote-lab";
export const PLUGIN_VERSION = "1.0.0";
export type PluginPlacement = "client" | "company-mcp";

export interface PluginTelemetryEvent {
  requestId: string;
  operation: string;
  outcome: "success" | "error";
  errorCategory?: string;
  durationMs: number;
  pluginId: string;
  pluginVersion: string;
  placement: PluginPlacement;
}

export interface PluginRuntimeOptions {
  placement: PluginPlacement;
  emitTelemetry?: (event: PluginTelemetryEvent) => void;
}

function describePlacement(placement: PluginPlacement) {
  const local = placement === "client";
  return {
    modelLocation: "copilot-client",
    pluginLocation: local ? "copilot-client" : "company-runtime",
    toolExecution: local ? "learner-device" : "shared-service",
    artifactIdentity: `${PLUGIN_ID}@${PLUGIN_VERSION}`,
    syntheticDecisionEvidence: local
      ? {
          source: "learner-approved-local-fixture",
          recommendation: "todo-1",
          reason: "The learner marked synthetic-alpha as the current focus.",
        }
      : {
          source: "operator-curated-team-fixture",
          recommendation: "todo-3",
          reason:
            "The shared team policy prioritizes synthetic-gamma after synthetic-beta is complete.",
        },
    userResponsibilities: local
      ? [
          "install and update the complete plugin",
          "grant access to local context",
          "keep the device and plugin runtime available",
          "inspect local execution evidence",
        ]
      : [
          "authenticate to the company gateway",
          "decide what context may cross the company boundary",
          "verify the provenance of shared recommendations",
        ],
    operatorResponsibilities: local
      ? ["publish compatible plugin updates"]
      : [
          "secure and patch the gateway and plugin runtime",
          "govern shared context and policy",
          "operate availability and scaling",
          "monitor telemetry and cost without collecting task content",
        ],
  };
}

export function createPluginExecutor(
  options: PluginRuntimeOptions,
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
      else if (operation === "diagnostics") {
        const { includeContextStudy } = DiagnosticsInputSchema.parse(input);
        data = {
          healthy: true,
          pluginId: PLUGIN_ID,
          pluginVersion: PLUGIN_VERSION,
          placement: options.placement,
          ...(includeContextStudy
            ? { contextStudy: describePlacement(options.placement) }
            : {}),
        };
      } else throw new Error("Unknown operation");

      const result = {
        requestId,
        operation,
        outcome: "success",
        pluginId: PLUGIN_ID,
        pluginVersion: PLUGIN_VERSION,
        data,
      };
      options.emitTelemetry?.({
        requestId,
        operation,
        outcome: "success",
        durationMs: performance.now() - start,
        pluginId: PLUGIN_ID,
        pluginVersion: PLUGIN_VERSION,
        placement: options.placement,
      });
      return result;
    } catch (error) {
      const normalized = normalizeError(error);
      options.emitTelemetry?.({
        requestId,
        operation,
        outcome: "error",
        errorCategory: normalized.category,
        durationMs: performance.now() - start,
        pluginId: PLUGIN_ID,
        pluginVersion: PLUGIN_VERSION,
        placement: options.placement,
      });
      return {
        requestId,
        operation,
        outcome: "error",
        pluginId: PLUGIN_ID,
        pluginVersion: PLUGIN_VERSION,
        error: normalized,
      };
    }
  };
}

function createPluginMcpServerWithService(
  options: PluginRuntimeOptions,
  service: TodoService,
) {
  const server = new McpServer({
    name: PLUGIN_ID,
    version: PLUGIN_VERSION,
  });
  const execute = createPluginExecutor(options, service);
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
    "Return plugin artifact identity, placement, and optional context evidence.",
    {
      includeContextStudy: DiagnosticsInputSchema.shape.includeContextStudy,
    },
  );
  return server;
}

export function createPluginRuntime(options: PluginRuntimeOptions) {
  const service = new TodoService(new InMemoryTodoStorage());
  return {
    createMcpServer: () => createPluginMcpServerWithService(options, service),
  };
}

export function createPluginMcpServer(options: PluginRuntimeOptions) {
  return createPluginRuntime(options).createMcpServer();
}

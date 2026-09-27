import * as z from "zod/v4";
import {
  AddTodoInputSchema,
  CompleteTodoInputSchema,
  EmptyInputSchema,
} from "../../todo-core/src/index.js";

export const toolCatalog = [
  {
    name: "reset_todos",
    description: "Reset the synthetic todo board.",
    inputSchema: EmptyInputSchema,
  },
  {
    name: "add_todo",
    description: "Add one validated synthetic todo.",
    inputSchema: AddTodoInputSchema,
  },
  {
    name: "list_todos",
    description: "List todos in stable insertion order.",
    inputSchema: EmptyInputSchema,
  },
  {
    name: "complete_todo",
    description: "Complete a todo by its stable ID.",
    inputSchema: CompleteTodoInputSchema,
  },
  {
    name: "diagnostics",
    description: "Return safe server and active transport metadata.",
    inputSchema: EmptyInputSchema,
  },
] as const satisfies readonly {
  name: string;
  description: string;
  inputSchema: z.ZodType;
}[];

export function canonicalDiscovery() {
  return toolCatalog.map(({ name, description, inputSchema }) => ({
    name,
    description,
    inputSchema: z.toJSONSchema(inputSchema),
    outputSchema: {
      type: "object",
      required: ["requestId", "operation", "outcome", "serverVersion"],
    },
  }));
}

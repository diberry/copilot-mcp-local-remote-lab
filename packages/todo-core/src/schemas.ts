import * as z from "zod/v4";

export const TodoTitleSchema = z.string().trim().min(1).max(120);
export const TodoIdSchema = z.string().regex(/^todo-\d+$/);
export const AddTodoInputSchema = z.object({ title: TodoTitleSchema });
export const CompleteTodoInputSchema = z.object({ id: TodoIdSchema });
export const EmptyInputSchema = z.object({}).strict();
export const TodoSchema = z.object({
  id: TodoIdSchema,
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.iso.datetime(),
});

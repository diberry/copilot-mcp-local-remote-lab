import { TodoError } from "./errors.js";
import { TodoIdSchema, TodoTitleSchema } from "./schemas.js";
import type { Clock, TodoStorage } from "./types.js";

export class TodoService {
  constructor(
    private readonly storage: TodoStorage,
    private readonly clock: Clock = () => new Date().toISOString(),
  ) {}

  reset() {
    return this.storage.write([]);
  }

  add(titleInput: string) {
    const title = TodoTitleSchema.safeParse(titleInput);
    if (!title.success)
      throw new TodoError(
        "validation",
        "INVALID_TITLE",
        "Title must contain 1-120 characters.",
      );
    const current = this.storage.read();
    const todo = {
      id: `todo-${current.todos.length + 1}`,
      title: title.data,
      completed: false,
      createdAt: this.clock(),
    };
    const state = this.storage.write([...current.todos, todo]);
    return { todo, version: state.version };
  }

  list() {
    return this.storage.read();
  }

  complete(idInput: string) {
    const parsed = TodoIdSchema.safeParse(idInput);
    if (!parsed.success)
      throw new TodoError(
        "validation",
        "INVALID_ID",
        "Todo ID must use the todo-N format.",
      );
    const current = this.storage.read();
    const match = current.todos.find((todo) => todo.id === parsed.data);
    if (!match)
      throw new TodoError(
        "not_found",
        "TODO_NOT_FOUND",
        "The requested todo does not exist.",
      );
    const todos = current.todos.map((todo) =>
      todo.id === parsed.data ? { ...todo, completed: true } : todo,
    );
    const state = this.storage.write(todos);
    return {
      todo: state.todos.find((todo) => todo.id === parsed.data),
      version: state.version,
    };
  }
}

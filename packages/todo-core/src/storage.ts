import type { Todo, TodoState, TodoStorage } from "./types.js";

export class InMemoryTodoStorage implements TodoStorage {
  private state: TodoState = { version: 0, todos: [] };
  read(): TodoState {
    return structuredClone(this.state);
  }
  write(todos: readonly Todo[]): TodoState {
    this.state = {
      version: this.state.version + 1,
      todos: structuredClone(todos),
    };
    return this.read();
  }
}

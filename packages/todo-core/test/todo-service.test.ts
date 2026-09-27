import { describe, expect, it } from "vitest";
import { InMemoryTodoStorage, TodoService } from "../src/index.js";

describe("TodoService", () => {
  it("supports deterministic reset, add, list, and complete", () => {
    const service = new TodoService(
      new InMemoryTodoStorage(),
      () => "2026-09-27T00:00:00.000Z",
    );
    expect(service.reset()).toEqual({ version: 1, todos: [] });
    expect(service.add("alpha").todo.id).toBe("todo-1");
    expect(service.list().todos).toHaveLength(1);
    expect(service.complete("todo-1").todo?.completed).toBe(true);
  });
  it("normalizes invalid and missing IDs without mutation", () => {
    const service = new TodoService(new InMemoryTodoStorage());
    expect(() => service.add(" ")).toThrow("Title must");
    expect(() => service.complete("bad")).toThrow("todo-N");
    expect(() => service.complete("todo-1")).toThrow("does not exist");
    expect(service.list().todos).toHaveLength(0);
  });
});

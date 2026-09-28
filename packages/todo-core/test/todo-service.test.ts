import { describe, expect, it } from "vitest";
import { InMemoryTodoStorage, TodoService } from "../src/index.js";
import clock from "../../../test/fixtures/deterministic-clock.json" with { type: "json" };
import todos from "../../../test/fixtures/deterministic-todos.json" with { type: "json" };

describe("TodoService", () => {
  it("supports deterministic reset, add, list, and complete", () => {
    const service = new TodoService(new InMemoryTodoStorage(), () => clock.iso);
    expect(service.reset()).toEqual({ version: 1, todos: [] });
    for (const title of todos.titles) service.add(title);
    expect(service.list().todos).toHaveLength(todos.titles.length);
    expect(
      service.list().todos.every((todo) => todo.createdAt === clock.iso),
    ).toBe(true);
    expect(service.complete(todos.completedId).todo?.completed).toBe(true);
  });
  it("normalizes invalid and missing IDs without mutation", () => {
    const service = new TodoService(new InMemoryTodoStorage());
    expect(() => service.add(" ")).toThrow("Title must");
    expect(() => service.complete("bad")).toThrow("todo-N");
    expect(() => service.complete("todo-1")).toThrow("does not exist");
    expect(service.list().todos).toHaveLength(0);
  });
});

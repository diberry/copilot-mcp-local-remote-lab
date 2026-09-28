import { describe, expect, it } from "vitest";
import { canonicalDiscovery } from "../../packages/mcp-server/src/catalog.js";
describe("discovery contract", () => {
  it("publishes exactly five stable tools", () =>
    expect(canonicalDiscovery().map((tool) => tool.name)).toEqual([
      "reset_todos",
      "add_todo",
      "list_todos",
      "complete_todo",
      "diagnostics",
    ]));
});

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Agent Plugin layout", () => {
  it("uses 1.0 schema without legacy component fields", async () => {
    const plugin = JSON.parse(await readFile("plugin.json", "utf8"));
    expect(plugin.$schema).toBe(
      "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json",
    );
    expect(plugin).not.toHaveProperty("agents");
    expect(plugin).not.toHaveProperty("mcpServers");
    expect(plugin).not.toHaveProperty("hooks", expect.any(Object));
  });
});

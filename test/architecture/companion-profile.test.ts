import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const local = resolve("plugins/local");
const remote = resolve("plugins/remote");
const companion = resolve("plugins/companion");
const agent = "com.github.copilot/agents/todo-experimenter.agent.md";
const skill = "skills/compare-todo-execution/SKILL.md";
const hooks = "com.github.copilot/hooks/hooks.json";

describe("thin client companion", () => {
  it("retains canonical client-native behavior without executable capability code", async () => {
    for (const path of [agent, skill, hooks])
      await expect(readFile(resolve(companion, path), "utf8")).resolves.toBe(
        await readFile(resolve(local, path), "utf8"),
      );

    await expect(
      access(resolve(companion, "dist/plugin/capability.js")),
    ).rejects.toThrow();
    await expect(access(resolve(remote, agent))).rejects.toThrow();
    await expect(access(resolve(remote, skill))).rejects.toThrow();
    await expect(access(resolve(remote, hooks))).rejects.toThrow();
  });

  it("implements client-side disclosure approval and three-profile comparison", async () => {
    const [agentText, skillText, profile] = await Promise.all([
      readFile(resolve(companion, agent), "utf8"),
      readFile(resolve(companion, skill), "utf8"),
      readFile(resolve(companion, "companion.json"), "utf8").then(JSON.parse),
    ]);

    expect(agentText).toContain("Ask the learner for explicit approval");
    expect(agentText).toContain(
      "Stop without calling task tools if approval is absent.",
    );
    expect(skillText).toContain(
      "`local`, `remote` connection-only, and `companion`",
    );
    expect(profile).toMatchObject({
      version: 1,
      profileId: "company-mcp-thin-companion",
      excludes: ["plugin-capability-executable", "local-tool-runtime"],
    });
  });
});

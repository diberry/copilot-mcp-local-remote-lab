import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { comparePluginTrees } from "../../scripts/compare-plugin.mjs";

const work = resolve("test/.plugin-comparison-work");
const local = resolve(work, "local");
const remote = resolve(work, "remote");
const companion = resolve(work, "companion");

afterEach(() => rm(work, { recursive: true, force: true }));

async function createLocalTree(directory: string, hash: string) {
  await mkdir(resolve(directory, "dist/plugin"), { recursive: true });
  await Promise.all([
    writeFile(
      resolve(directory, "plugin.json"),
      JSON.stringify({
        name: "copilot-mcp-local-remote-lab",
        version: "1.0.0",
      }),
    ),
    writeFile(resolve(directory, "mcp.json"), "local"),
    writeFile(
      resolve(directory, "artifact.json"),
      JSON.stringify({ entrySha256: "entry-hash", payloadSha256: hash }),
    ),
    writeFile(resolve(directory, "dist/plugin/capability.js"), "capability"),
    writeFile(resolve(directory, "dist/plugin/stdio.js"), "loader"),
  ]);
}

async function createRemoteTree(
  directory: string,
  hash: string,
  executable = false,
) {
  await mkdir(resolve(directory, "dist/plugin"), { recursive: true });
  await Promise.all([
    writeFile(
      resolve(directory, "plugin.json"),
      JSON.stringify({
        name: "copilot-mcp-local-remote-lab",
        version: "1.0.0",
      }),
    ),
    writeFile(resolve(directory, "mcp.json"), "remote"),
    writeFile(
      resolve(directory, "server-artifact.json"),
      JSON.stringify({ entrySha256: "entry-hash", payloadSha256: hash }),
    ),
    ...(executable
      ? [
          writeFile(
            resolve(directory, "dist/plugin/capability.js"),
            "copied source",
          ),
        ]
      : []),
  ]);
}

async function createCompanionTree(directory: string, hash: string) {
  await Promise.all([
    mkdir(resolve(directory, "skills/compare-todo-execution"), {
      recursive: true,
    }),
    mkdir(resolve(directory, "com.github.copilot/agents"), {
      recursive: true,
    }),
    mkdir(resolve(directory, "com.github.copilot/hooks"), {
      recursive: true,
    }),
  ]);
  await Promise.all([
    writeFile(
      resolve(directory, "plugin.json"),
      JSON.stringify({
        name: "copilot-mcp-local-remote-lab",
        version: "1.0.0",
        skills: ["skills/"],
        hooks: "com.github.copilot/hooks/hooks.json",
      }),
    ),
    writeFile(resolve(directory, "mcp.json"), "remote"),
    writeFile(
      resolve(directory, "server-artifact.json"),
      JSON.stringify({ entrySha256: "entry-hash", payloadSha256: hash }),
    ),
    writeFile(
      resolve(directory, "companion.json"),
      JSON.stringify({ profileId: "company-mcp-thin-companion" }),
    ),
    writeFile(
      resolve(directory, "skills/compare-todo-execution/SKILL.md"),
      "skill",
    ),
    writeFile(
      resolve(
        directory,
        "com.github.copilot/agents/todo-experimenter.agent.md",
      ),
      "agent",
    ),
    writeFile(resolve(directory, "com.github.copilot/hooks/hooks.json"), "{}"),
  ]);
}

describe("generated plugin comparison", () => {
  it("rejects executable plugin code in the remote connection", async () => {
    await Promise.all([
      createLocalTree(local, "same-hash"),
      createRemoteTree(remote, "same-hash", true),
      createCompanionTree(companion, "same-hash"),
    ]);
    await expect(
      comparePluginTrees(local, remote, { companionDirectory: companion }),
    ).rejects.toThrow("contains executable plugin");
  });

  it("rejects executable plugin code in the thin companion", async () => {
    await Promise.all([
      createLocalTree(local, "same-hash"),
      createRemoteTree(remote, "same-hash"),
      createCompanionTree(companion, "same-hash"),
    ]);
    await mkdir(resolve(companion, "dist/plugin"), { recursive: true });
    await writeFile(resolve(companion, "dist/plugin/capability.js"), "copied");

    await expect(
      comparePluginTrees(local, remote, { companionDirectory: companion }),
    ).rejects.toThrow("contains executable plugin");
  });

  it("binds the remote connection to the local artifact hash", async () => {
    await Promise.all([
      createLocalTree(local, "same-hash"),
      createRemoteTree(remote, "same-hash"),
      createCompanionTree(companion, "same-hash"),
    ]);
    await expect(
      comparePluginTrees(local, remote, { companionDirectory: companion }),
    ).resolves.toMatchObject({ artifactSha256: "same-hash" });
  });
});

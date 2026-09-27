import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { comparePluginTrees } from "../../scripts/compare-plugin.mjs";

const work = resolve("test/.plugin-comparison-work");
const local = resolve(work, "local");
const remote = resolve(work, "remote");

afterEach(() => rm(work, { recursive: true, force: true }));

async function createTree(directory: string, mcp: string, payload: string) {
  await mkdir(directory, { recursive: true });
  await Promise.all([
    writeFile(
      resolve(directory, "plugin.json"),
      JSON.stringify({
        name: "copilot-mcp-local-remote-lab",
        version: "1.0.0",
      }),
    ),
    writeFile(resolve(directory, "mcp.json"), mcp),
    writeFile(resolve(directory, "payload.txt"), payload),
  ]);
}

describe("generated plugin comparison", () => {
  it("recomputes current bytes instead of trusting an external inventory", async () => {
    await Promise.all([
      createTree(local, "local binding", "current local bytes"),
      createTree(remote, "remote binding", "different remote bytes"),
    ]);
    await expect(comparePluginTrees(local, remote)).rejects.toThrow(
      "Unexpected bundle differences",
    );
  });

  it("allows only mcp.json bytes to differ", async () => {
    await Promise.all([
      createTree(local, "local binding", "same payload"),
      createTree(remote, "remote binding", "same payload"),
    ]);
    await expect(comparePluginTrees(local, remote)).resolves.toMatchObject({
      differences: ["mcp.json"],
    });
  });
});

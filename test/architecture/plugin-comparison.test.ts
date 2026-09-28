import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { comparePluginTrees } from "../../scripts/compare-plugin.mjs";

const work = resolve("test/.plugin-comparison-work");
const local = resolve(work, "local");
const remote = resolve(work, "remote");

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

describe("generated plugin comparison", () => {
  it("rejects executable plugin code in the remote connection", async () => {
    await Promise.all([
      createLocalTree(local, "same-hash"),
      createRemoteTree(remote, "same-hash", true),
    ]);
    await expect(comparePluginTrees(local, remote)).rejects.toThrow(
      "contains executable plugin",
    );
  });

  it("binds the remote connection to the local artifact hash", async () => {
    await Promise.all([
      createLocalTree(local, "same-hash"),
      createRemoteTree(remote, "same-hash"),
    ]);
    await expect(comparePluginTrees(local, remote)).resolves.toMatchObject({
      artifactSha256: "same-hash",
    });
  });
});

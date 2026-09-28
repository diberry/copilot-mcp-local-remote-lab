import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveArtifactEntry } from "../src/artifact-loader.js";

const work: string[] = [];

afterEach(async () => {
  await Promise.all(
    work
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function createArtifact(entry: string, claimedBytes = entry) {
  const directory = await mkdtemp(resolve(tmpdir(), "plugin-artifact-"));
  work.push(directory);
  await writeFile(resolve(directory, "capability.js"), entry);
  const entrySha256 = createHash("sha256").update(claimedBytes).digest("hex");
  const payloadSha256 = createHash("sha256")
    .update(JSON.stringify([{ path: "capability.js", sha256: entrySha256 }]))
    .digest("hex");
  await writeFile(
    resolve(directory, "artifact.json"),
    JSON.stringify({
      pluginId: "copilot-mcp-local-remote-lab",
      pluginVersion: "1.0.0",
      entry: "capability.js",
      entrySha256,
      payloadSha256,
    }),
  );
  return directory;
}

describe("plugin artifact loader", () => {
  it("accepts bytes that match the signed manifest identity", async () => {
    const directory = await createArtifact("export const value = 1;");
    await expect(resolveArtifactEntry(directory)).resolves.toMatchObject({
      manifest: { pluginId: "copilot-mcp-local-remote-lab" },
    });
  });

  it("rejects artifact bytes changed after the manifest was written", async () => {
    const directory = await createArtifact(
      "export const value = 2;",
      "export const value = 1;",
    );
    await expect(resolveArtifactEntry(directory)).rejects.toThrow(
      "hash does not match",
    );
  });
});

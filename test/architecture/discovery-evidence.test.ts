import { existsSync } from "node:fs";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  persistDiscoveryEvidence,
  prepareDiscoveryEvidence,
} from "../../scripts/discovery-evidence.mjs";

const work = resolve("test/.discovery-evidence-work");

afterEach(() => rm(work, { recursive: true, force: true }));

describe("discovery evidence publication", () => {
  it("leaves no usable summary when adapter parity fails", async () => {
    await mkdir(work, { recursive: true });
    await writeFile(resolve(work, "summary.json"), '{"stale":true}\n');
    await prepareDiscoveryEvidence(work);
    await expect(
      persistDiscoveryEvidence({
        directory: work,
        local: [{ name: "local" }],
        remoteTest: [{ name: "remote" }],
        pluginIdentity: {
          pluginName: "copilot-mcp-local-remote-lab",
          pluginVersion: "1.0.0",
        },
      }),
    ).rejects.toThrow("discovery drift");
    expect(existsSync(resolve(work, "summary.json"))).toBe(false);
    expect(existsSync(resolve(work, "summary.json.tmp"))).toBe(false);
  });
});

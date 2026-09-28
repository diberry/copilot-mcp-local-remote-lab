import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("dependency boundaries", () => {
  it("passes the repository boundary verifier", async () => {
    const { stdout, stderr } = await execFileAsync(
      process.execPath,
      ["scripts/verify-boundaries.mjs"],
      { cwd: process.cwd() },
    );
    expect(stderr).toBe("");
    expect(stdout).toContain("Dependency and execution boundaries passed.");
  });
});

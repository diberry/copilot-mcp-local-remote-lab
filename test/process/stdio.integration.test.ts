import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("stdio process", () => {
  it("keeps diagnostics off stdout and exits when stdin closes", async () => {
    const child = spawn(
      process.execPath,
      ["--import", "tsx", "packages/mcp-server/src/stdio.ts"],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk) => (stdout += chunk));
    child.stderr.setEncoding("utf8").on("data", (chunk) => (stderr += chunk));
    child.stdin.end();
    const exitCode = await new Promise<number | null>((resolve) =>
      child.once("exit", resolve),
    );
    expect(exitCode).toBe(0);
    expect(stdout).toBe("");
    expect(stderr).toContain("starting on stdio");
  });
});

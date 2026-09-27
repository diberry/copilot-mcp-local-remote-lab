import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { filesUnder, root } from "./lib.mjs";
const required = [
  "README.md",
  "docs/concepts.md",
  "docs/architecture.md",
  "docs/local-setup.md",
  "docs/remote-setup.md",
  "docs/deployment.md",
  "docs/usage-lab.md",
  "docs/comparison-lab.md",
  "docs/video-lab.md",
  "docs/troubleshooting.md",
  "docs/security-and-privacy.md",
  "docs/cleanup-and-cost.md",
  "CONTRIBUTING.md",
  "docs/reference/tools.md",
  "docs/reference/configuration.md",
  "docs/reference/telemetry-schema.md",
];
for (const file of required) await readFile(resolve(root, file), "utf8");
for (const file of (await filesUnder(resolve(root, "docs"))).filter((file) =>
  file.endsWith(".md"),
)) {
  const text = await readFile(resolve(root, "docs", file), "utf8");
  if (
    !text.includes("learning repository") &&
    !text.includes("Learning repository")
  )
    throw new Error(`${file}: missing learning-only notice`);
  if (
    /\b(?:agent|skill|hook).{0,40}(?:runs|executes|hosted).{0,20}(?:ACA|Container Apps)/i.test(
      text,
    )
  )
    throw new Error(`${file}: ambiguous execution boundary`);
  for (const match of text.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g))
    if (!match[1]?.trim()) throw new Error(`${file}: image lacks alt text`);
}
console.log(
  `Documentation checks passed for ${required.length} required guides.`,
);

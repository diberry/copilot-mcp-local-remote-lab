import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { root } from "./lib.mjs";

for (const profile of ["local", "remote", "companion"]) {
  const plugin = JSON.parse(
    await readFile(resolve(root, `plugins/${profile}/plugin.json`), "utf8"),
  );
  const mcp = JSON.parse(
    await readFile(resolve(root, `plugins/${profile}/mcp.json`), "utf8"),
  );
  if (
    plugin.name !== "copilot-mcp-local-remote-lab" ||
    plugin.version !== "1.0.0"
  )
    throw new Error(`${profile}: identity mismatch`);
  if (Object.keys(mcp.mcpServers ?? {}).length !== 1)
    throw new Error(`${profile}: expected exactly one MCP server`);
  for (const forbidden of ["agents", "mcpServers"])
    if (plugin[forbidden] !== undefined)
      throw new Error(`${profile}: legacy field ${forbidden}`);
  if (
    (profile === "local" || profile === "companion") &&
    (typeof plugin.hooks !== "string" || !Array.isArray(plugin.skills))
  )
    throw new Error(`${profile}: client-native behavior is incomplete`);
  if (
    profile === "remote" &&
    (plugin.hooks !== undefined || plugin.skills !== undefined)
  )
    throw new Error("remote: connection surface cannot carry client behavior");
  const artifactFile =
    profile === "local" ? "artifact.json" : "server-artifact.json";
  const artifact = JSON.parse(
    await readFile(resolve(root, `plugins/${profile}/${artifactFile}`), "utf8"),
  );
  if (
    artifact.pluginId !== plugin.name ||
    artifact.pluginVersion !== plugin.version ||
    artifact.entry !== "dist/plugin/capability.js"
  )
    throw new Error(`${profile}: executable artifact identity mismatch`);
  if (profile === "companion") {
    const companion = JSON.parse(
      await readFile(resolve(root, "plugins/companion/companion.json"), "utf8"),
    );
    if (
      companion.profileId !== "company-mcp-thin-companion" ||
      !companion.retains.includes("custom-agent-instructions") ||
      !companion.retains.includes("skill-workflow") ||
      !companion.excludes.includes("plugin-capability-executable")
    )
      throw new Error("companion: profile contract is incomplete");
  }
}
const fidelity = JSON.parse(
  await readFile(
    resolve(root, "artifacts/plugin/runtime/capability/fidelity.json"),
    "utf8",
  ),
);
const statuses = new Set([
  "native",
  "mapped",
  "companion-required",
  "unsupported",
]);
const expectedCapabilities = new Set([
  "todo-tools",
  "domain-validation-and-errors",
  "custom-agent-instructions",
  "skill-workflow",
  "tool-lifecycle-hooks",
  "local-context",
  "company-context",
  "client-native-approval",
]);
if (
  fidelity.pluginId !== "copilot-mcp-local-remote-lab" ||
  !Array.isArray(fidelity.capabilities) ||
  fidelity.capabilities.length !== expectedCapabilities.size
)
  throw new Error("Capability fidelity inventory is incomplete.");
for (const capability of fidelity.capabilities) {
  if (
    !expectedCapabilities.delete(capability.id) ||
    !statuses.has(capability.client) ||
    !statuses.has(capability.companyMcp) ||
    typeof capability.source !== "string" ||
    typeof capability.evidence !== "string"
  )
    throw new Error(`Invalid fidelity record: ${capability.id ?? "unknown"}`);
}
if (expectedCapabilities.size !== 0)
  throw new Error("Capability fidelity inventory silently omitted behavior.");
console.log(
  "Generated complete-client, connection-only, and thin-companion profiles.",
);

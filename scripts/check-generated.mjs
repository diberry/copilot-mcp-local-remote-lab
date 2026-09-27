import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { root } from "./lib.mjs";

for (const profile of ["local", "remote"]) {
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
  if (typeof plugin.hooks !== "string")
    throw new Error(`${profile}: hooks must be a plugin-relative path`);
}
console.log(
  "Plugin bundles have one server and one Agent Plugins 1.0 identity.",
);

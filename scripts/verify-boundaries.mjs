import { readFile } from "node:fs/promises";
import { filesUnder, root } from "./lib.mjs";
import { resolve } from "node:path";
const coreFiles = (
  await filesUnder(resolve(root, "packages/todo-core/src"))
).filter((file) => file.endsWith(".ts"));
for (const file of coreFiles) {
  const text = await readFile(
    resolve(root, "packages/todo-core/src", file),
    "utf8",
  );
  if (/@modelcontextprotocol|node:http|process\./.test(text))
    throw new Error(`Transport leaked into todo core: ${file}`);
}
const adapters = await Promise.all(
  ["stdio.ts", "http.ts"].map((file) =>
    readFile(resolve(root, "packages/mcp-server/src", file), "utf8"),
  ),
);
if (adapters.some((text) => !text.includes("createServer")))
  throw new Error("Both adapters must use createServer.");
const [mainBicep, appBicep] = await Promise.all(
  ["infra/main.bicep", "infra/modules/container-app.bicep"].map((file) =>
    readFile(resolve(root, file), "utf8"),
  ),
);
if (
  !mainBicep.includes("param allowedOrigin string = 'https://copilot.local'") ||
  !mainBicep.includes("param mcpBearerToken string = ''") ||
  !mainBicep.includes("allowedOrigin: allowedOrigin") ||
  !mainBicep.includes("mcpBearerToken: mcpBearerToken") ||
  !appBicep.includes("{ name: 'ALLOWED_ORIGINS', value: allowedOrigin }") ||
  !appBicep.includes("{ name: 'STORAGE_MODE', value: 'memory' }") ||
  !appBicep.includes("maxReplicas: 1") ||
  !appBicep.includes(
    "{ name: 'MCP_BEARER_TOKEN', secretRef: 'mcp-bearer-token' }",
  )
)
  throw new Error(
    "Bicep and runner Origin defaults are not wired consistently.",
  );
console.log("Dependency and execution boundaries passed.");

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
for (const packageName of ["company-mcp-gateway", "server-plugin-runtime"]) {
  const files = await filesUnder(resolve(root, `packages/${packageName}/src`));
  for (const file of files) {
    const text = await readFile(
      resolve(root, `packages/${packageName}/src`, file),
      "utf8",
    );
    if (/plugin-capability|todo-core/.test(text))
      throw new Error(
        `${packageName} must load the artifact, not plugin source: ${file}`,
      );
  }
}
const [mainBicep, gatewayBicep, runtimeBicep] = await Promise.all(
  [
    "infra/main.bicep",
    "infra/modules/container-app.bicep",
    "infra/modules/plugin-runtime-app.bicep",
  ].map((file) => readFile(resolve(root, file), "utf8")),
);
if (
  !mainBicep.includes("param allowedOrigin string = 'https://copilot.local'") ||
  !mainBicep.includes("param mcpBearerToken string = ''") ||
  !mainBicep.includes("allowedOrigin: allowedOrigin") ||
  !mainBicep.includes("mcpBearerToken: mcpBearerToken") ||
  !mainBicep.includes(
    "pluginRuntimeUrl: 'https://${runtime.outputs.fqdn}/internal/mcp'",
  ) ||
  !gatewayBicep.includes("{ name: 'ALLOWED_ORIGINS', value: allowedOrigin }") ||
  !gatewayBicep.includes(
    "{ name: 'PLUGIN_RUNTIME_URL', value: pluginRuntimeUrl }",
  ) ||
  !gatewayBicep.includes("external: true") ||
  !runtimeBicep.includes("external: false") ||
  !runtimeBicep.includes("PLUGIN_ARTIFACT_ROOT") ||
  !gatewayBicep.includes("maxReplicas: 1") ||
  !runtimeBicep.includes("maxReplicas: 1") ||
  !gatewayBicep.includes(
    "{ name: 'MCP_BEARER_TOKEN', secretRef: 'mcp-bearer-token' }",
  )
)
  throw new Error(
    "Bicep does not preserve the public-gateway/private-runtime boundary.",
  );
console.log("Dependency and execution boundaries passed.");

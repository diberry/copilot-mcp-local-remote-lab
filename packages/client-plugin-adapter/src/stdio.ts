import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { fileURLToPath } from "node:url";
import { loadPluginArtifact } from "../../server-plugin-runtime/src/artifact-loader.js";

const artifact = await loadPluginArtifact(
  process.env.PLUGIN_ARTIFACT_ENTRY ??
    fileURLToPath(new URL("./capability.js", import.meta.url)),
);

console.error(
  `Starting ${artifact.PLUGIN_ID}@${artifact.PLUGIN_VERSION} from the client plugin artifact`,
);
await serveStdio(() => artifact.createPluginMcpServer({ placement: "client" }));

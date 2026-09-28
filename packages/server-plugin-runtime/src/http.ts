import { createServer as createHttpServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import { loadPluginArtifact, resolveArtifactEntry } from "./artifact-loader.js";

const port = Number(process.env.PORT ?? 3001);
const host = process.env.HOST ?? "0.0.0.0";
const artifactRoot = resolve(
  process.env.PLUGIN_ARTIFACT_ROOT ?? "artifacts/plugin/runtime",
);

export async function createRuntimeApp(root = artifactRoot) {
  const { entry, manifest } = await resolveArtifactEntry(root);
  const artifact = await loadPluginArtifact(entry);
  if (
    artifact.PLUGIN_ID !== manifest.pluginId ||
    artifact.PLUGIN_VERSION !== manifest.pluginVersion
  )
    throw new Error("Plugin artifact identity does not match artifact.json.");
  const pluginRuntime = artifact.createPluginRuntime({
    placement: "company-mcp",
    emitTelemetry: (event) =>
      console.error(JSON.stringify({ type: "plugin-runtime", ...event })),
  });

  return createHttpServer(async (req, res) => {
    if (req.url === "/healthz" || req.url === "/readyz") {
      res.writeHead(200, { "content-type": "application/json" }).end(
        JSON.stringify({
          status: "ok",
          pluginId: artifact.PLUGIN_ID,
          pluginVersion: artifact.PLUGIN_VERSION,
          artifactSha256: manifest.payloadSha256,
        }),
      );
      return;
    }
    if (req.url !== "/internal/mcp" || req.method !== "POST") {
      res.writeHead(404).end();
      return;
    }
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks);
    const request = new Request("http://plugin-runtime.internal/internal/mcp", {
      method: "POST",
      headers: Object.fromEntries(
        Object.entries(req.headers).flatMap(([key, value]) =>
          value === undefined
            ? []
            : [[key, Array.isArray(value) ? value.join(",") : value]],
        ),
      ),
      body,
    });
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    const server = pluginRuntime.createMcpServer();
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const app = await createRuntimeApp();
  app.listen(port, host, () =>
    console.error(`Server plugin runtime listening on ${host}:${port}`),
  );
}

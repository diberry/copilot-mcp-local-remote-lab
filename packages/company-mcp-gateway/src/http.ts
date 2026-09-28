import { timingSafeEqual } from "node:crypto";
import { createServer as createHttpServer } from "node:http";
import { fileURLToPath } from "node:url";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
const origins = (process.env.ALLOWED_ORIGINS ?? "http://127.0.0.1:3000").split(
  ",",
);
const runtimeUrl =
  process.env.PLUGIN_RUNTIME_URL ?? "http://127.0.0.1:3001/internal/mcp";
const maxBody = 1_048_576;

function equalSecret(actual: string, expected: string) {
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function authorized(header: string | undefined, token: string | undefined) {
  if (!token) return true;
  return (
    header?.startsWith("Bearer ") === true &&
    equalSecret(header.slice("Bearer ".length), token)
  );
}

export function createGatewayApp(target = runtimeUrl) {
  return createHttpServer(async (req, res) => {
    if (req.url === "/healthz" || req.url === "/readyz") {
      try {
        const runtime = await fetch(new URL("/readyz", target));
        res
          .writeHead(runtime.ok ? 200 : 503, {
            "content-type": "application/json",
          })
          .end(JSON.stringify({ status: runtime.ok ? "ok" : "unavailable" }));
      } catch {
        res
          .writeHead(503, { "content-type": "application/json" })
          .end('{"status":"unavailable"}');
      }
      return;
    }
    if (req.url !== "/mcp") {
      res.writeHead(404).end();
      return;
    }
    if (req.method !== "POST") {
      res.writeHead(405, { allow: "POST" }).end();
      return;
    }
    if (!origins.includes(req.headers.origin ?? "")) {
      res.writeHead(403).end();
      return;
    }
    if (!authorized(req.headers.authorization, process.env.MCP_BEARER_TOKEN)) {
      res.writeHead(401, { "www-authenticate": "Bearer" }).end();
      return;
    }
    if (
      !(req.headers["content-type"] ?? "")
        .toLowerCase()
        .startsWith("application/json")
    ) {
      res.writeHead(415).end();
      return;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > maxBody) {
        res.writeHead(413).end();
        return;
      }
      chunks.push(Buffer.from(chunk));
    }
    const started = performance.now();
    try {
      const response = await fetch(target, {
        method: "POST",
        headers: {
          "content-type": req.headers["content-type"] ?? "application/json",
          accept: req.headers.accept ?? "application/json, text/event-stream",
        },
        body: Buffer.concat(chunks),
      });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
      console.error(
        JSON.stringify({
          type: "company-gateway",
          outcome: response.ok ? "success" : "runtime-error",
          status: response.status,
          durationMs: performance.now() - started,
        }),
      );
    } catch (error) {
      console.error(
        JSON.stringify({
          type: "company-gateway",
          outcome: "unavailable",
          durationMs: performance.now() - started,
          error: error instanceof Error ? error.message : "unknown",
        }),
      );
      res.writeHead(502).end();
    }
  });
}

export const app = createGatewayApp();
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  app.listen(port, host, () =>
    console.error(`Company MCP gateway listening on ${host}:${port}`),
  );

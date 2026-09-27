import { createServer as createHttpServer } from "node:http";
import { fileURLToPath } from "node:url";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/server";
import { InMemoryTodoStorage, TodoService } from "../../todo-core/src/index.js";
import { isAllowedOrigin, isAuthorized } from "./auth.js";
import { createServer } from "./create-server.js";

const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? "0.0.0.0";
const origins = (process.env.ALLOWED_ORIGINS ?? "http://127.0.0.1:3000").split(
  ",",
);
const maxBody = 1_048_576;

export function createHttpApp(
  service = new TodoService(new InMemoryTodoStorage()),
) {
  return createHttpServer(async (req, res) => {
    if (req.url === "/healthz" || req.url === "/readyz") {
      res
        .writeHead(200, { "content-type": "application/json" })
        .end('{"status":"ok"}');
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
    if (!isAllowedOrigin(req.headers.origin ?? null, origins)) {
      res.writeHead(403).end();
      return;
    }
    if (
      !isAuthorized(
        req.headers.authorization ?? null,
        process.env.MCP_BEARER_TOKEN,
      )
    ) {
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
      chunks.push(chunk);
    }
    const url = `http://${req.headers.host ?? "127.0.0.1"}${req.url}`;
    const request = new Request(url, {
      method: "POST",
      headers: Object.fromEntries(
        Object.entries(req.headers).flatMap(([key, value]) =>
          value === undefined
            ? []
            : [[key, Array.isArray(value) ? value.join(",") : value]],
        ),
      ),
      body: Buffer.concat(chunks),
    });
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    const server = createServer("streamable-http", service);
    await server.connect(transport);
    const response = await transport.handleRequest(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  });
}

export const app = createHttpApp();
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1])
  app.listen(port, host, () =>
    console.error(`Todo MCP HTTP server listening on ${host}:${port}`),
  );

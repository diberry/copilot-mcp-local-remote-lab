import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
const server = createServer(async (req, res) => {
  if (req.url === "/health") return res.writeHead(200).end("ok");
  try {
    const html = await readFile("artifacts/video-report/index.html");
    res
      .writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": "default-src 'self' 'unsafe-inline'",
      })
      .end(html);
  } catch {
    res.writeHead(404).end("Run npm run video:prepare");
  }
});
server.listen(4173, "127.0.0.1");
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => server.close(() => process.exit()));

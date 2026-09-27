import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";
const server = createServer(async (req, res) => {
  if (req.url === "/health") return res.writeHead(200).end("ok");
  if (req.url?.startsWith("/videos/")) {
    const file = basename(req.url);
    if (!/^[\w-]+\.webm$/.test(file))
      return res.writeHead(400).end("Invalid video path");
    try {
      const video = await readFile(join("artifacts", "videos", file));
      return res
        .writeHead(200, {
          "content-type": "video/webm",
          "content-length": video.length,
          "accept-ranges": "bytes",
        })
        .end(video);
    } catch {
      return res.writeHead(404).end("Video not found");
    }
  }
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

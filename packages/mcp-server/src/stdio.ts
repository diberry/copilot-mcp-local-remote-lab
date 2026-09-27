import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./create-server.js";

console.error("Todo MCP server starting on stdio");
await serveStdio(() => createServer("stdio"));

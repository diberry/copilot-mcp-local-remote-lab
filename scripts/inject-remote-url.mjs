import { readFile, writeFile } from "node:fs/promises";
const endpoint = process.argv[2];
if (!endpoint || !/^https:\/\/[^/?#]+(?:\/.*)?$/.test(endpoint))
  throw new Error("Pass an HTTPS endpoint, without credentials.");
if (endpoint.includes("@"))
  throw new Error("Endpoint must not contain user information.");
const template = await readFile("config/mcp/remote.mcp.json.template", "utf8");
await writeFile(
  "mcp.json",
  template.replace(
    "https://REMOTE_ENDPOINT.example/mcp",
    `${endpoint.replace(/\/$/, "")}/mcp`.replace("/mcp/mcp", "/mcp"),
  ),
);
console.log(
  "Updated canonical mcp.json without credentials. Regenerate bundles next.",
);

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
console.log("Dependency and execution boundaries passed.");

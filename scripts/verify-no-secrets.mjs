import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { filesUnder, root } from "./lib.mjs";

const ignored = new Set(["package-lock.json"]);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /(?:client_secret|access_token|api[_-]?key)\s*[:=]\s*["'][^"']+/i,
  /"headers"\s*:\s*\{[^}]*authorization/i,
];
for (const file of await filesUnder(root)) {
  if (
    file.startsWith(".git/") ||
    file.startsWith("node_modules/") ||
    file.startsWith("artifacts/videos/") ||
    ignored.has(file)
  )
    continue;
  const data = await readFile(resolve(root, file));
  if (data.includes(0)) continue;
  const text = data.toString("utf8");
  for (const pattern of patterns)
    if (pattern.test(text)) throw new Error(`Possible secret in ${file}`);
}
console.log("No credential material found.");

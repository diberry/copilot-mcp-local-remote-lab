import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { root } from "./lib.mjs";

const local = JSON.parse(
  await readFile(
    resolve(root, "artifacts/plugin-inventory/local.sha256.json"),
    "utf8",
  ),
);
const remote = JSON.parse(
  await readFile(
    resolve(root, "artifacts/plugin-inventory/remote.sha256.json"),
    "utf8",
  ),
);
const localMap = new Map(local.map((item) => [item.path, item.sha256]));
const remoteMap = new Map(remote.map((item) => [item.path, item.sha256]));
const paths = [...new Set([...localMap.keys(), ...remoteMap.keys()])].sort();
const differences = paths.filter(
  (path) => localMap.get(path) !== remoteMap.get(path),
);
if (differences.length !== 1 || differences[0] !== "mcp.json")
  throw new Error(`Unexpected bundle differences: ${differences.join(", ")}`);
if (
  resolve(root, "plugins/local").startsWith(
    resolve(root, "artifacts/plugin-inventory"),
  )
)
  throw new Error("Inventories must be external.");
console.log(`Compared ${paths.length} files: only mcp.json differs.`);

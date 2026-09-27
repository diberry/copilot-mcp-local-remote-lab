import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";
import { inventory, root, sha256 } from "./lib.mjs";

const local = resolve(root, "plugins/local");
const remote = resolve(root, "plugins/remote");
await build({
  entryPoints: [resolve(root, "packages/mcp-server/src/stdio.ts")],
  outfile: resolve(root, "dist/plugin/stdio.js"),
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
});
const canonical = [
  "plugin.json",
  "skills",
  "com.github.copilot",
  "dist/plugin",
];
for (const output of [local, remote]) {
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  for (const item of canonical)
    await cp(resolve(root, item), resolve(output, item), { recursive: true });
}
await cp(
  resolve(root, "config/mcp/local.mcp.json"),
  resolve(local, "mcp.json"),
);
const endpoint =
  process.env.REMOTE_MCP_URL ?? "https://REMOTE_ENDPOINT.example/mcp";
if (!endpoint.startsWith("https://"))
  throw new Error("REMOTE_MCP_URL must use HTTPS.");
const template = await readFile(
  resolve(root, "config/mcp/remote.mcp.json.template"),
  "utf8",
);
await writeFile(
  resolve(remote, "mcp.json"),
  template.replace("https://REMOTE_ENDPOINT.example/mcp", endpoint),
);
await mkdir(resolve(root, "artifacts/plugin-inventory"), { recursive: true });
const inventories = {};
for (const [name, directory] of [
  ["local", local],
  ["remote", remote],
]) {
  inventories[name] = await inventory(directory);
  await writeFile(
    resolve(root, `artifacts/plugin-inventory/${name}.sha256.json`),
    `${JSON.stringify(inventories[name], null, 2)}\n`,
  );
}
const payloadInventory = inventories.local.filter(
  (item) => item.path !== "mcp.json",
);
const hashInventory = (value) => sha256(JSON.stringify(value));
await writeFile(
  resolve(root, "artifacts/plugin-inventory/summary.json"),
  `${JSON.stringify(
    {
      canonicalPayloadSha256: hashInventory(payloadInventory),
      localBundleSha256: hashInventory(inventories.local),
      remoteBundleSha256: hashInventory(inventories.remote),
      localBindingSha256: inventories.local.find(
        (item) => item.path === "mcp.json",
      ).sha256,
      remoteBindingSha256: inventories.remote.find(
        (item) => item.path === "mcp.json",
      ).sha256,
    },
    null,
    2,
  )}\n`,
);

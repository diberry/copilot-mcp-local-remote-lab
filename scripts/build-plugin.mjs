import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build } from "esbuild";
import { inventory, root, sha256 } from "./lib.mjs";

const local = resolve(root, "plugins/local");
const remote = resolve(root, "plugins/remote");
const companion = resolve(root, "plugins/companion");
const canonicalArtifact = resolve(root, "artifacts/plugin/canonical");
const runtimeArtifact = resolve(root, "artifacts/plugin/runtime");
await rm(resolve(root, "artifacts/plugin"), { recursive: true, force: true });
await mkdir(resolve(canonicalArtifact, "dist/plugin"), { recursive: true });
await build({
  entryPoints: [resolve(root, "packages/plugin-capability/src/index.ts")],
  outfile: resolve(canonicalArtifact, "dist/plugin/capability.js"),
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
});
await build({
  entryPoints: [resolve(root, "packages/client-plugin-adapter/src/stdio.ts")],
  outfile: resolve(canonicalArtifact, "dist/plugin/stdio.js"),
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node22",
});
const canonical = ["plugin.json", "capability", "skills", "com.github.copilot"];
for (const item of canonical)
  await cp(resolve(root, item), resolve(canonicalArtifact, item), {
    recursive: true,
  });
const capabilityBytes = await readFile(
  resolve(canonicalArtifact, "dist/plugin/capability.js"),
);
const artifactPayloadInventory = await inventory(canonicalArtifact);
await writeFile(
  resolve(canonicalArtifact, "artifact.json"),
  `${JSON.stringify(
    {
      schemaVersion: 1,
      pluginId: "copilot-mcp-local-remote-lab",
      pluginVersion: "1.0.0",
      entry: "dist/plugin/capability.js",
      entrySha256: sha256(capabilityBytes),
      payloadSha256: sha256(JSON.stringify(artifactPayloadInventory)),
    },
    null,
    2,
  )}\n`,
);
await cp(canonicalArtifact, runtimeArtifact, { recursive: true });
for (const output of [local, remote, companion]) {
  await rm(output, { recursive: true, force: true });
}
await cp(canonicalArtifact, local, { recursive: true });
await mkdir(remote, { recursive: true });
const plugin = JSON.parse(
  await readFile(resolve(canonicalArtifact, "plugin.json"), "utf8"),
);
delete plugin.skills;
delete plugin.hooks;
plugin.description =
  "Connect Copilot to the complete plugin artifact hosted behind company MCP.";
await writeFile(
  resolve(remote, "plugin.json"),
  `${JSON.stringify(plugin, null, 2)}\n`,
);
await cp(
  resolve(canonicalArtifact, "artifact.json"),
  resolve(remote, "server-artifact.json"),
);
await mkdir(companion, { recursive: true });
await cp(
  resolve(canonicalArtifact, "plugin.json"),
  resolve(companion, "plugin.json"),
);
await cp(resolve(canonicalArtifact, "skills"), resolve(companion, "skills"), {
  recursive: true,
});
await cp(
  resolve(canonicalArtifact, "com.github.copilot"),
  resolve(companion, "com.github.copilot"),
  { recursive: true },
);
await cp(
  resolve(root, "companion/profile.json"),
  resolve(companion, "companion.json"),
);
await cp(
  resolve(canonicalArtifact, "artifact.json"),
  resolve(companion, "server-artifact.json"),
);
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
await writeFile(
  resolve(companion, "mcp.json"),
  template.replace("https://REMOTE_ENDPOINT.example/mcp", endpoint),
);
await mkdir(resolve(root, "artifacts/plugin-inventory"), { recursive: true });
const inventories = {};
for (const [name, directory] of [
  ["local", local],
  ["remote", remote],
  ["companion", companion],
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
      companionBundleSha256: hashInventory(inventories.companion),
      serverArtifactSha256: sha256(JSON.stringify(artifactPayloadInventory)),
      localBindingSha256: inventories.local.find(
        (item) => item.path === "mcp.json",
      ).sha256,
      remoteBindingSha256: inventories.remote.find(
        (item) => item.path === "mcp.json",
      ).sha256,
      companionBindingSha256: inventories.companion.find(
        (item) => item.path === "mcp.json",
      ).sha256,
    },
    null,
    2,
  )}\n`,
);

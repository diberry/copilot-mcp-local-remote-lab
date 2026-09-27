import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { sha256 } from "./lib.mjs";

export async function prepareDiscoveryEvidence(directory) {
  await mkdir(directory, { recursive: true });
  await Promise.all([
    rm(resolve(directory, "summary.json"), { force: true }),
    rm(resolve(directory, "summary.json.tmp"), { force: true }),
  ]);
}

export async function readGeneratedPluginIdentity(root) {
  const manifests = await Promise.all(
    [
      "plugin.json",
      "plugins/local/plugin.json",
      "plugins/remote/plugin.json",
    ].map((file) =>
      readFile(resolve(root, file), "utf8").then((text) => JSON.parse(text)),
    ),
  );
  const [{ name, version }] = manifests;
  if (
    typeof name !== "string" ||
    typeof version !== "string" ||
    manifests.some(
      (manifest) => manifest.name !== name || manifest.version !== version,
    )
  )
    throw new Error("Generated and canonical plugin identities differ.");
  return { pluginName: name, pluginVersion: version };
}

export async function persistDiscoveryEvidence({
  directory,
  local,
  remoteTest,
  pluginIdentity,
}) {
  if (JSON.stringify(local) !== JSON.stringify(remoteTest))
    throw new Error("Client-visible discovery drift between actual adapters.");
  const summary = {
    schemaVersion: 1,
    source: "mcp-sdk-listTools",
    ...pluginIdentity,
    canonicalDiscoverySha256: sha256(JSON.stringify(local)),
    toolCount: local.length,
  };
  await Promise.all([
    writeFile(
      resolve(directory, "local.json"),
      `${JSON.stringify(local, null, 2)}\n`,
    ),
    writeFile(
      resolve(directory, "remote-test-loopback.json"),
      `${JSON.stringify(remoteTest, null, 2)}\n`,
    ),
  ]);
  const temporarySummary = resolve(directory, "summary.json.tmp");
  await writeFile(temporarySummary, `${JSON.stringify(summary, null, 2)}\n`);
  await rename(temporarySummary, resolve(directory, "summary.json"));
  return summary;
}

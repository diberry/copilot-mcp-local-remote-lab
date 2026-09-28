import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { inventory, root } from "./lib.mjs";

const identity = (plugin) => `${plugin.name}@${plugin.version}`;

export async function comparePluginTrees(
  localDirectory,
  remoteDirectory,
  { verifyInventories = false, inventoryDirectory } = {},
) {
  const [local, remote, expectedPlugin] = await Promise.all([
    inventory(localDirectory),
    inventory(remoteDirectory),
    readFile(resolve(root, "plugin.json"), "utf8").then(JSON.parse),
  ]);
  const localPaths = local.map(({ path }) => path);
  const remotePaths = remote.map(({ path }) => path);
  for (const required of [
    "artifact.json",
    "dist/plugin/capability.js",
    "dist/plugin/stdio.js",
  ])
    if (!localPaths.includes(required))
      throw new Error(`Local plugin is missing ${required}.`);
  for (const forbidden of [
    "artifact.json",
    "dist/plugin/capability.js",
    "dist/plugin/stdio.js",
  ])
    if (remotePaths.includes(forbidden))
      throw new Error(
        `Remote connection contains executable plugin: ${forbidden}`,
      );
  if (!remotePaths.includes("server-artifact.json"))
    throw new Error(
      "Remote connection is missing server artifact attestation.",
    );

  const [localPlugin, remotePlugin, localArtifact, remoteAttestation] =
    await Promise.all([
      readFile(resolve(localDirectory, "plugin.json"), "utf8").then(JSON.parse),
      readFile(resolve(remoteDirectory, "plugin.json"), "utf8").then(
        JSON.parse,
      ),
      readFile(resolve(localDirectory, "artifact.json"), "utf8").then(
        JSON.parse,
      ),
      readFile(resolve(remoteDirectory, "server-artifact.json"), "utf8").then(
        JSON.parse,
      ),
    ]);
  const expectedIdentity = identity(expectedPlugin);
  if (
    expectedPlugin.name !== "copilot-mcp-local-remote-lab" ||
    !/^\d+\.\d+\.\d+$/.test(expectedPlugin.version)
  )
    throw new Error("Canonical plugin identity/version is invalid.");
  if (
    identity(localPlugin) !== expectedIdentity ||
    identity(remotePlugin) !== expectedIdentity
  )
    throw new Error(
      `Plugin identity/version mismatch; expected ${expectedIdentity}.`,
    );
  if (localArtifact.payloadSha256 !== remoteAttestation.payloadSha256)
    throw new Error("Remote connection attests a different plugin artifact.");
  if (remotePlugin.skills !== undefined || remotePlugin.hooks !== undefined)
    throw new Error("Remote connection contains client plugin behavior.");

  if (verifyInventories) {
    if (!inventoryDirectory)
      throw new Error("inventoryDirectory is required to verify inventories.");
    const [externalLocal, externalRemote] = await Promise.all(
      ["local", "remote"].map((profile) =>
        readFile(
          resolve(inventoryDirectory, `${profile}.sha256.json`),
          "utf8",
        ).then(JSON.parse),
      ),
    );
    if (
      JSON.stringify(externalLocal) !== JSON.stringify(local) ||
      JSON.stringify(externalRemote) !== JSON.stringify(remote)
    )
      throw new Error(
        "External plugin inventory does not match generated files.",
      );
  }
  return {
    localFileCount: localPaths.length,
    remoteFileCount: remotePaths.length,
    artifactSha256: localArtifact.payloadSha256,
  };
}

async function main() {
  const result = await comparePluginTrees(
    resolve(root, "plugins/local"),
    resolve(root, "plugins/remote"),
    {
      verifyInventories: process.argv.includes("--verify-inventories"),
      inventoryDirectory: resolve(root, "artifacts/plugin-inventory"),
    },
  );
  console.log(
    `Verified local execution and remote connection placement for plugin artifact ${result.artifactSha256}.`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();

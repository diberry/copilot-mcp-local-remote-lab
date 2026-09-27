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
  if (JSON.stringify(localPaths) !== JSON.stringify(remotePaths))
    throw new Error("Generated plugin file lists differ.");

  const localMap = new Map(local.map((item) => [item.path, item.sha256]));
  const remoteMap = new Map(remote.map((item) => [item.path, item.sha256]));
  const differences = localPaths.filter(
    (path) => localMap.get(path) !== remoteMap.get(path),
  );
  if (differences.length !== 1 || differences[0] !== "mcp.json")
    throw new Error(`Unexpected bundle differences: ${differences.join(", ")}`);

  const [localPlugin, remotePlugin] = await Promise.all(
    [localDirectory, remoteDirectory].map((directory) =>
      readFile(resolve(directory, "plugin.json"), "utf8").then(JSON.parse),
    ),
  );
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
  return { fileCount: localPaths.length, differences };
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
    `Compared ${result.fileCount} generated files directly: only mcp.json differs.`,
  );
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) await main();

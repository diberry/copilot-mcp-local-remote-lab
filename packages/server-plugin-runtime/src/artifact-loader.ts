import { createHash } from "node:crypto";
import { access, readdir, readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import type { McpServer } from "@modelcontextprotocol/server";

export interface LoadedPluginArtifact {
  PLUGIN_ID: string;
  PLUGIN_VERSION: string;
  createPluginMcpServer(options: {
    placement: "client" | "company-mcp";
    emitTelemetry?: (event: Record<string, unknown>) => void;
  }): McpServer;
  createPluginRuntime(options: {
    placement: "client" | "company-mcp";
    emitTelemetry?: (event: Record<string, unknown>) => void;
  }): { createMcpServer(): McpServer };
}

interface ArtifactManifest {
  pluginId: string;
  pluginVersion: string;
  entry: string;
  entrySha256: string;
  payloadSha256: string;
}

const sha256 = (value: string | Buffer) =>
  createHash("sha256").update(value).digest("hex");

async function artifactInventory(directory: string) {
  const files: string[] = [];
  async function walk(current: string) {
    for (const item of await readdir(current, { withFileTypes: true })) {
      const path = resolve(current, item.name);
      if (item.isDirectory()) await walk(path);
      else {
        const name = relative(directory, path).replaceAll("\\", "/");
        if (name !== "artifact.json") files.push(name);
      }
    }
  }
  await walk(directory);
  files.sort();
  return Promise.all(
    files.map(async (path) => ({
      path,
      sha256: sha256(await readFile(resolve(directory, path))),
    })),
  );
}

export async function resolveArtifactEntry(artifactRoot: string) {
  const manifestPath = resolve(artifactRoot, "artifact.json");
  const manifest = JSON.parse(
    await readFile(manifestPath, "utf8"),
  ) as ArtifactManifest;
  if (
    typeof manifest.pluginId !== "string" ||
    typeof manifest.pluginVersion !== "string" ||
    typeof manifest.entry !== "string" ||
    typeof manifest.entrySha256 !== "string" ||
    typeof manifest.payloadSha256 !== "string"
  )
    throw new Error(`Invalid plugin artifact manifest: ${manifestPath}`);
  const entry = resolve(dirname(manifestPath), manifest.entry);
  await access(entry);
  const entrySha256 = sha256(await readFile(entry));
  if (entrySha256 !== manifest.entrySha256)
    throw new Error("Plugin artifact entry hash does not match artifact.json.");
  const payloadSha256 = sha256(
    JSON.stringify(await artifactInventory(dirname(manifestPath))),
  );
  if (payloadSha256 !== manifest.payloadSha256)
    throw new Error(
      "Complete plugin artifact hash does not match artifact.json.",
    );
  return { entry, manifest };
}

export async function loadPluginArtifact(entryPath: string) {
  await access(entryPath);
  const artifact = (await import(
    `${pathToFileURL(resolve(entryPath)).href}?loaded=${Date.now()}`
  )) as Partial<LoadedPluginArtifact>;
  if (
    typeof artifact.PLUGIN_ID !== "string" ||
    typeof artifact.PLUGIN_VERSION !== "string" ||
    typeof artifact.createPluginMcpServer !== "function" ||
    typeof artifact.createPluginRuntime !== "function"
  )
    throw new Error(`Invalid executable plugin artifact: ${entryPath}`);
  return artifact as LoadedPluginArtifact;
}

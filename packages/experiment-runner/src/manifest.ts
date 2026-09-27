import * as z from "zod/v4";

const sha = z.string().regex(/^[a-f0-9]{64}$/);
export const ExperimentManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    pluginId: z.literal("copilot-mcp-local-remote-lab"),
    pluginVersion: z.string(),
    canonicalPayloadSha256: sha,
    localBundleSha256: sha,
    remoteBundleSha256: sha,
    localBindingSha256: sha,
    remoteBindingSha256: sha,
    sourceCommit: z.string(),
    remoteImageDigest: z.string(),
    acaRevision: z.string(),
    protocolVersion: z.string(),
    copilotClientVersion: z.string(),
    nodeVersion: z.string(),
    browserVersion: z.string(),
    toolVersions: z.record(z.string(), z.string()),
    azureRegion: z.string(),
    scalingProfile: z.enum(["warm", "cold"]),
    authMode: z.enum(["none", "bearer", "entra"]),
    storageMode: z.enum(["memory", "optional-persistence"]),
    replicaCount: z.number().int().positive(),
    temperature: z.enum(["warm", "cold"]),
    syntheticSeed: z.string(),
    scenarioVersion: z.literal("1.0.0"),
    pairId: z.string(),
    runOrder: z.enum(["local-remote", "remote-local"]),
    timestampUtc: z.iso.datetime(),
    cell: z.enum([
      "baseline",
      "cold-start",
      "authentication",
      "persistence-replicas",
      "failure",
    ]),
  })
  .strict();

export type ExperimentManifest = z.infer<typeof ExperimentManifestSchema>;

export function validateBaseline(manifest: ExperimentManifest) {
  if (manifest.cell !== "baseline") return;
  if (
    manifest.authMode !== "none" ||
    manifest.storageMode !== "memory" ||
    manifest.replicaCount !== 1 ||
    manifest.temperature !== "warm" ||
    manifest.scalingProfile !== "warm"
  ) {
    throw new Error(
      "Baseline confound: auth, storage, replicas, and temperature must remain fixed.",
    );
  }
}

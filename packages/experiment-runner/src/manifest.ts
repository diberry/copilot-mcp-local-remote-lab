import * as z from "zod/v4";

const sha = z.string().regex(/^[a-f0-9]{64}$/);
const imageDigest = z.string().regex(/^sha256:[a-f0-9]{64}$/);
export const ExperimentCellSchema = z.enum(["baseline", "authentication"]);
export const ExperimentManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    pluginId: z.literal("copilot-mcp-local-remote-lab"),
    pluginVersion: z.string(),
    canonicalPayloadSha256: sha,
    localBundleSha256: sha,
    remoteBundleSha256: sha,
    companionBundleSha256: sha,
    localBindingSha256: sha,
    remoteBindingSha256: sha,
    companionBindingSha256: sha,
    serverArtifactSha256: sha,
    sourceCommit: z.string(),
    evidenceTier: z.enum(["remote-test", "live-aca"]),
    remoteEndpoint: z.enum(["loopback", "deployed-aca"]),
    azureResourceGroup: z.string().nullable(),
    azureContainerAppName: z.string().nullable(),
    azureRuntimeAppName: z.string().nullable(),
    azureSubscriptionVerified: z.literal(true).nullable(),
    remoteEndpointHost: z.string().nullable(),
    remoteEndpointUrl: z.string().nullable(),
    remoteImageReference: z.string().nullable(),
    remoteImageDigest: imageDigest.nullable(),
    acaRevision: z
      .string()
      .regex(/^[a-z0-9][a-z0-9.-]*$/i)
      .nullable(),
    runtimeImageReference: z.string().nullable(),
    runtimeImageDigest: imageDigest.nullable(),
    runtimeRevision: z
      .string()
      .regex(/^[a-z0-9][a-z0-9.-]*$/i)
      .nullable(),
    runtimeInternalHost: z.string().nullable(),
    protocolVersion: z.string(),
    copilotClientVersion: z.string(),
    nodeVersion: z.string(),
    browserVersion: z.string(),
    toolVersions: z.record(z.string(), z.string()),
    azureRegion: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .nullable(),
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
    cell: ExperimentCellSchema,
  })
  .strict()
  .superRefine((manifest, context) => {
    if (
      manifest.evidenceTier === "remote-test" &&
      (manifest.remoteEndpoint !== "loopback" ||
        manifest.azureResourceGroup !== null ||
        manifest.azureContainerAppName !== null ||
        manifest.azureRuntimeAppName !== null ||
        manifest.azureSubscriptionVerified !== null ||
        manifest.remoteEndpointHost !== null ||
        manifest.remoteEndpointUrl !== null ||
        manifest.remoteImageReference !== null ||
        manifest.remoteImageDigest !== null ||
        manifest.acaRevision !== null ||
        manifest.runtimeImageReference !== null ||
        manifest.runtimeImageDigest !== null ||
        manifest.runtimeRevision !== null ||
        manifest.runtimeInternalHost !== null ||
        manifest.azureRegion !== null)
    )
      context.addIssue({
        code: "custom",
        message:
          "remote-test evidence must identify loopback and omit ACA metadata.",
      });
    if (
      manifest.evidenceTier === "live-aca" &&
      (manifest.remoteEndpoint !== "deployed-aca" ||
        !manifest.azureResourceGroup ||
        !manifest.azureContainerAppName ||
        !manifest.azureRuntimeAppName ||
        manifest.azureSubscriptionVerified !== true ||
        !manifest.remoteEndpointHost ||
        !manifest.remoteEndpointUrl ||
        !manifest.remoteImageReference ||
        !manifest.acaRevision ||
        !manifest.runtimeImageReference ||
        !manifest.runtimeRevision ||
        !manifest.runtimeInternalHost ||
        !manifest.azureRegion)
    )
      context.addIssue({
        code: "custom",
        message: "live-aca evidence requires deployed ACA metadata.",
      });
    if (
      manifest.evidenceTier === "live-aca" &&
      manifest.remoteEndpointHost &&
      manifest.remoteEndpointUrl
    ) {
      let endpoint;
      try {
        endpoint = new URL(manifest.remoteEndpointUrl);
      } catch {
        context.addIssue({
          code: "custom",
          message: "live-aca evidence has an invalid endpoint URL.",
        });
        return;
      }
      if (
        endpoint.protocol !== "https:" ||
        endpoint.pathname !== "/mcp" ||
        endpoint.username ||
        endpoint.password ||
        endpoint.search ||
        endpoint.hash ||
        endpoint.port ||
        !endpoint.hostname.endsWith(".azurecontainerapps.io") ||
        endpoint.hostname !== manifest.remoteEndpointHost
      )
        context.addIssue({
          code: "custom",
          message:
            "live-aca endpoint URL and host must identify the same Azure Container Apps /mcp endpoint.",
        });
    }
  });

export type ExperimentManifest = z.infer<typeof ExperimentManifestSchema>;
export type ExperimentCell = z.infer<typeof ExperimentCellSchema>;

export function resolveExperimentCell(
  value: string | undefined,
): ExperimentCell {
  const selected = value ?? "baseline";
  if (["cold-start", "persistence-replicas", "failure"].includes(selected))
    throw new Error(
      `EXPERIMENT_CELL=${selected} is not implemented; run that follow-on manually without labeling it as runner evidence.`,
    );
  const parsed = ExperimentCellSchema.safeParse(selected);
  if (!parsed.success)
    throw new Error(
      "EXPERIMENT_CELL must be baseline or authentication in this build.",
    );
  return parsed.data;
}

export function experimentArtifactPath(cell: string): string {
  return `artifacts/experiments/${resolveExperimentCell(cell)}.json`;
}

function validateFixedControls(manifest: ExperimentManifest) {
  if (
    manifest.storageMode !== "memory" ||
    manifest.replicaCount !== 1 ||
    manifest.temperature !== "warm" ||
    manifest.scalingProfile !== "warm"
  )
    throw new Error(
      "Experiment cell confound: storage, replicas, and temperature must match the warm in-memory baseline.",
    );
}

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

export function validateExperiment(manifest: ExperimentManifest) {
  validateFixedControls(manifest);
  validateBaseline(manifest);
  if (manifest.authMode === "bearer" && manifest.cell !== "authentication")
    throw new Error(
      "Bearer authentication evidence must use the authentication cell.",
    );
  if (manifest.cell === "authentication" && manifest.authMode !== "bearer")
    throw new Error("The authentication cell requires bearer authentication.");
}

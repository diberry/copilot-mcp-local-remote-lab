import { execFile } from "node:child_process";
import { promisify } from "node:util";
import * as z from "zod/v4";

const execFileAsync = promisify(execFile);
const EnvironmentVariableSchema = z
  .object({
    name: z.string(),
    value: z.string().optional(),
    secretRef: z.string().optional(),
  })
  .passthrough();
const ContainerAppSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    resourceGroup: z.string(),
    location: z.string(),
    properties: z
      .object({
        latestRevisionName: z.string(),
        latestReadyRevisionName: z.string(),
        configuration: z
          .object({
            activeRevisionsMode: z.string(),
            ingress: z
              .object({ fqdn: z.string(), external: z.boolean() })
              .passthrough(),
          })
          .passthrough(),
        template: z
          .object({
            containers: z.array(
              z
                .object({
                  name: z.string(),
                  image: z.string(),
                  env: z.array(EnvironmentVariableSchema).default([]),
                })
                .passthrough(),
            ),
            scale: z
              .object({
                minReplicas: z.number().int(),
                maxReplicas: z.number().int(),
              })
              .passthrough(),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();

export interface AcaResourceRequest {
  resourceGroup: string;
  appName: string;
  subscription?: string;
  endpoint: URL;
  origin: string;
  authMode: "none" | "bearer";
}

export interface AcaResourceEvidence {
  azureResourceGroup: string;
  azureContainerAppName: string;
  azureSubscriptionVerified: true;
  remoteEndpointHost: string;
  remoteEndpointUrl: string;
  remoteImageReference: string;
  remoteImageDigest: string | null;
  acaRevision: string;
  azureRegion: string;
  replicaCount: 1;
  storageMode: "memory";
  scalingProfile: "warm";
}

export interface AcaRuntimeEvidence {
  azureRuntimeAppName: string;
  runtimeImageReference: string;
  runtimeImageDigest: string | null;
  runtimeRevision: string;
  runtimeInternalHost: string;
}

function environmentValue(
  environment: z.infer<typeof EnvironmentVariableSchema>[],
  name: string,
) {
  return environment.find((item) => item.name === name);
}

export function parseAcaResourceEvidence(
  input: unknown,
  expected: AcaResourceRequest,
): AcaResourceEvidence {
  const resource = ContainerAppSchema.parse(
    typeof input === "string" ? JSON.parse(input) : input,
  );
  const subscriptionId = /^\/subscriptions\/([^/]+)\//i.exec(resource.id)?.[1];
  if (
    !subscriptionId ||
    resource.resourceGroup.toLowerCase() !==
      expected.resourceGroup.toLowerCase() ||
    resource.name.toLowerCase() !== expected.appName.toLowerCase() ||
    (expected.subscription &&
      subscriptionId.toLowerCase() !== expected.subscription.toLowerCase())
  )
    throw new Error("Azure Container App resource identity mismatch.");
  if (
    resource.properties.configuration.ingress.fqdn.toLowerCase() !==
      expected.endpoint.hostname.toLowerCase() ||
    resource.properties.configuration.ingress.external !== true
  )
    throw new Error("Azure Container App ingress host mismatch.");
  if (
    resource.properties.configuration.activeRevisionsMode.toLowerCase() !==
      "single" ||
    resource.properties.latestRevisionName !==
      resource.properties.latestReadyRevisionName
  )
    throw new Error("Azure Container App active/latest revision mismatch.");

  const container = resource.properties.template.containers.find(
    (candidate) => candidate.name === "company-mcp-gateway",
  );
  if (!container?.image)
    throw new Error("Azure gateway image reference is unavailable.");
  const scale = resource.properties.template.scale;
  if (scale.minReplicas !== 1 || scale.maxReplicas !== 1)
    throw new Error(
      "Azure Container App evidence requires exactly one warm replica.",
    );
  if (
    environmentValue(container.env, "ALLOWED_ORIGINS")?.value !==
    expected.origin
  )
    throw new Error("Azure Container App allowed Origin mismatch.");
  const bearer = environmentValue(container.env, "MCP_BEARER_TOKEN");
  if (
    (expected.authMode === "bearer" &&
      (!bearer?.secretRef || bearer.value !== undefined)) ||
    (expected.authMode === "none" && bearer !== undefined)
  )
    throw new Error(
      "Azure Container App authentication configuration mismatch.",
    );

  const digest = /@?(sha256:[a-f0-9]{64})$/i.exec(container.image)?.[1] ?? null;
  return {
    azureResourceGroup: resource.resourceGroup,
    azureContainerAppName: resource.name,
    azureSubscriptionVerified: true,
    remoteEndpointHost: expected.endpoint.hostname,
    remoteEndpointUrl: expected.endpoint.href,
    remoteImageReference: container.image,
    remoteImageDigest: digest?.toLowerCase() ?? null,
    acaRevision: resource.properties.latestReadyRevisionName,
    azureRegion: resource.location,
    replicaCount: 1,
    storageMode: "memory",
    scalingProfile: "warm",
  };
}

export function parseAcaRuntimeEvidence(
  input: unknown,
  expected: Pick<
    AcaResourceRequest,
    "resourceGroup" | "appName" | "subscription"
  >,
): AcaRuntimeEvidence {
  const resource = ContainerAppSchema.parse(
    typeof input === "string" ? JSON.parse(input) : input,
  );
  const subscriptionId = /^\/subscriptions\/([^/]+)\//i.exec(resource.id)?.[1];
  if (
    !subscriptionId ||
    resource.resourceGroup.toLowerCase() !==
      expected.resourceGroup.toLowerCase() ||
    resource.name.toLowerCase() !== expected.appName.toLowerCase() ||
    (expected.subscription &&
      subscriptionId.toLowerCase() !== expected.subscription.toLowerCase())
  )
    throw new Error("Azure plugin runtime resource identity mismatch.");
  if (
    resource.properties.configuration.ingress.external !== false ||
    resource.properties.configuration.activeRevisionsMode.toLowerCase() !==
      "single" ||
    resource.properties.latestRevisionName !==
      resource.properties.latestReadyRevisionName
  )
    throw new Error("Azure plugin runtime ingress or revision mismatch.");
  const container = resource.properties.template.containers.find(
    (candidate) => candidate.name === "plugin-runtime",
  );
  if (!container?.image)
    throw new Error("Azure plugin runtime image reference is unavailable.");
  if (
    environmentValue(container.env, "PLUGIN_ARTIFACT_ROOT")?.value !==
    "/app/artifacts/plugin/runtime"
  )
    throw new Error("Azure plugin runtime artifact root mismatch.");
  const scale = resource.properties.template.scale;
  if (scale.minReplicas !== 1 || scale.maxReplicas !== 1)
    throw new Error("Azure plugin runtime requires exactly one warm replica.");
  const digest = /@?(sha256:[a-f0-9]{64})$/i.exec(container.image)?.[1] ?? null;
  return {
    azureRuntimeAppName: resource.name,
    runtimeImageReference: container.image,
    runtimeImageDigest: digest?.toLowerCase() ?? null,
    runtimeRevision: resource.properties.latestReadyRevisionName,
    runtimeInternalHost: resource.properties.configuration.ingress.fqdn,
  };
}

export async function queryAcaResourceEvidence(
  expected: AcaResourceRequest,
): Promise<AcaResourceEvidence> {
  const args = [
    "containerapp",
    "show",
    "--resource-group",
    expected.resourceGroup,
    "--name",
    expected.appName,
    "--output",
    "json",
  ];
  if (expected.subscription) args.push("--subscription", expected.subscription);
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync("az", args, {
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
    }));
  } catch {
    throw new Error(
      "Azure Container App query failed; live-aca evidence was not accepted.",
    );
  }
  return parseAcaResourceEvidence(stdout, expected);
}

export async function queryAcaRuntimeEvidence(
  expected: Pick<
    AcaResourceRequest,
    "resourceGroup" | "appName" | "subscription"
  >,
): Promise<AcaRuntimeEvidence> {
  const args = [
    "containerapp",
    "show",
    "--resource-group",
    expected.resourceGroup,
    "--name",
    expected.appName,
    "--output",
    "json",
  ];
  if (expected.subscription) args.push("--subscription", expected.subscription);
  let stdout: string;
  try {
    ({ stdout } = await execFileAsync("az", args, {
      windowsHide: true,
      maxBuffer: 4 * 1024 * 1024,
    }));
  } catch {
    throw new Error(
      "Azure plugin runtime query failed; live-aca evidence was not accepted.",
    );
  }
  return parseAcaRuntimeEvidence(stdout, expected);
}

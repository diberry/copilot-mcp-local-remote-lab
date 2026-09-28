import { describe, expect, it, vi } from "vitest";
import { proveBearerEnforcement } from "../src/auth-proof.js";
import {
  parseAcaResourceEvidence,
  parseAcaRuntimeEvidence,
} from "../src/azure-evidence.js";
import { withCleanup } from "../src/cleanup.js";
import { median, p95 } from "../src/metrics.js";
import {
  experimentArtifactPath,
  ExperimentManifestSchema,
  resolveExperimentCell,
  validateBaseline,
  validateExperiment,
} from "../src/manifest.js";
import {
  isLoopbackHostname,
  resolveAuthMode,
  resolveExperimentOrigin,
  resolveRemoteTarget,
} from "../src/remote-target.js";
import manifest from "../../../examples/experiment-manifest.json" with { type: "json" };

const acaRequest = {
  resourceGroup: "rg-lab",
  appName: "ca-lab",
  subscription: "00000000-0000-0000-0000-000000000001",
  endpoint: new URL("https://lab.westus2.azurecontainerapps.io/mcp"),
  origin: "https://copilot.local",
  authMode: "none" as const,
};
const acaEnvironment: Array<{
  name: string;
  value?: string;
  secretRef?: string;
}> = [{ name: "ALLOWED_ORIGINS", value: "https://copilot.local" }];
const acaResource = {
  id: `/subscriptions/${acaRequest.subscription}/resourceGroups/rg-lab/providers/Microsoft.App/containerApps/ca-lab`,
  name: "ca-lab",
  resourceGroup: "rg-lab",
  location: "westus2",
  properties: {
    latestRevisionName: "ca-lab--revision1",
    latestReadyRevisionName: "ca-lab--revision1",
    configuration: {
      activeRevisionsMode: "Single",
      ingress: { fqdn: "lab.westus2.azurecontainerapps.io", external: true },
    },
    template: {
      containers: [
        {
          name: "company-mcp-gateway",
          image: `acr.azurecr.io/mcp@sha256:${"a".repeat(64)}`,
          env: acaEnvironment,
        },
      ],
      scale: { minReplicas: 1, maxReplicas: 1 },
    },
  },
};
const runtimeResource = {
  ...structuredClone(acaResource),
  name: "ca-lab-runtime",
  id: `/subscriptions/${acaRequest.subscription}/resourceGroups/rg-lab/providers/Microsoft.App/containerApps/ca-lab-runtime`,
  properties: {
    ...structuredClone(acaResource.properties),
    latestRevisionName: "ca-lab-runtime--revision1",
    latestReadyRevisionName: "ca-lab-runtime--revision1",
    configuration: {
      activeRevisionsMode: "Single",
      ingress: {
        fqdn: "ca-lab-runtime.internal.azurecontainerapps.io",
        external: false,
      },
    },
    template: {
      ...structuredClone(acaResource.properties.template),
      containers: [
        {
          name: "plugin-runtime",
          image: `acr.azurecr.io/runtime@sha256:${"b".repeat(64)}`,
          env: [
            {
              name: "PLUGIN_ARTIFACT_ROOT",
              value: "/app/artifacts/plugin/runtime",
            },
          ],
        },
      ],
    },
  },
};

describe("experiment controls", () => {
  it("calculates conventional median and nearest-rank p95", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(p95(Array.from({ length: 20 }, (_, index) => index + 1))).toBe(19);
  });
  it("accepts the fixture and rejects a baseline confound", () => {
    const parsed = ExperimentManifestSchema.parse(manifest);
    expect(() => validateBaseline(parsed)).not.toThrow();
    expect(() => validateBaseline({ ...parsed, authMode: "bearer" })).toThrow(
      "Baseline confound",
    );
  });
  it("labels default HTTP evidence as loopback remote-test", () => {
    expect(resolveRemoteTarget([])).toEqual({
      evidenceTier: "remote-test",
      url: undefined,
    });
  });
  it("requires explicit authorization for a deployed HTTPS endpoint", () => {
    expect(() =>
      resolveRemoteTarget([
        "--remote-url",
        "https://lab.westus2.azurecontainerapps.io/mcp",
      ]),
    ).toThrow("explicit");
    expect(
      resolveRemoteTarget([
        "--remote-url",
        "https://lab.westus2.azurecontainerapps.io/mcp",
        "--live-aca-authorized",
      ]),
    ).toMatchObject({ evidenceTier: "live-aca" });
    expect(() =>
      resolveRemoteTarget([
        "--remote-url",
        "http://127.0.0.1:3000/mcp",
        "--live-aca-authorized",
      ]),
    ).toThrow("*.azurecontainerapps.io/mcp");
  });
  it.each([
    "localhost",
    "localhost.",
    "service.localhost",
    "127.0.0.1",
    "127.255.255.254",
    "127.1",
    "0177.0.0.1",
    "[::1]",
    "[0:0:0:0:0:0:0:1]",
    "[::ffff:127.0.0.1]",
    "[::ffff:7f00:1]",
    "[0:0:0:0:0:ffff:7f00:1]",
    "[::127.0.0.1]",
  ])("rejects live ACA loopback representation %s", (hostname) => {
    expect(() =>
      resolveRemoteTarget([
        "--remote-url",
        `https://${hostname}/mcp`,
        "--live-aca-authorized",
      ]),
    ).toThrow("*.azurecontainerapps.io/mcp");
  });
  it("accepts non-loopback hosts after loopback normalization", () => {
    expect(isLoopbackHostname("128.0.0.1")).toBe(false);
    expect(
      resolveRemoteTarget([
        "--remote-url",
        "https://lab.westus2.azurecontainerapps.io/mcp",
        "--live-aca-authorized",
      ]),
    ).toMatchObject({ evidenceTier: "live-aca" });
  });
  it.each([
    "https://user:pass@lab.westus2.azurecontainerapps.io/mcp",
    "https://lab.westus2.azurecontainerapps.io/mcp?sample=1",
    "https://lab.westus2.azurecontainerapps.io/mcp#sample",
    "https://lab.westus2.azurecontainerapps.io/",
    "https://lab.westus2.azurecontainerapps.io/mcp/",
    "https://example.test/mcp",
  ])("rejects non-baseline live ACA URL %s", (url) => {
    expect(() =>
      resolveRemoteTarget(["--remote-url", url, "--live-aca-authorized"]),
    ).toThrow("*.azurecontainerapps.io/mcp");
  });
  it("derives live evidence from Azure Container App resource data", () => {
    expect(parseAcaResourceEvidence(acaResource, acaRequest)).toMatchObject({
      azureResourceGroup: "rg-lab",
      azureContainerAppName: "ca-lab",
      azureSubscriptionVerified: true,
      remoteEndpointHost: "lab.westus2.azurecontainerapps.io",
      remoteEndpointUrl: "https://lab.westus2.azurecontainerapps.io/mcp",
      remoteImageReference: `acr.azurecr.io/mcp@sha256:${"a".repeat(64)}`,
      remoteImageDigest: `sha256:${"a".repeat(64)}`,
      acaRevision: "ca-lab--revision1",
      azureRegion: "westus2",
      replicaCount: 1,
      storageMode: "memory",
      scalingProfile: "warm",
    });
    const authenticated = structuredClone(acaResource);
    authenticated.properties.template.containers[0]!.env.push({
      name: "MCP_BEARER_TOKEN",
      secretRef: "mcp-bearer-token",
    });
    expect(() =>
      parseAcaResourceEvidence(authenticated, {
        ...acaRequest,
        authMode: "bearer",
      }),
    ).not.toThrow();
    expect(
      parseAcaRuntimeEvidence(runtimeResource, {
        resourceGroup: "rg-lab",
        appName: "ca-lab-runtime",
        subscription: acaRequest.subscription,
      }),
    ).toMatchObject({
      azureRuntimeAppName: "ca-lab-runtime",
      runtimeImageDigest: `sha256:${"b".repeat(64)}`,
      runtimeRevision: "ca-lab-runtime--revision1",
      runtimeInternalHost: "ca-lab-runtime.internal.azurecontainerapps.io",
    });
  });
  it("fails closed when Azure resource controls do not match", () => {
    expect(() =>
      parseAcaResourceEvidence(
        {
          ...acaResource,
          properties: {
            ...acaResource.properties,
            template: {
              ...acaResource.properties.template,
              scale: { minReplicas: 1, maxReplicas: 2 },
            },
          },
        },
        acaRequest,
      ),
    ).toThrow("exactly one warm replica");
    expect(() =>
      parseAcaResourceEvidence(
        {
          ...acaResource,
          properties: {
            ...acaResource.properties,
            latestReadyRevisionName: "ca-lab--older",
          },
        },
        acaRequest,
      ),
    ).toThrow("active/latest revision");
    expect(() =>
      parseAcaResourceEvidence(acaResource, {
        ...acaRequest,
        authMode: "bearer",
      }),
    ).toThrow("authentication configuration");
    const wrongOrigin = structuredClone(acaResource);
    wrongOrigin.properties.template.containers[0]!.env[0]!.value =
      "https://other.example";
    expect(() => parseAcaResourceEvidence(wrongOrigin, acaRequest)).toThrow(
      "allowed Origin",
    );
    const publicRuntime = structuredClone(runtimeResource);
    publicRuntime.properties.configuration.ingress.external = true;
    expect(() =>
      parseAcaRuntimeEvidence(publicRuntime, {
        resourceGroup: "rg-lab",
        appName: "ca-lab-runtime",
        subscription: acaRequest.subscription,
      }),
    ).toThrow("ingress");
  });
  it("records and validates sanitized live ACA endpoint identity", () => {
    const liveManifest = {
      ...manifest,
      evidenceTier: "live-aca",
      remoteEndpoint: "deployed-aca",
      azureResourceGroup: "rg-lab",
      azureContainerAppName: "ca-lab",
      azureRuntimeAppName: "ca-lab-runtime",
      azureSubscriptionVerified: true,
      remoteEndpointHost: "lab.westus2.azurecontainerapps.io",
      remoteEndpointUrl: "https://lab.westus2.azurecontainerapps.io/mcp",
      remoteImageReference: `acr.azurecr.io/mcp@sha256:${"a".repeat(64)}`,
      remoteImageDigest: `sha256:${"a".repeat(64)}`,
      acaRevision: "lab--revision1",
      runtimeImageReference: `acr.azurecr.io/runtime@sha256:${"b".repeat(64)}`,
      runtimeImageDigest: `sha256:${"b".repeat(64)}`,
      runtimeRevision: "runtime--revision1",
      runtimeInternalHost: "runtime.internal.azurecontainerapps.io",
      azureRegion: "westus2",
    };
    expect(() => ExperimentManifestSchema.parse(liveManifest)).not.toThrow();
    expect(() =>
      ExperimentManifestSchema.parse({
        ...liveManifest,
        remoteEndpointHost: "other.westus2.azurecontainerapps.io",
      }),
    ).toThrow("same Azure Container Apps");
  });
  it("rejects ACA claims in loopback fixture evidence", () => {
    expect(() =>
      ExperimentManifestSchema.parse({
        ...manifest,
        acaRevision: "not-actually-deployed",
      }),
    ).toThrow("omit ACA metadata");
  });
  it("derives bearer auth from the token configuration", () => {
    expect(resolveAuthMode(undefined)).toBe("none");
    expect(resolveAuthMode("")).toBe("none");
    expect(resolveAuthMode("configured-token")).toBe("bearer");
  });
  it("rejects a bearer-configured baseline", () => {
    const configured = ExperimentManifestSchema.parse({
      ...manifest,
      authMode: resolveAuthMode("configured-token"),
    });
    expect(() => validateBaseline(configured)).toThrow("Baseline confound");
  });
  it("selects only implemented experiment cells", () => {
    expect(resolveExperimentCell(undefined)).toBe("baseline");
    expect(resolveExperimentCell("authentication")).toBe("authentication");
    expect(() => resolveExperimentCell("auth")).toThrow();
  });
  it.each(["cold-start", "persistence-replicas", "failure"])(
    "rejects planned cell %s instead of relabeling baseline execution",
    (cell) => {
      expect(() => resolveExperimentCell(cell)).toThrow("not implemented");
      expect(() => experimentArtifactPath(cell)).toThrow("not implemented");
    },
  );
  it("couples bearer auth exclusively to the authentication cell", () => {
    const parsed = ExperimentManifestSchema.parse(manifest);
    expect(() =>
      validateExperiment({
        ...parsed,
        cell: "authentication",
        authMode: "bearer",
      }),
    ).not.toThrow();
    expect(() =>
      validateExperiment({
        ...parsed,
        cell: "authentication",
        authMode: "none",
      }),
    ).toThrow("requires bearer");
  });
  it.each([
    ["storageMode", "optional-persistence"],
    ["replicaCount", 2],
    ["temperature", "cold"],
    ["scalingProfile", "cold"],
  ] as const)("rejects authentication cell confound %s", (field, value) => {
    const parsed = ExperimentManifestSchema.parse(manifest);
    expect(() =>
      validateExperiment({
        ...parsed,
        cell: "authentication",
        authMode: "bearer",
        [field]: value,
      }),
    ).toThrow("Experiment cell confound");
  });
  it("isolates output artifacts by experiment cell", () => {
    expect(experimentArtifactPath("baseline")).toBe(
      "artifacts/experiments/baseline.json",
    );
    expect(experimentArtifactPath("authentication")).toBe(
      "artifacts/experiments/authentication.json",
    );
  });
  it("uses the deployment origin contract for live ACA", () => {
    expect(resolveExperimentOrigin(undefined, "live-aca")).toBe(
      "https://copilot.local",
    );
    expect(resolveExperimentOrigin("https://lab.example", "live-aca")).toBe(
      "https://lab.example",
    );
    expect(() =>
      resolveExperimentOrigin("http://lab.example", "live-aca"),
    ).toThrow("HTTPS origin");
    expect(() =>
      resolveExperimentOrigin("https://lab.example/path", "live-aca"),
    ).toThrow("HTTPS origin");
    expect(
      resolveExperimentOrigin("https://ignored.example", "remote-test"),
    ).toBe("http://127.0.0.1:3000");
  });
  it("requires a 401 negative probe for authentication evidence", async () => {
    const rejected = vi.fn(
      async (_endpoint: URL, _init: RequestInit) =>
        new Response("", { status: 401 }),
    );
    await expect(
      proveBearerEnforcement(
        new URL("https://lab.westus2.azurecontainerapps.io/mcp"),
        "https://copilot.local",
        rejected,
      ),
    ).resolves.toEqual({ unauthenticatedStatus: 401 });
    expect(rejected).toHaveBeenCalledOnce();
    expect(rejected.mock.calls[0]?.[1]?.headers).not.toHaveProperty(
      "authorization",
    );

    const accepted = vi.fn(
      async (_endpoint: URL, _init: RequestInit) =>
        new Response("", { status: 200 }),
    );
    await expect(
      proveBearerEnforcement(
        new URL("https://lab.westus2.azurecontainerapps.io/mcp"),
        "https://copilot.local",
        accepted,
      ),
    ).rejects.toThrow("expected 401");
  });
  it("cleans partial initialization after connection failure", async () => {
    const closed: string[] = [];
    await expect(
      withCleanup(async (cleanup) => {
        cleanup.defer(() => {
          closed.push("listener");
        });
        cleanup.defer(() => {
          closed.push("stdio-child");
        });
        throw new Error("DNS failure");
      }),
    ).rejects.toThrow("DNS failure");
    expect(closed).toEqual(["stdio-child", "listener"]);
  });
});

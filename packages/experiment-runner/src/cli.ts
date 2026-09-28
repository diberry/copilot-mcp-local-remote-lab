import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createGatewayApp } from "../../company-mcp-gateway/src/http.js";
import { createRuntimeApp } from "../../server-plugin-runtime/src/http.js";
import { proveBearerEnforcement } from "./auth-proof.js";
import {
  queryAcaResourceEvidence,
  queryAcaRuntimeEvidence,
} from "./azure-evidence.js";
import { withCleanup } from "./cleanup.js";
import {
  experimentArtifactPath,
  ExperimentManifestSchema,
  resolveExperimentCell,
  validateExperiment,
} from "./manifest.js";
import { summarize } from "./metrics.js";
import {
  resolveAuthMode,
  resolveExperimentOrigin,
  resolveRemoteTarget,
} from "./remote-target.js";
import { runScenario } from "./scenario.js";

const remoteTarget = resolveRemoteTarget(process.argv.slice(2));
const experimentCell = resolveExperimentCell(process.env.EXPERIMENT_CELL);
const experimentOrigin = resolveExperimentOrigin(
  process.env.EXPERIMENT_ORIGIN,
  remoteTarget.evidenceTier,
);
const authMode = resolveAuthMode(process.env.MCP_BEARER_TOKEN);
let resourceEvidence;
if (remoteTarget.evidenceTier === "live-aca") {
  const resourceGroup = process.env.ACA_RESOURCE_GROUP;
  const appName = process.env.ACA_GATEWAY_APP_NAME;
  const runtimeAppName = process.env.ACA_RUNTIME_APP_NAME;
  if (!resourceGroup || !appName || !runtimeAppName)
    throw new Error(
      "ACA_RESOURCE_GROUP, ACA_GATEWAY_APP_NAME, and ACA_RUNTIME_APP_NAME are required for live-aca evidence.",
    );
  const common = {
    resourceGroup,
    ...(process.env.AZURE_SUBSCRIPTION_ID
      ? { subscription: process.env.AZURE_SUBSCRIPTION_ID }
      : {}),
  };
  resourceEvidence = {
    ...(await queryAcaResourceEvidence({
      ...common,
      appName,
      endpoint: remoteTarget.url,
      origin: experimentOrigin,
      authMode,
    })),
    ...(await queryAcaRuntimeEvidence({
      ...common,
      appName: runtimeAppName,
    })),
  };
} else {
  resourceEvidence = {
    azureResourceGroup: null,
    azureContainerAppName: null,
    azureRuntimeAppName: null,
    azureSubscriptionVerified: null,
    remoteEndpointHost: null,
    remoteEndpointUrl: null,
    remoteImageReference: null,
    remoteImageDigest: null,
    acaRevision: null,
    runtimeImageReference: null,
    runtimeImageDigest: null,
    runtimeRevision: null,
    runtimeInternalHost: null,
    azureRegion: null,
  };
}
const repetitions = Number(process.env.REPETITIONS ?? 20);
if (!Number.isInteger(repetitions) || repetitions < 20)
  throw new Error("REPETITIONS must be at least 20.");
const fixture = JSON.parse(
  await readFile("examples/experiment-manifest.json", "utf8"),
);
const hashes = JSON.parse(
  await readFile("artifacts/plugin-inventory/summary.json", "utf8"),
);
const manifest = ExperimentManifestSchema.parse({
  ...fixture,
  ...hashes,
  evidenceTier: remoteTarget.evidenceTier,
  authMode,
  cell: experimentCell,
  ...resourceEvidence,
  remoteEndpoint:
    remoteTarget.evidenceTier === "remote-test" ? "loopback" : "deployed-aca",
  sourceCommit: process.env.SOURCE_COMMIT ?? "uncommitted-worktree",
  nodeVersion: process.versions.node,
  timestampUtc: new Date().toISOString(),
});
validateExperiment(manifest);

const report = await withCleanup(async (cleanup) => {
  const local: number[] = [];
  const remote: number[] = [];
  const pairs = [];
  const runtime =
    remoteTarget.evidenceTier === "remote-test"
      ? await createRuntimeApp()
      : undefined;
  if (runtime) {
    await new Promise<void>((resolveListen, rejectListen) => {
      const onError = (error: Error) => rejectListen(error);
      runtime.once("error", onError);
      runtime.listen(0, "127.0.0.1", () => {
        runtime.off("error", onError);
        resolveListen();
      });
    });
    cleanup.defer(
      () =>
        new Promise<void>((resolveClose, rejectClose) => {
          if (!runtime.listening) return resolveClose();
          runtime.close((error) =>
            error ? rejectClose(error) : resolveClose(),
          );
        }),
    );
  }
  const runtimeAddress = runtime?.address();
  if (runtime && (!runtimeAddress || typeof runtimeAddress === "string"))
    throw new Error("Loopback plugin runtime did not start.");
  const gateway = runtime
    ? createGatewayApp(
        `http://127.0.0.1:${(runtimeAddress as { port: number }).port}/internal/mcp`,
      )
    : undefined;
  if (gateway) {
    await new Promise<void>((resolveListen, rejectListen) => {
      const onError = (error: Error) => rejectListen(error);
      gateway.once("error", onError);
      gateway.listen(0, "127.0.0.1", () => {
        gateway.off("error", onError);
        resolveListen();
      });
    });
    cleanup.defer(
      () =>
        new Promise<void>((resolveClose, rejectClose) => {
          if (!gateway.listening) return resolveClose();
          gateway.close((error) =>
            error ? rejectClose(error) : resolveClose(),
          );
        }),
    );
  }
  const gatewayAddress = gateway?.address();
  if (gateway && (!gatewayAddress || typeof gatewayAddress === "string"))
    throw new Error("Loopback company MCP gateway did not start.");
  const remoteUrl =
    remoteTarget.url ??
    new URL(
      `http://127.0.0.1:${(gatewayAddress as { port: number }).port}/mcp`,
    );

  const localClient = new Client({
    name: "experiment-local",
    version: "1.0.0",
  });
  const localTransport = new StdioClientTransport({
    command: process.execPath,
    args: [resolve("plugins/local/dist/plugin/stdio.js")],
  });
  cleanup.defer(() => localTransport.close());
  await localClient.connect(localTransport);
  cleanup.defer(() => localClient.close());

  const authenticationProof =
    manifest.authMode === "bearer"
      ? await proveBearerEnforcement(remoteUrl, experimentOrigin)
      : null;

  const remoteClient = new Client({
    name:
      remoteTarget.evidenceTier === "remote-test"
        ? "experiment-remote-test"
        : "experiment-live-aca",
    version: "1.0.0",
  });
  const remoteTransport = new StreamableHTTPClientTransport(remoteUrl, {
    requestInit: {
      headers: {
        origin: experimentOrigin,
        ...(process.env.MCP_BEARER_TOKEN
          ? { authorization: `Bearer ${process.env.MCP_BEARER_TOKEN}` }
          : {}),
      },
    },
  });
  cleanup.defer(() => remoteTransport.close());
  await remoteClient.connect(remoteTransport);
  cleanup.defer(() => remoteClient.close());

  await runScenario(localClient, "stdio");
  await runScenario(remoteClient, "streamable-http");
  for (let index = 0; index < repetitions; index++) {
    const order =
      index % 2 === 0
        ? (["stdio", "streamable-http"] as const)
        : (["streamable-http", "stdio"] as const);
    const pair: Record<string, number> = {};
    for (const transport of order) {
      const result = await runScenario(
        transport === "stdio" ? localClient : remoteClient,
        transport,
      );
      pair[transport] = result.durationMs;
      (transport === "stdio" ? local : remote).push(result.durationMs);
    }
    pairs.push({
      pairId: `${manifest.pairId}-${index + 1}`,
      order,
      localMs: pair.stdio,
      remoteMs: pair["streamable-http"],
      deltaMs: pair["streamable-http"]! - pair.stdio!,
    });
  }
  return {
    manifest,
    authenticationProof,
    failures: 0,
    local: summarize(local),
    remote: summarize(remote),
    pairs,
  };
});

await mkdir("artifacts/experiments", { recursive: true });
await writeFile(
  experimentArtifactPath(manifest.cell),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));

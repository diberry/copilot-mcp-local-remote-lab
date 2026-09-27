import { URL } from "node:url";

const transports = new Set(["stdio", "streamable-http"]);
const evidenceTiers = new Set(["remote-test", "live-aca"]);
const remoteEndpoints = new Set(["loopback", "deployed-aca"]);
const outcomes = new Set(["success", "failure"]);
const errorCategories = new Set([
  "validation",
  "not_found",
  "conflict",
  "internal",
]);
const boundaryFailureCategories = new Set(["process_start", "network", "auth"]);
const allowedKeys = new Set([
  "transport",
  "evidenceTier",
  "remoteEndpoint",
  "remoteImageDigest",
  "acaRevision",
  "azureRegion",
  "endpointUrl",
  "discoverySha256",
  "pluginVersion",
  "toolCount",
  "durationsMs",
  "outcome",
  "errorCategory",
  "recoveryScenario",
]);
const recoveryKeys = new Set(["boundaryFailureCategory", "recoveryOutcome"]);
const deploymentKeys = [
  "remoteImageDigest",
  "acaRevision",
  "azureRegion",
  "endpointUrl",
];

export function validateVideoFixture(input, source = "video fixture") {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error(`${source}: expected an object`);
  for (const key of Object.keys(input))
    if (!allowedKeys.has(key))
      throw new Error(`${source}: unknown field ${key}`);
  if (!transports.has(input.transport))
    throw new Error(`${source}: invalid transport`);
  if (!evidenceTiers.has(input.evidenceTier))
    throw new Error(`${source}: invalid evidenceTier`);
  if (!remoteEndpoints.has(input.remoteEndpoint))
    throw new Error(`${source}: invalid remoteEndpoint`);
  if (
    (input.evidenceTier === "remote-test" &&
      input.remoteEndpoint !== "loopback") ||
    (input.evidenceTier === "live-aca" &&
      input.remoteEndpoint !== "deployed-aca")
  )
    throw new Error(`${source}: contradictory evidence tier and endpoint`);
  if (
    input.evidenceTier === "remote-test" &&
    deploymentKeys.some((key) => input[key] !== undefined)
  )
    throw new Error(
      `${source}: loopback evidence must omit deployment metadata`,
    );
  if (input.evidenceTier === "live-aca") {
    if (!/^sha256:[a-f0-9]{64}$/.test(input.remoteImageDigest ?? ""))
      throw new Error(`${source}: invalid remoteImageDigest`);
    if (!/^[a-z0-9][a-z0-9.-]*$/i.test(input.acaRevision ?? ""))
      throw new Error(`${source}: invalid acaRevision`);
    if (!/^[a-z0-9-]+$/.test(input.azureRegion ?? ""))
      throw new Error(`${source}: invalid azureRegion`);
    let endpoint;
    try {
      endpoint = new URL(input.endpointUrl);
    } catch {
      throw new Error(`${source}: invalid endpointUrl`);
    }
    if (
      endpoint.protocol !== "https:" ||
      endpoint.pathname !== "/mcp" ||
      endpoint.search ||
      endpoint.hash ||
      !endpoint.hostname.endsWith(".azurecontainerapps.io")
    )
      throw new Error(`${source}: invalid ACA endpointUrl`);
  }
  if (typeof input.pluginVersion !== "string" || input.pluginVersion === "")
    throw new Error(`${source}: invalid pluginVersion`);
  if (!/^[a-f0-9]{64}$/.test(input.discoverySha256 ?? ""))
    throw new Error(`${source}: invalid discoverySha256`);
  if (!Number.isInteger(input.toolCount) || input.toolCount < 1)
    throw new Error(`${source}: invalid toolCount`);
  if (
    !Array.isArray(input.durationsMs) ||
    input.durationsMs.length === 0 ||
    input.durationsMs.some(
      (duration) => !Number.isFinite(duration) || duration < 0,
    )
  )
    throw new Error(`${source}: invalid durationsMs`);
  if (!outcomes.has(input.outcome))
    throw new Error(`${source}: invalid outcome`);
  if (
    input.errorCategory !== undefined &&
    !errorCategories.has(input.errorCategory)
  )
    throw new Error(`${source}: invalid todo errorCategory`);
  if (input.outcome === "success" && input.errorCategory !== undefined)
    throw new Error(`${source}: successful outcome cannot have errorCategory`);
  if (input.outcome === "failure" && input.errorCategory === undefined)
    throw new Error(`${source}: failed outcome requires errorCategory`);

  const recovery = input.recoveryScenario;
  if (!recovery || typeof recovery !== "object" || Array.isArray(recovery))
    throw new Error(`${source}: recoveryScenario is required`);
  for (const key of Object.keys(recovery))
    if (!recoveryKeys.has(key))
      throw new Error(`${source}: unknown recoveryScenario field ${key}`);
  if (!boundaryFailureCategories.has(recovery.boundaryFailureCategory))
    throw new Error(`${source}: invalid boundary failure category`);
  if (recovery.recoveryOutcome !== "success")
    throw new Error(`${source}: invalid recovery outcome`);

  return input;
}

export function describeVideoBoundary(input) {
  validateVideoFixture(input);
  if (input.evidenceTier === "remote-test") return "Loopback Streamable HTTP";
  const hostname = new URL(input.endpointUrl).hostname;
  return `Azure Container Apps ${hostname} · ${input.azureRegion} · revision ${input.acaRevision} · image ${input.remoteImageDigest}`;
}

export function validateVideoFixturePair(local, remote, discovery) {
  validateVideoFixture(local, "local-run.json");
  validateVideoFixture(remote, "remote-run.json");
  if (local.pluginVersion !== remote.pluginVersion)
    throw new Error("Video fixture plugin versions differ.");
  if (local.toolCount !== remote.toolCount)
    throw new Error("Video fixture tool counts differ.");
  if (local.discoverySha256 !== remote.discoverySha256)
    throw new Error("Video fixture discovery hashes differ.");
  if (
    discovery?.schemaVersion !== 1 ||
    discovery?.source !== "mcp-sdk-listTools" ||
    discovery?.pluginName !== "copilot-mcp-local-remote-lab" ||
    discovery?.pluginVersion !== local.pluginVersion ||
    discovery?.toolCount !== local.toolCount ||
    discovery?.canonicalDiscoverySha256 !== local.discoverySha256
  )
    throw new Error(
      "Video fixtures do not match generated MCP discovery evidence.",
    );
  return {
    pluginVersion: discovery.pluginVersion,
    toolCount: local.toolCount,
    discoverySha256: local.discoverySha256,
  };
}

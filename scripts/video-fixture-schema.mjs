const transports = new Set(["stdio", "streamable-http"]);
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
  "pluginVersion",
  "toolCount",
  "durationsMs",
  "outcome",
  "errorCategory",
  "recoveryScenario",
]);
const recoveryKeys = new Set(["boundaryFailureCategory", "recoveryOutcome"]);

export function validateVideoFixture(input, source = "video fixture") {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error(`${source}: expected an object`);
  for (const key of Object.keys(input))
    if (!allowedKeys.has(key))
      throw new Error(`${source}: unknown field ${key}`);
  if (!transports.has(input.transport))
    throw new Error(`${source}: invalid transport`);
  if (typeof input.pluginVersion !== "string" || input.pluginVersion === "")
    throw new Error(`${source}: invalid pluginVersion`);
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

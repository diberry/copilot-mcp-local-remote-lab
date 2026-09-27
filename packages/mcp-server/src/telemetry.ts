export const telemetryFields = [
  "experimentRunId",
  "requestId",
  "transport",
  "operation",
  "clientStartTime",
  "serverStartTime",
  "serverDurationMs",
  "endToEndDurationMs",
  "coldStart",
  "outcome",
  "errorCategory",
  "serverVersion",
  "pluginVersion",
  "protocolVersion",
  "revision",
  "replica",
  "processStartupDurationMs",
] as const;

export type TelemetryEvent = Partial<
  Record<(typeof telemetryFields)[number], string | number | boolean>
>;

export function sanitizeTelemetry(
  input: Record<string, unknown>,
): TelemetryEvent {
  return Object.fromEntries(
    telemetryFields
      .filter((key) => input[key] !== undefined)
      .map((key) => [key, input[key]]),
  ) as TelemetryEvent;
}

export function emitTelemetry(input: Record<string, unknown>) {
  console.error(JSON.stringify(sanitizeTelemetry(input)));
}

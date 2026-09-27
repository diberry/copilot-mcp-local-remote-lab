export interface VideoFixture {
  transport: "stdio" | "streamable-http";
  pluginVersion: string;
  toolCount: number;
  durationsMs: number[];
  outcome: "success" | "failure";
  errorCategory?: "validation" | "not_found" | "conflict" | "internal";
  recoveryScenario: {
    boundaryFailureCategory: "process_start" | "network" | "auth";
    recoveryOutcome: "success";
  };
}

export function validateVideoFixture(
  input: unknown,
  source?: string,
): VideoFixture;

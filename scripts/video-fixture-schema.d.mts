interface VideoFixtureBase {
  transport: "stdio" | "streamable-http";
  discoverySha256: string;
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

export interface LoopbackVideoFixture extends VideoFixtureBase {
  evidenceTier: "remote-test";
  remoteEndpoint: "loopback";
}

export interface LiveAcaVideoFixture extends VideoFixtureBase {
  evidenceTier: "live-aca";
  remoteEndpoint: "deployed-aca";
  remoteImageDigest: string;
  acaRevision: string;
  azureRegion: string;
  endpointUrl: string;
}

export type VideoFixture = LoopbackVideoFixture | LiveAcaVideoFixture;

export function validateVideoFixture(
  input: unknown,
  source?: string,
): VideoFixture;

export function describeVideoBoundary(input: unknown): string;

export function validateVideoFixturePair(
  local: unknown,
  remote: unknown,
  discovery: unknown,
): {
  pluginVersion: string;
  toolCount: number;
  discoverySha256: string;
};

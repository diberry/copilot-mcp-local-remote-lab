import { describe, expect, it } from "vitest";
import {
  describeVideoBoundary,
  validateVideoFixture,
  validateVideoFixturePair,
} from "../../scripts/video-fixture-schema.mjs";

const discoverySha256 = "a".repeat(64);
const validFixture = {
  transport: "stdio",
  evidenceTier: "remote-test",
  remoteEndpoint: "loopback",
  discoverySha256,
  pluginVersion: "1.0.0",
  toolCount: 5,
  durationsMs: [2, 3],
  outcome: "success",
  recoveryScenario: {
    boundaryFailureCategory: "process_start",
    recoveryOutcome: "success",
  },
};
const validLiveFixture = {
  ...validFixture,
  transport: "streamable-http",
  evidenceTier: "live-aca",
  remoteEndpoint: "deployed-aca",
  remoteImageDigest: `sha256:${"a".repeat(64)}`,
  acaRevision: "ca-lab--revision1",
  azureRegion: "westus2",
  endpointUrl: "https://ca-lab.example.azurecontainerapps.io/mcp",
};

describe("video fixture validation", () => {
  it("accepts separate successful operation and boundary recovery states", () => {
    expect(validateVideoFixture(validFixture)).toBe(validFixture);
  });
  it("validates and renders live ACA deployment metadata", () => {
    expect(validateVideoFixture(validLiveFixture)).toBe(validLiveFixture);
    expect(
      validateVideoFixture({ ...validLiveFixture, transport: "stdio" }),
    ).toMatchObject({ evidenceTier: "live-aca", transport: "stdio" });
    expect(describeVideoBoundary(validLiveFixture)).toContain(
      "ca-lab.example.azurecontainerapps.io · westus2 · revision ca-lab--revision1",
    );
  });
  it("binds matching plugin identity to generated discovery evidence", () => {
    expect(
      validateVideoFixturePair(validFixture, validFixture, {
        schemaVersion: 1,
        source: "mcp-sdk-listTools",
        pluginName: "copilot-mcp-local-remote-lab",
        pluginVersion: "1.0.0",
        toolCount: 5,
        canonicalDiscoverySha256: discoverySha256,
      }),
    ).toEqual({
      pluginVersion: "1.0.0",
      toolCount: 5,
      discoverySha256,
    });
  });
  it.each([
    ["pluginVersion", "2.0.0"],
    ["toolCount", 6],
    ["discoverySha256", "b".repeat(64)],
  ])("rejects mismatched fixture %s", (field, value) => {
    expect(() =>
      validateVideoFixturePair(
        validFixture,
        { ...validFixture, [field]: value },
        {
          schemaVersion: 1,
          source: "mcp-sdk-listTools",
          pluginName: "copilot-mcp-local-remote-lab",
          pluginVersion: "1.0.0",
          toolCount: 5,
          canonicalDiscoverySha256: discoverySha256,
        },
      ),
    ).toThrow("differ");
  });
  it("rejects fabricated matching fixture versions", () => {
    const fabricated = { ...validFixture, pluginVersion: "9.9.9" };
    expect(() =>
      validateVideoFixturePair(fabricated, fabricated, {
        schemaVersion: 1,
        source: "mcp-sdk-listTools",
        pluginName: "copilot-mcp-local-remote-lab",
        pluginVersion: "1.0.0",
        toolCount: 5,
        canonicalDiscoverySha256: discoverySha256,
      }),
    ).toThrow("generated MCP discovery evidence");
  });
  it("rejects fixture hashes not produced by discovery comparison", () => {
    expect(() =>
      validateVideoFixturePair(validFixture, validFixture, {
        schemaVersion: 1,
        source: "mcp-sdk-listTools",
        pluginName: "copilot-mcp-local-remote-lab",
        pluginVersion: "1.0.0",
        toolCount: 5,
        canonicalDiscoverySha256: "b".repeat(64),
      }),
    ).toThrow("generated MCP discovery evidence");
  });
  it.each(["remoteImageDigest", "acaRevision", "azureRegion", "endpointUrl"])(
    "requires live ACA metadata field %s",
    (field) => {
      const fixture: Record<string, unknown> = { ...validLiveFixture };
      delete fixture[field];
      expect(() => validateVideoFixture(fixture)).toThrow();
    },
  );

  it.each([
    ["unknown evidence tier", { ...validFixture, evidenceTier: "fixture" }],
    ["unknown remote endpoint", { ...validFixture, remoteEndpoint: "remote" }],
    [
      "live ACA evidence on loopback",
      { ...validFixture, evidenceTier: "live-aca" },
    ],
    [
      "remote-test evidence on deployed ACA",
      { ...validFixture, remoteEndpoint: "deployed-aca" },
    ],
    [
      "loopback evidence with deployment metadata",
      { ...validFixture, azureRegion: "westus2" },
    ],
    [
      "live ACA evidence with an invalid digest",
      { ...validLiveFixture, remoteImageDigest: "sha256:fixture" },
    ],
    [
      "live ACA evidence with a non-ACA endpoint",
      { ...validLiveFixture, endpointUrl: "https://example.test/mcp" },
    ],
    [
      "transport category in the todo error domain",
      { ...validFixture, errorCategory: "network" },
    ],
    [
      "todo error on a successful operation",
      { ...validFixture, errorCategory: "internal" },
    ],
    [
      "unknown boundary failure category",
      {
        ...validFixture,
        recoveryScenario: {
          ...validFixture.recoveryScenario,
          boundaryFailureCategory: "timeout",
        },
      },
    ],
    [
      "failed recovery",
      {
        ...validFixture,
        recoveryScenario: {
          ...validFixture.recoveryScenario,
          recoveryOutcome: "failure",
        },
      },
    ],
  ])("rejects %s", (_name, fixture) => {
    expect(() => validateVideoFixture(fixture)).toThrow();
  });
});

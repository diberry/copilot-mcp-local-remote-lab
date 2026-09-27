import { describe, expect, it } from "vitest";
import { validateVideoFixture } from "../../scripts/video-fixture-schema.mjs";

const validFixture = {
  transport: "stdio",
  pluginVersion: "1.0.0",
  toolCount: 5,
  durationsMs: [2, 3],
  outcome: "success",
  recoveryScenario: {
    boundaryFailureCategory: "process_start",
    recoveryOutcome: "success",
  },
};

describe("video fixture validation", () => {
  it("accepts separate successful operation and boundary recovery states", () => {
    expect(validateVideoFixture(validFixture)).toBe(validFixture);
  });

  it.each([
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

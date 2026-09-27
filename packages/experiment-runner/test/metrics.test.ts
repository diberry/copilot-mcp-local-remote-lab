import { describe, expect, it } from "vitest";
import { median, p95 } from "../src/metrics.js";
import { ExperimentManifestSchema, validateBaseline } from "../src/manifest.js";
import manifest from "../../../examples/experiment-manifest.json" with { type: "json" };

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
});

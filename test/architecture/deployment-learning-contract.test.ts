import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("learning contract: deployment preserves baseline controls", () => {
  it("keeps storage and scale controlled while exposing evidence handoff", async () => {
    const [main, app] = await Promise.all([
      readFile("infra/main.bicep", "utf8"),
      readFile("infra/modules/container-app.bicep", "utf8"),
    ]);

    expect(app).toContain("{ name: 'STORAGE_MODE', value: 'memory' }");
    expect(app).toContain("maxReplicas: 1");
    expect(app).toContain("minReplicas: minReplicas");
    expect(app).toContain("secretRef: 'mcp-bearer-token'");
    expect(app).toContain("path: '/healthz'");
    expect(app).toContain("path: '/readyz'");

    for (const output of [
      "ACA_RESOURCE_GROUP",
      "ACA_APP_NAME",
      "MCP_ENDPOINT_URL",
      "EXPERIMENT_ORIGIN",
      "EXPERIMENT_SCALING_PROFILE",
      "EXPERIMENT_STORAGE_MODE",
    ])
      expect(main).toContain(`output ${output} string`);
  });
});

import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("learning contract: deployment preserves baseline controls", () => {
  it("keeps storage and scale controlled while exposing evidence handoff", async () => {
    const [main, gateway, runtime] = await Promise.all([
      readFile("infra/main.bicep", "utf8"),
      readFile("infra/modules/container-app.bicep", "utf8"),
      readFile("infra/modules/plugin-runtime-app.bicep", "utf8"),
    ]);

    expect(gateway).toContain("external: true");
    expect(gateway).toContain(
      "{ name: 'PLUGIN_RUNTIME_URL', value: pluginRuntimeUrl }",
    );
    expect(gateway).toContain("secretRef: 'mcp-bearer-token'");
    expect(runtime).toContain("external: false");
    expect(runtime).toContain("PLUGIN_ARTIFACT_ROOT");
    for (const app of [gateway, runtime]) {
      expect(app).toContain("maxReplicas: 1");
      expect(app).toContain("minReplicas: minReplicas");
      expect(app).toContain("path: '/healthz'");
      expect(app).toContain("path: '/readyz'");
    }

    for (const output of [
      "ACA_RESOURCE_GROUP",
      "ACA_GATEWAY_APP_NAME",
      "ACA_RUNTIME_APP_NAME",
      "MCP_ENDPOINT_URL",
      "PLUGIN_RUNTIME_INTERNAL_FQDN",
      "EXPERIMENT_ORIGIN",
      "EXPERIMENT_SCALING_PROFILE",
      "EXPERIMENT_STORAGE_MODE",
    ])
      expect(main).toContain(`output ${output} string`);
  });
});

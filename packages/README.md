# Source code tour

The source follows the
[implementation plan](../docs/implementation-plan.md). The placement
comparison uses one built plugin artifact rather than copying plugin source
into the company MCP layer.

The transport source is organized to make its variable visible. Its parity
evidence supports, but does not replace, complete-plugin fidelity evidence.

## Invariant: one executable plugin artifact

Start in `plugin-capability/src/index.ts`. It owns the executable plugin
behavior. `scripts/build-plugin.mjs` bundles it once into
`artifacts/plugin/canonical/dist/plugin/capability.js`, writes its SHA-256 to
`artifact.json`, and copies the unchanged artifact to the local client and
private server runtime.

Next, inspect `client-plugin-adapter/src/stdio.ts` and
`server-plugin-runtime/src/artifact-loader.ts`. Both dynamically load the built
artifact. Neither placement compiles a separate capability implementation.
The remote client package contains connection metadata and
`server-artifact.json`, but no executable plugin code.

## Variable: MCP boundary

Compare the two paths:

- `client-plugin-adapter/src/stdio.ts` loads the artifact as a client-owned
  child process.
- `server-plugin-runtime/src/http.ts` loads the same artifact behind internal
  ingress.
- `company-mcp-gateway/src/http.ts` enforces Origin, optional bearer auth,
  request size, content type, health, and readiness, then proxies MCP bytes.

When studying a result, attribute todo behavior to the shared core and
boundary-specific behavior to one of these adapters.

`create-server.ts` also owns `describeBoundaryStudy()`. It returns synthetic
provenance, recommendation evidence, and a learner/operator responsibility
split for the active boundary. Both adapters register the same `diagnostics`
schema. The intentionally different context-study response is therefore a
controlled evidence-placement result, not proof that the plugin runs behind a
company MCP layer.

## Package boundaries

The lab uses these package boundaries across its implementation stages:

- `plugin-capability` as the canonical behavior and fidelity inventory;
- `client-plugin-adapter` for the complete client-installed package;
- `company-mcp-gateway` for identity, policy, routing, and telemetry;
- `server-plugin-runtime` behind the gateway; and
- a thin client companion only when fidelity tests prove it is required.

The earlier `mcp-server` and `todo-core` packages remain as transport
foundation evidence. The placement path does not deploy that HTTP server.

## Measurement: paired runner

Read the experiment runner in this order:

1. `scenario.ts` defines the one fixed operation sequence.
1. `remote-target.ts` prevents loopback evidence from being labeled Azure.
1. `azure-evidence.ts` queries live Container Apps configuration.
1. `manifest.ts` rejects changes to baseline controls.
1. `cli.ts` connects real MCP clients and alternates pair order.
1. `metrics.ts` summarizes observed values without claiming significance.

The runner deliberately rejects unimplemented experiment cells. Adding a new
cell requires its own execution path, controls, tests, and interpretation.

## Trace the learning claim into tests

- `test/contract/experiment-invariant.integration.test.ts` proves both real
  transports reach the same final todo state, then proves that the optional
  context study exposes different provenance, recommendations, and
  responsibilities through those same clients.
- `test/contract/adapter-discovery.integration.test.ts` proves client-visible
  discovery parity.
- `test/architecture/plugin-comparison.test.ts` proves only `mcp.json` may
  differ between generated bundles.
- `test/architecture/deployment-learning-contract.test.ts` proves deployment
  keeps baseline controls and exposes nonsecret evidence handoff values.

The tests are part of the explanation: each one encodes a claim that must
remain true for the experiment to be interpretable.

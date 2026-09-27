# Source code tour

The source is organized to make the experiment variable visible.

## Invariant: shared domain and tool registration

Start in `todo-core/src/index.ts`. It owns todo validation, storage, stable IDs,
and normalized errors without importing MCP, HTTP, or process APIs.

Next, inspect `mcp-server/src/create-server.ts`. `registerTodoTools()` is the
single registration factory used by both adapters. This is the most important
design choice in the lab: local and remote cannot silently acquire different
tool implementations.

## Variable: MCP boundary

Compare the two thin adapters:

- `mcp-server/src/stdio.ts` starts the server as a client-owned child process.
- `mcp-server/src/http.ts` exposes the same server through Streamable HTTP and
  adds the controls required by a network boundary: Origin, optional bearer
  auth, request size, content type, health, and readiness.

When studying a result, attribute todo behavior to the shared core and
boundary-specific behavior to one of these adapters.

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
  transports reach the same final todo state.
- `test/contract/adapter-discovery.integration.test.ts` proves client-visible
  discovery parity.
- `test/architecture/plugin-comparison.test.ts` proves only `mcp.json` may
  differ between generated bundles.
- `test/architecture/deployment-learning-contract.test.ts` proves deployment
  keeps baseline controls and exposes nonsecret evidence handoff values.

The tests are part of the explanation: each one encodes a claim that must
remain true for the experiment to be interpretable.

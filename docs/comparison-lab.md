# Comparison lab

> This is a learning repository, not a production reference architecture.

## Question and hypothesis

**Question:** What changes when one plugin and tool implementation cross a
local process boundary versus an HTTP boundary?

**Hypothesis:** Discovery and domain outcomes remain equivalent. HTTP adds
transport latency and operational concerns, while enabling centralized hosting
and shared observability.

Run parity checks before measurements:

```powershell
npm run plugin:compare
npm run test:discovery-parity
npm run test:e2e
```

If any parity check fails, do not interpret latency results.

## Evidence tiers

- **`remote-test` / loopback** (default): `npm run experiment:run` starts the actual HTTP adapter on an ephemeral `127.0.0.1` port and uses an MCP Streamable HTTP client across that network boundary. It is local validation, never deployed ACA evidence.
- **`live-aca`**: only after the operator has separately authorized use of an existing deployment, run `npm run experiment:run -- --remote-url https://YOUR-APP.REGION.azurecontainerapps.io/mcp --live-aca-authorized`. Set `ACA_RESOURCE_GROUP` and `ACA_APP_NAME`; optionally set `AZURE_SUBSCRIPTION_ID`, otherwise Azure CLI uses its current subscription. The runner queries the Container App and derives the endpoint host, active/latest revision, location, deployed image reference/digest, replica controls, storage mode, allowed Origin, and bearer-secret configuration. Any query failure or mismatch rejects the evidence. The Bicep deployment and runner both default to `https://copilot.local`; if the deployment uses a different `allowedOrigin`, set the identical HTTPS origin in `EXPERIMENT_ORIGIN`. Automated evidence accepts only an exact HTTPS `/mcp` URL on `*.azurecontainerapps.io`, without credentials, a custom port, query, or fragment. Custom domains are not supported for automated evidence in this build. The runner never deploys Azure.

Both modes spawn the local stdio server, use MCP SDK clients, discard one setup run, alternate local→remote then remote→local, and perform at least 20 measured pairs. The report includes its evidence tier and reports count, failures, median, nearest-rank p95, and paired deltas.

This build implements only `EXPERIMENT_CELL=baseline` (the default) and `EXPERIMENT_CELL=authentication`. For an authenticated run, configure the server secret, set `$env:EXPERIMENT_CELL = "authentication"` and `$env:MCP_BEARER_TOKEN` to the matching value, then invoke the command. Before measuring, the runner sends an unauthenticated request and requires a `401`; a permissive endpoint cannot produce authentication evidence. The authentication report records only that sanitized `401` status as `authenticationProof`. `$env:MCP_BEARER_TOKEN` is accepted only in the `authentication` cell, and that cell requires the same warm, in-memory, one-replica controls as baseline. The baseline requires no auth.

Each implemented cell writes a separate `artifacts/experiments/<cell>.json` report, so authentication samples cannot overwrite baseline results. Cold-start, persistence/replica, and failure experiments are planned or manual follow-ons; the runner rejects those cell names until their distinct execution paths exist. Never label those manual results as runner evidence or merge them into baseline percentiles. Run `npm run experiment:verify-manifest` first and preserve only sanitized evidence.

## Interpret the report

Read the output in this order:

1. Confirm `evidenceTier`, endpoint category, source commit, plugin hashes, and
   scenario version.
1. Confirm the baseline controls: no auth, warm temperature, memory storage,
   and one replica.
1. Confirm alternating `local-remote` and `remote-local` pair order.
1. Compare paired deltas, medians, and p95 values.
1. Record failures separately; a failed run is not a slow successful run.

Use this observation table:

| Observation          | Evidence field                      | Interpretation                                       |
| -------------------- | ----------------------------------- | ---------------------------------------------------- |
| Tool parity          | Discovery SHA-256                   | Both clients saw one canonical catalog               |
| Domain parity        | E2E final todo state                | Both boundaries reached the same outcome             |
| Typical overhead     | Median paired delta                 | Difference observed in this controlled run           |
| Tail behavior        | Local and remote p95                | Variability worth investigating                      |
| Operational tradeoff | Evidence tier and manifest controls | Which boundary and deployment were actually measured |

## Do not overclaim

The report does not prove that local is always faster, that remote is
production-ready, or that loopback predicts internet latency. It shows how to
create repeatable evidence and how to identify the additional concerns that a
remote MCP boundary introduces.

# Learning contract

> This is a learning repository, not a production reference architecture.

## Experiment question

What changes in the AI's available evidence and in the user's responsibilities
when the **same GitHub Copilot Agent Plugin and MCP tools** execute through a
local stdio boundary versus a shared Streamable HTTP service?

Transport parity first isolates the boundary. A second context-placement cell
then intentionally supplies different synthetic decision evidence from the
learner device and the shared service. It still does not compare different
plugins, tool contracts, or tool implementations.

## Hypothesis

Both bindings should expose the same client-visible tools and produce the same
domain outcome. The HTTP boundary should add measurable transport and
operational overhead, but it also enables centralized deployment,
observability, server-side integrations, and operator-governed shared context.
The model itself should remain client-side and unchanged. Its recommendation
should change only when the evidence available through the tool changes.

## Controlled-variable contract

| Held constant                          | Allowed to change                       |
| -------------------------------------- | --------------------------------------- |
| Plugin identity and version            | MCP transport: stdio or Streamable HTTP |
| Agent, skill, and hook payload         | Process or network boundary             |
| Tool names, descriptions, and schemas  | Boundary-specific failure category      |
| Shared tool registration and todo core | Transport latency                       |
| Synthetic scenario and run ordering    | Optional auth only in its separate cell |
| Warm, in-memory, one-replica baseline  | Azure operations only for `live-aca`    |

If another row changes, the result belongs in a separate experiment cell and
must not be merged into the baseline.

## Context-placement cell

The separate context-placement cell calls the same `diagnostics` tool with
`includeContextStudy: true`. The local response contains a synthetic,
learner-approved focus signal. The remote response contains a synthetic,
operator-curated team policy. The model can therefore reach a different
recommendation without changing the plugin, agent, skill, model, or tool
implementation.

This is the learning distinction:

- **AI capability** comes from the model plus the tool contract.
- **Useful intelligence** depends on the evidence the tool can retrieve and
  the provenance the user can evaluate.
- **Responsibility** follows the evidence and execution boundary.

## Evidence chain

| Surface    | What to inspect                                                     | What it teaches or proves                                                                                                          |
| ---------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Source     | `packages/README.md` and `packages/mcp-server/src/create-server.ts` | Both adapters use one tool-registration factory; the context cell exposes boundary-specific evidence and responsibility provenance |
| Bindings   | `plugins/local/mcp.json` and `plugins/remote/mcp.json`              | Only the MCP connection changes in generated packages                                                                              |
| Tests      | `test/contract/experiment-invariant.integration.test.ts`            | Real stdio and HTTP clients reach the same domain outcome                                                                          |
| Tests      | `test/architecture/plugin-comparison.test.ts`                       | Generated package bytes may differ only in `mcp.json`                                                                              |
| Runner     | `packages/experiment-runner/src/cli.ts`                             | Alternating paired execution and evidence-tier labeling                                                                            |
| Videos     | `docs/media/videos/`                                                | A visual explanation of boundary, parity, latency, and recovery                                                                    |
| Deployment | `infra/main.bicep`                                                  | The remote boundary adds ACA, identity, registry, logs, ingress, and cost                                                          |
| Manifest   | `artifacts/experiments/<cell>.json`                                 | Auditable controls, environment, ordering, and measurements                                                                        |

## Success criteria

After the lab, verify that you can answer:

1. Which code and package files are identical between local and remote?
1. What is the one intended variable in the baseline?
1. Why is loopback HTTP useful but not Azure deployment evidence?
1. Which result demonstrates behavioral parity?
1. Which new failure, security, scaling, and cost concerns appear remotely?
1. Why can the same client-side model make a different recommendation in the
   context-placement cell?
1. Which responsibilities stay with the user, and which transfer to a service
   operator?
1. Which evidence would you need before making a production decision?

## Limits of the evidence

- The fixture and loopback results are deterministic learning evidence, not a
  production benchmark.
- The videos visualize sanitized evidence; they do not record a native Copilot
  client or Azure portal.
- A `live-aca` report proves only the queried deployment and controls recorded
  in that report.
- Twenty pairs describe the lab run. They do not establish universal
  statistical superiority.
- In-memory, single-replica behavior intentionally excludes persistence and
  horizontal scaling from the baseline.
- The context-placement evidence is synthetic. It demonstrates provenance and
  responsibility shifts, not the quality of a real organizational knowledge
  base.

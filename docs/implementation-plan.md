# Lab architecture and implementation plan

## Problem statement

This lab answers one architecture question:

> What do I gain and lose if I stop distributing the complete plugin to every
> client and instead run it behind my company's MCP layer?

The lab uses transport, discovery, and domain parity as foundation evidence,
then measures capability fidelity, governance, and responsibility across the
two placement topologies.

## Lab architecture

Build one portable capability definition and execute it through two distinct
topologies.

### Topology A: complete client-hosted plugin

The learner installs a complete Agent Plugin package. The package contains the
custom agent, skill, hooks, tool contract, orchestration rules, and a local
runtime. The client and learner device own execution, approved local context,
updates, availability, and local evidence.

```mermaid
flowchart LR
  U[Learner] --> C[Copilot client]
  C --> P[Complete Agent Plugin]
  P --> A[Agent + skill + hooks]
  P --> R[Local capability runtime]
  R --> L[Approved local context]
```

### Topology B: plugin runtime behind company MCP

The client connects to the company MCP layer. The company layer authenticates,
authorizes, applies policy, records content-free operational evidence, and
routes the request to a server-hosted plugin runtime. The complete portable
capability executes behind that boundary.

```mermaid
flowchart LR
  U[Learner] --> C[Copilot client]
  C --> T[Minimum MCP connection surface]
  T --> G[Company MCP gateway]
  G --> P[Server-hosted plugin runtime]
  P --> S[Shared company context and systems]
```

The remote topology must not assume that every client-native Agent Plugin
feature can cross MCP. The implementation must classify each feature as:

- **portable unchanged**;
- **mapped to an MCP primitive or company-layer contract**;
- **requires a thin client companion**; or
- **not preserved**.

That classification is an experiment result, not a prerequisite.

### Shared capability source

Create a canonical capability source that describes:

- tool names, schemas, and domain behavior;
- agent intent and decision rules;
- skill workflow;
- pre/post execution policies currently represented by hooks;
- context requirements and provenance;
- approval and error behavior.

Generate or adapt that source into:

1. the complete client Agent Plugin package; and
2. the server-hosted plugin runtime consumed behind the company MCP gateway.

Do not require the generated artifacts to be byte-identical. Require a
traceable mapping from every canonical capability to its realization and
fidelity status in each topology.

## Implementation mapping

| Lab requirement                       | Implementation                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------- |
| Preserve one intended capability      | Canonical capability inventory and fidelity report                                          |
| Run the complete plugin on the client | Client package adapter with agent, skill, hooks, tools, context, and orchestration          |
| Put the plugin behind company MCP     | Public company gateway in front of a non-public server plugin runtime                       |
| Compare more than tool results        | Task outcome, instructions, workflow, policy, approvals, context, errors, and evidence      |
| Treat latency as one cost             | Capability fidelity, governance, trust, and responsibility are primary results              |
| Keep context placement explicit       | Separate local and company context providers                                                |
| Demonstrate the trust boundary        | Distinct gateway and runtime components, even when a local profile runs both in one process |

## What stays the same

- TypeScript workspace and simple synthetic todo domain.
- Secure-by-default learning posture and non-production disclaimer.
- No real company data, credentials, prompts, or proprietary MCP contracts.
- Local stdio and Streamable HTTP protocol tests as foundation evidence.
- Azure Container Apps and `azd` for an optional, explicitly authorized live
  deployment.
- Deterministic fixtures, auditable manifests, sanitized telemetry, Playwright
  learning videos, and cleanup controls.

## Implementation plan

### Stage 1: establish the transport foundation

**Output:** Establish stdio/HTTP tool, discovery, domain, latency, and failure
evidence that later placement comparisons can reuse.

**Validation:** Docs and tests no longer claim byte-identical packages prove
plugin-placement parity.

### Stage 2: define the capability inventory

**Status:** Implemented.

**Output:**

- Use `packages/plugin-capability/` as the canonical executable source.
- Inventory agent behavior, skill steps, hook policies, tools, context,
  approvals, errors, and telemetry.
- Add a machine-readable fidelity schema with statuses `native`, `mapped`,
  `companion-required`, and `unsupported`.

**Validation:** Every current plugin feature has an owner, source path,
expected outcome, and topology mapping.

### Stage 3: build the complete client-hosted reference

**Status:** Implemented.

**Output:**

- Build one executable artifact from `plugin-capability`; load that artifact
  from the installable client package.
- Keep the local runtime, agent, skill, hooks, and approved local context on
  the learner device.
- Capture task outcomes and client-native lifecycle evidence.

**Validation:** A clean client profile can install, run, inspect, and uninstall
the complete package without the company gateway.

### Stage 4: build the company MCP boundary

**Status:** Implemented locally and in Bicep; no Azure resources are deployed
by validation.

**Output:**

- Add `packages/company-mcp-gateway/` for identity, authorization, routing,
  policy, rate limits, Origin controls, and content-free telemetry.
- Add `packages/server-plugin-runtime/` behind the gateway.
- Keep the runtime unreachable from the public client except through the
  gateway.
- Add explicit local fixtures for company identity, policy, and shared context.

**Validation:** Direct runtime access fails; authorized gateway requests reach
the runtime; unauthorized and cross-tenant fixtures fail closed.

### Stage 5: map plugin behavior into the server runtime

**Status:** Implemented with three generated profiles. Agent, skill, hooks,
local disclosure review, and approval are `companion-required` and retained
byte-for-byte in the thin companion. The connection-only profile demonstrates
their absence.

**Output:**

- Execute portable agent instructions and skill workflow in the server runtime.
- Map hook intent to gateway/runtime policy where semantically valid.
- Record any behavior that requires a thin client companion or cannot be
  represented.
- Generate a minimal companion profile only for capabilities proven to require
  it, without copying the capability executable.

**Validation:** Fidelity tests produce an explicit result for every capability;
no missing feature silently passes.

### Stage 6: run the decision experiment

**Status:** Implemented for fixture and loopback evidence. Live Azure evidence
still requires separate deployment authorization.

**Output:** Compare client-hosted, server-hosted-behind-MCP, and hybrid
topologies using the same synthetic task and evidence rubric.

Measure:

- task outcome and explanation quality;
- context availability and provenance;
- client-native behavior retained or lost;
- approval and failure experience;
- update and rollback path;
- identity and authorization ownership;
- offline behavior and network dependency;
- observability, blast radius, scaling, latency, and cost;
- user and company operator responsibilities.

**Validation:** Produce a decision scorecard that recommends client, server, or
hybrid from explicit evidence rather than a transport preference.

### Stage 7: deploy the representative company layer

**Status:** Deployment definition implemented; deployment intentionally not
performed.

**Output:** Use `azd` and Bicep to deploy an externally reachable gateway and
an internal plugin runtime to Azure Container Apps.

**Validation:** Azure evidence binds the gateway endpoint, internal runtime,
images, revisions, identity, policy profile, region, scaling, and cleanup
result. No deployment occurs without separate authorization.

### Stage 8: complete the learning experience

**Status:** Implemented in source, docs, tests, and video narratives.

**Output:** Rewrite the guided lab, architecture diagrams, responsibility
matrix, videos, and troubleshooting around the placement decision.

**Validation:** A learner can defend one of three decisions—client, server
behind company MCP, or hybrid—and cite capability-fidelity and responsibility
evidence.

## Decision scorecard

| Question                                                                    | Favors client-hosted          | Favors server behind company MCP | Favors hybrid                     |
| --------------------------------------------------------------------------- | ----------------------------- | -------------------------------- | --------------------------------- |
| Does the capability require private local files, processes, or offline use? | Yes                           | No                               | Some tasks                        |
| Does it require shared company systems or centrally governed context?       | No                            | Yes                              | Both context types                |
| Must client-native agents, skills, hooks, or approvals remain exact?        | Yes                           | Only if faithfully mapped        | Some must remain local            |
| Are centralized updates, policy, and audit required?                        | Low priority                  | High priority                    | Central core with local UX        |
| Can users tolerate network and company-layer outages?                       | No                            | Yes                              | Graceful local subset needed      |
| Who can operate identity, uptime, scaling, telemetry, and cost?             | Individual/team client owners | Company platform operator        | Shared ownership is explicit      |
| Is one shared failure domain acceptable?                                    | No                            | Yes                              | Partition critical local behavior |

## Key decisions needed

### 1. Canonical capability model

**Recommendation:** Define a repository-owned portable capability schema and
adapters rather than treating the Agent Plugin package itself as portable.

**Alternative:** Load the client package directly on the server.

**Rationale:** Client package fields may depend on client-native behavior. An
explicit schema makes unsupported mappings visible instead of pretending they
execute remotely.

### 2. Company MCP representation

**Recommendation:** Implement a representative open gateway contract with
synthetic identity and policy fixtures.

**Alternative:** Integrate a proprietary company MCP layer.

**Rationale:** The public learning repository must not depend on confidential
contracts or company infrastructure.

### 3. Remote client shape

**Recommendation:** Start with a pure MCP connection, then add a thin companion
only for capabilities that fidelity tests prove cannot cross the boundary.

**Alternative:** Ship a companion from the beginning.

**Rationale:** Starting thin makes the experiment reveal the actual minimum
client requirement.

## Risks and mitigations

### Risk: the phrase “entire plugin on the server” overstates platform support

- **Likelihood:** High
- **Impact:** High
- **Mitigation:** Use the capability inventory to distinguish portable
  behavior from client-native packaging. Never claim unsupported hooks, agents,
  or skills execute remotely.

### Risk: the simulated gateway teaches proprietary company behavior

- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:** Use only public MCP primitives and documented, synthetic
  gateway responsibilities. Label company-specific integration as out of
  scope.

### Risk: outcome parity hides lost interaction quality

- **Likelihood:** Medium
- **Impact:** High
- **Mitigation:** Test instructions, approvals, errors, provenance, recovery,
  and explanation quality in addition to final todo state.

### Risk: hybrid becomes the automatic answer

- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:** Require every retained client component to cite a failed
  fidelity test or a local/offline requirement.

## Scope

### In v1

- Synthetic capability inventory and fidelity report.
- Complete client-hosted implementation.
- Representative company MCP gateway.
- Server-hosted plugin runtime behind the gateway.
- Thin companion discovered through evidence, with byte-level comparison
  against the complete client plugin.
- Client/server/hybrid decision scorecard.
- Local automated evidence and optional authorized ACA deployment.

### Deferred

- Proprietary company MCP integration.
- Production tenant isolation, compliance certification, and enterprise SLA.
- Real company data or identity.
- Universal support claims for all Agent Plugin hosts.

## Success criteria

The lab is complete when:

1. the client-hosted topology runs the complete plugin capability;
1. the remote topology reaches a server-hosted plugin runtime only through the
   representative company MCP gateway;
1. every agent, skill, hook, tool, context, and approval behavior has a
   recorded fidelity status;
1. tests fail when a capability disappears without an explicit unsupported or
   companion-required result;
1. the learner can compare client, server, and hybrid responsibility models;
1. videos demonstrate capability fidelity and responsibility transfer, not
   only transport;
1. the final worksheet produces a defensible placement decision.

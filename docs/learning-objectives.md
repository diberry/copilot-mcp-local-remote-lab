# Learning contract

> This is a learning repository, not a production reference architecture.

## Experiment question

What do I gain and lose if I stop distributing a complete Agent Plugin to
every client and instead run its capability behind my company's MCP layer?

The client topology runs the complete plugin on the learner device. The remote
topology uses a company MCP gateway in front of a server-hosted plugin runtime.
The experiment must reveal which plugin behaviors survive that move and which
require mapping, a thin client companion, or an explicit loss.

## Hypothesis

Tool and task outcomes should remain equivalent where the company MCP layer can
faithfully represent the capability. Client-native agent, skill, hook, local
context, and approval behaviors might not remain equivalent. Centralized
identity, policy, updates, shared context, observability, and operations must
be weighed against those fidelity gaps, network dependence, blast radius, and
company operating cost.

## Capability-fidelity contract

Hold the synthetic user task, intended capability, domain rules, and expected
business outcome constant. Allow the implementation topology to differ.

For every agent instruction, skill step, hook policy, tool, context source,
approval, error, and telemetry behavior, record one status:

- **native:** preserved without adaptation;
- **mapped:** represented through an MCP or company-layer contract;
- **companion-required:** needs a thin client component; or
- **unsupported:** cannot be preserved in the selected topology.

A missing behavior without an explicit status is a failed experiment.

## Evidence chain

| Surface              | Target evidence                                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------- |
| Capability source    | One inventory maps every plugin behavior to client and server realizations                          |
| Client topology      | Complete plugin package runs without the company gateway                                            |
| Remote topology      | Connection-only and thin-companion clients use a public gateway in front of a non-public runtime    |
| Fidelity tests       | Three-profile task, package, agent, skill, hook, approval, error, and provenance evidence           |
| Responsibility tests | User and operator duties are explicit for updates, identity, data, reliability, telemetry, and cost |
| Videos               | Capability retained, capability lost, company governance gained, and hybrid decision                |
| Deployment           | Gateway and internal runtime have distinct identities, ingress, revisions, and evidence             |
| Decision scorecard   | Evidence supports client, server, or hybrid rather than assuming one answer                         |

## Success criteria

After the lab, verify that you can answer:

1. Which parts of the complete plugin remain faithful behind company MCP?
1. Which parts require mapping, a thin companion, or an accepted loss?
1. What centralized context, policy, update, and observability value is gained?
1. What local context, offline behavior, interaction quality, or autonomy is
   lost?
1. Which responsibilities transfer from the user to the company operator?
1. What new shared failure domain, security boundary, latency, and cost appear?
1. Should the capability be client-hosted, server-hosted behind company MCP,
   or hybrid?

## Limits of the evidence

- Fixture and loopback results are the transport stage of the evidence chain;
  they do not by themselves prove company-gateway or complete-plugin fidelity.
- The videos visualize sanitized evidence; they do not record a native Copilot
  client or Azure portal.
- A `live-aca` report proves only the queried deployment and controls recorded
  in that report.
- Twenty pairs describe the lab run. They do not establish universal
  statistical superiority.
- In-memory, single-replica behavior intentionally excludes persistence and
  horizontal scaling from the baseline.
- The company layer is representative and synthetic; it cannot prove
  compatibility with a proprietary enterprise MCP implementation.

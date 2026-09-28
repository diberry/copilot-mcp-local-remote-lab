# Concepts

> This is a learning repository, not a production reference architecture.

An Agent Plugin 1.0 package has a root `plugin.json`, optional `mcp.json`,
portable skills, and namespaced client extensions. It is not the legacy GitHub
plugin format and is unrelated to Microsoft 365 Copilot plugin manifests.

The target experiment asks whether the capability represented by that complete
package can instead run behind a company's MCP layer. “Behind” matters: the
plugin runtime is not the public MCP server. A company gateway fronts it and
owns identity, authorization, policy, routing, and operational controls.

The company boundary might not preserve every client-native feature. Tool
calls can map cleanly to MCP while custom-agent behavior, skills, hooks, local
context, and interactive approvals might require adaptation or a thin client
companion. The lab must measure that fidelity rather than assume it.

## Compare placement choices

Choose a complete client-hosted plugin when value depends on exact
client-native behavior, private local context, offline use, low latency, or
user-controlled execution.

Choose a server-hosted plugin behind company MCP when centralized identity,
policy, updates, shared systems, governed context, observability, and service
operations outweigh fidelity gaps and network dependence.

Choose hybrid only when evidence shows that a thin client companion is needed
for client-native UX, local context, approvals, hooks, or offline behavior
while the shared capability belongs behind company MCP.

## Follow responsibility across the boundary

| Concern             | Complete client plugin                        | Plugin behind company MCP                                 |
| ------------------- | --------------------------------------------- | --------------------------------------------------------- |
| Capability fidelity | Native agent, skill, hook, and local behavior | Must be measured feature by feature                       |
| Runtime and updates | User maintains the package and runtime        | Operator deploys and patches gateway and runtime          |
| Context             | User grants local access                      | User controls disclosure; operator governs shared context |
| Availability        | User keeps the device and process available   | Operator owns uptime, scaling, and recovery               |
| Identity            | Local OS/process boundary                     | Company gateway authenticates and authorizes              |
| Evidence            | User inspects local results and logs          | Operator supplies provenance; user verifies it            |
| Failure domain      | Per user/device                               | Shared service and company-layer blast radius             |
| Cost                | User device resources                         | Operator monitors cloud consumption                       |

## Preserve capability intent, not package bytes

The synthetic user task, intended capability, domain rules, and expected
business outcome remain fixed. The client package and server runtime are
allowed to differ because their hosts expose different primitives. The
capability inventory makes those differences auditable instead of hiding them
behind byte-identical client bundles. This lab instead proves that the local
client and private runtime load one executable artifact hash while the remote
client carries connection metadata only.

The experiment has three questions:

1. **Fidelity:** Which complete-plugin behaviors remain native, map cleanly,
   require a companion, or are lost?
1. **Company value:** What identity, policy, shared context, updates,
   observability, and operations become possible?
1. **Responsibility:** What moves from the user to the company operator, and
   what trust, failure, latency, and cost are introduced?

Tool transport parity is foundation evidence, but it is not proof of
complete-plugin fidelity.

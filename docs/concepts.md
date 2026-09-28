# Concepts

> This is a learning repository, not a production reference architecture.

An Agent Plugin 1.0 package has a root `plugin.json`, optional `mcp.json`,
portable skills, and namespaced client extensions. It is not the legacy GitHub
plugin format and is unrelated to Microsoft 365 Copilot plugin manifests.

The target experiment asks whether the capability represented by that complete
package can instead run behind a company's MCP layer. “Behind” matters: the
plugin runtime is not the public MCP server. A company gateway fronts it and
owns identity, authorization, policy, routing, and operational controls.

The company boundary does not execute client-native surfaces. Tool calls map
cleanly to MCP, while the implemented thin companion retains the canonical
custom agent, skill, hooks, disclosure review, and approval on the client. The
connection-only profile makes the behavior lost without that companion
observable.

## Compare placement choices

Choose a complete client-hosted plugin when value depends on exact
client-native behavior, private local context, offline use, low latency, or
user-controlled execution.

Choose a server-hosted plugin behind company MCP when centralized identity,
policy, updates, shared systems, governed context, observability, and service
operations outweigh fidelity gaps and network dependence.

Choose hybrid when the three-profile evidence shows that the implemented thin
companion is needed for client-native UX, local context disclosure, approvals,
or hooks while the shared capability belongs behind company MCP.

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
business outcome remain fixed. The complete client and private runtime load
one executable artifact hash. The connection-only client carries metadata and
attestation only; the companion adds a byte-identical subset of client-native
files without copying the executable capability.

The experiment has three questions:

1. **Fidelity:** Which complete-plugin behaviors remain native, map cleanly,
   require a companion, or are lost?
1. **Company value:** What identity, policy, shared context, updates,
   observability, and operations become possible?
1. **Responsibility:** What moves from the user to the company operator, and
   what trust, failure, latency, and cost are introduced?

Tool transport parity is foundation evidence, but it is not proof of
complete-plugin fidelity.

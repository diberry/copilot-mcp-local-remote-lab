# Concepts

> This is a learning repository, not a production reference architecture.

An Agent Plugin 1.0 package has a root `plugin.json`, optional `mcp.json`, portable skills, and namespaced client extensions. It is not the legacy GitHub plugin format and is unrelated to Microsoft 365 Copilot plugin manifests.

The plugin, `todo-experimenter` custom agent, comparison skill, and lifecycle hook stay in the Copilot client environment. With the local binding, that client launches a child process and exchanges JSON-RPC over stdin/stdout. With the remote binding, the client sends HTTPS requests to the MCP server in ACA. The `TodoService`, schemas, normalized errors, and `registerTodoTools()` implementation are identical.

Choose local for low latency, offline-capable tool execution, and access to explicitly granted local resources. Choose remote for centralized updates, managed cloud identity, shared observability, and server-side integrations. Remote adds network, authentication, platform, scaling, and cost concerns.

## Separate model intelligence from available evidence

Moving MCP execution does not move the Agent Plugin or make the model
inherently smarter. The model, custom agent, skill, and hooks remain in the
client. What can change is the evidence returned by the tool:

- A local tool can use learner-approved files, processes, and preferences that
  should remain on the device.
- A remote tool can use centrally governed team policy, shared systems, and
  current organizational data that individual devices should not maintain.

The context-placement cell makes that difference observable. The same
`diagnostics` tool returns a local focus signal over stdio and a team policy
signal over HTTP. The model can recommend a different synthetic todo because
its evidence changed, not because its reasoning engine moved.

## Follow responsibility across the boundary

| Concern               | Local MCP execution                         | Remote MCP execution                                                     |
| --------------------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| Runtime and updates   | User maintains a compatible local process   | Operator deploys and patches the service                                 |
| Context approval      | User grants local access                    | User decides what may cross the network; operator governs shared context |
| Availability          | User keeps the device and process available | Operator owns uptime, scaling, and recovery                              |
| Identity              | Local OS/process boundary                   | User authenticates; operator enforces authorization                      |
| Evidence              | User inspects local results and logs        | Operator supplies provenance; user verifies it                           |
| Privacy and telemetry | User controls local artifacts               | Operator minimizes and secures shared telemetry                          |
| Cost                  | User device resources                       | Operator monitors cloud consumption                                      |

## Why compare the same plugin?

Changing the plugin and the transport at the same time would make the result
ambiguous. This lab therefore treats the plugin payload, tool registration,
schemas, todo service, synthetic inputs, and run ordering as controls. The
generated bindings are byte-identical except for `mcp.json`.

The experiment has three separate questions:

1. **Parity:** Does the client discover the same tools and reach the same
   domain outcome through each boundary?
1. **Tradeoff:** What latency, failure modes, security controls, operations,
   and cost does the remote boundary add?
1. **Context and responsibility:** What evidence becomes available at each
   boundary, how does it change the model's answer, and who must govern it?

Parity is a prerequisite for interpreting the other cells. If baseline
behavior differs, fix the implementation before comparing measurements or
context-derived recommendations.

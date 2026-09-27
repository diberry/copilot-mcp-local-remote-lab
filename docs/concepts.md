# Concepts

> This is a learning repository, not a production reference architecture.

An Agent Plugin 1.0 package has a root `plugin.json`, optional `mcp.json`, portable skills, and namespaced client extensions. It is not the legacy GitHub plugin format and is unrelated to Microsoft 365 Copilot plugin manifests.

The plugin, `todo-experimenter` custom agent, comparison skill, and lifecycle hook stay in the Copilot client environment. With the local binding, that client launches a child process and exchanges JSON-RPC over stdin/stdout. With the remote binding, the client sends HTTPS requests to the MCP server in ACA. The `TodoService`, schemas, normalized errors, and `registerTodoTools()` implementation are identical.

Choose local for low latency, offline-capable tool execution, and access to explicitly granted local resources. Choose remote for centralized updates, managed cloud identity, shared observability, and server-side integrations. Remote adds network, authentication, platform, scaling, and cost concerns.

## Why compare the same plugin?

Changing the plugin and the transport at the same time would make the result
ambiguous. This lab therefore treats the plugin payload, tool registration,
schemas, todo service, synthetic inputs, and run ordering as controls. The
generated bindings are byte-identical except for `mcp.json`.

The experiment has two separate questions:

1. **Parity:** Does the client discover the same tools and reach the same
   domain outcome through each boundary?
1. **Tradeoff:** What latency, failure modes, security controls, operations,
   and cost does the remote boundary add?

Parity is a prerequisite for interpreting the tradeoff. If behavior differs,
fix the implementation before comparing measurements.

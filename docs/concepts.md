# Concepts

> This is a learning repository, not a production reference architecture.

An Agent Plugin 1.0 package has a root `plugin.json`, optional `mcp.json`, portable skills, and namespaced client extensions. It is not the legacy GitHub plugin format and is unrelated to Microsoft 365 Copilot plugin manifests.

The plugin, `todo-experimenter` custom agent, comparison skill, and lifecycle hook stay in the Copilot client environment. With the local binding, that client launches a child process and exchanges JSON-RPC over stdin/stdout. With the remote binding, the client sends HTTPS requests to the MCP server in ACA. The `TodoService`, schemas, normalized errors, and `registerTodoTools()` implementation are identical.

Choose local for low latency, offline-capable tool execution, and access to explicitly granted local resources. Choose remote for centralized updates, managed cloud identity, shared observability, and server-side integrations. Remote adds network, authentication, platform, scaling, and cost concerns.

# Telemetry schema

> This is a learning repository, not a production reference architecture.

Allowed fields are `experimentRunId`, `requestId`, `transport`, `operation`, client/server timing and durations, `coldStart`, `outcome`, `errorCategory`, versions, protocol version, revision/replica, and local process startup duration. Unknown fields are discarded at runtime.

```json
{
  "requestId": "synthetic-request",
  "transport": "stdio",
  "operation": "list_todos",
  "serverDurationMs": 1.2,
  "outcome": "success",
  "serverVersion": "1.0.0"
}
```

Prompts, todo content, secrets, headers, environment values, paths, identities, and IP addresses are forbidden.

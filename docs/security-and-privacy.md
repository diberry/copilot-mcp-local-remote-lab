# Security and privacy

> This is a learning repository, not a production reference architecture.

Treat plugin files as public. Store no credentials in manifests, examples, source, logs, or shell commands. Remote non-loopback traffic uses HTTPS. The adapter validates method, content type, one-megabyte body limit, Origin, and optional bearer auth before MCP dispatch. ACA runs non-root with a managed identity and minimum scale.

Telemetry is allow-listed to correlation, transport, operation name, timing, outcome/category, versions, and remote revision/replica identifiers. It excludes prompts, todo text, arguments containing content, tokens, headers, environment values, paths, identities, and IP addresses. Synthetic data is mandatory. Auth failure must not echo credentials.

Agent instructions are not an authorization boundary. Entra/ACA built-in auth is an advanced option only after a real client token-flow compatibility test.

# Security and privacy

> This is a learning repository, not a production reference architecture.

Treat plugin files as public. Store no credentials in manifests, examples, source, logs, or shell commands. Remote non-loopback traffic uses HTTPS. The adapter validates method, content type, one-megabyte body limit, Origin, and optional bearer auth before MCP dispatch. ACA runs non-root with a managed identity and minimum scale.

Telemetry is allow-listed to correlation, transport, operation name, timing, outcome/category, versions, and remote revision/replica identifiers. It excludes prompts, todo text, arguments containing content, tokens, headers, environment values, paths, identities, and IP addresses. Synthetic data is mandatory. Auth failure must not echo credentials.

Agent instructions are not an authorization boundary. Entra/ACA built-in auth is an advanced option only after a real client token-flow compatibility test.

The context-placement cell adds a trust lesson. Local context remains under the
learner's access decisions. Remote context crosses a network boundary and is
governed by an operator, so the user must authenticate, decide what data may be
sent, and verify provenance before acting. The operator must authorize access,
keep shared context current, define retention and deletion, protect tenant
boundaries, and avoid collecting task content in telemetry.

The included context is synthetic and contains no user or organizational data.
Do not replace it with real content unless the data owner, authorization model,
retention policy, and evidence provenance are explicit.

# Troubleshooting

> This is a learning repository, not a production reference architecture.

- **Plugin stale:** uninstall, regenerate, reinstall one bundle, and start a fresh client session.
- **Node/path error:** verify `node --version` is 22.14.0 and the generated bundle contains `dist/`.
- **stdio parse failure:** remove stdout logging; server diagnostics belong on stderr.
- **403:** use an allow-listed Origin.
- **401:** configure the client-managed bearer token; never edit it into package files.
- **DNS/TLS/5xx:** check the endpoint, active ACA revision, readiness probe, and console logs.
- **429/timeout:** keep bounded retries outside timed samples and label failure evidence.
- **State changed after restart:** in-memory reset is expected; use one replica for baseline.

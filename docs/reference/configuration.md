# Configuration reference

> This is a learning repository, not a production reference architecture.

| Component                    | Exact tested pin              |
| ---------------------------- | ----------------------------- |
| Node.js                      | 22.14.0                       |
| npm                          | 10.9.2                        |
| TypeScript                   | 7.0.2                         |
| MCP server/node packages     | 2.0.0                         |
| Zod                          | 4.6.5                         |
| Vitest                       | 5.0.1                         |
| Playwright                   | 1.63.0                        |
| Playwright Chromium          | 153.0.8010.12 (revision 1243) |
| Azure CLI observed           | 2.82.0                        |
| Azure Developer CLI observed | 1.32.0                        |
| Bicep CLI observed           | 0.39.26                       |
| Docker CLI observed          | 29.1.3                        |

Gateway variables are `PORT` (default `3000`), `HOST`,
`ALLOWED_ORIGINS`, `PLUGIN_RUNTIME_URL`, and optional `MCP_BEARER_TOKEN`.
Runtime variables are `PORT` (default `3001`), `HOST`, and
`PLUGIN_ARTIFACT_ROOT`. Runner variables include `EXPERIMENT_CELL`,
`EXPERIMENT_ORIGIN`, `ACA_RESOURCE_GROUP`, `ACA_GATEWAY_APP_NAME`,
`ACA_RUNTIME_APP_NAME`, and optional `AZURE_SUBSCRIPTION_ID`. Do not print
secret values. `REMOTE_MCP_URL` is accepted only by connection-bundle
generation and must be credential-free HTTPS.

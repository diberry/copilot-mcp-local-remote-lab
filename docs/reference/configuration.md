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

Environment variables: `PORT` (default 3000), `HOST` (default `0.0.0.0`), `ALLOWED_ORIGINS` (comma-separated), and optional `MCP_BEARER_TOKEN`. Do not print values. `REMOTE_MCP_URL` is accepted only by bundle generation and must be credential-free HTTPS.

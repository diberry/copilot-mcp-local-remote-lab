# Local setup

> This is a learning repository, not a production reference architecture.

Install the exact versions in [configuration](reference/configuration.md), then:

```powershell
npm ci
npm run plugin:build
npm run plugin:validate
npm run plugin:compare
npm run plugin:verify-reuse
```

Install `plugins/local` using the pinned Copilot client's Agent Plugin command.
Start a fresh client session and invoke `diagnostics`; expect
`placement: "client"`, plugin version `1.0.0`, and the local artifact identity.
`plugins/local/artifact.json` records the executable SHA-256. Run
`npm run test:contract -- --profile=local`. Uninstall the package and start a
fresh session before switching placements. Diagnostics go to stderr because
stdout is reserved for MCP frames.

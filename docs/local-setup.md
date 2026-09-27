# Local setup

> This is a learning repository, not a production reference architecture.

Install the exact versions in [configuration](reference/configuration.md), then:

```powershell
npm ci
npm run plugin:build
npm run plugin:validate
npm run plugin:compare
```

Install `plugins/local` using the pinned Copilot client's Agent Plugin command. Start a fresh client session and invoke `diagnostics`; expect `transport: "stdio"` and version `1.0.0`. Run `npm run test:contract -- --profile=local`. Uninstall the package and start a fresh session before switching bindings. Diagnostics go to stderr because stdout is reserved for MCP frames.

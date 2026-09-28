# Remote setup

> This is a learning repository, not a production reference architecture.

After an explicitly authorized deployment, inject only its public HTTPS endpoint:

```powershell
node scripts/inject-remote-url.mjs https://YOUR-APP.example
npm run plugin:build
npm run plugin:compare
npm run plugin:verify-reuse
```

Never put a token or credential header in `mcp.json`. Configure client-managed
authorization for the bearer exercise. `plugins/remote` contains only the
connection manifest, MCP binding, and `server-artifact.json`; it contains no
plugin executable, custom agent, skill, or hooks. Install it in a fresh client
session, call `diagnostics`, expect `placement: "company-mcp"`, and verify that
the runtime health evidence uses the attested artifact hash. Then run discovery
parity and the scenario. An invalid origin must return 403; an auth-enabled
endpoint without a bearer token must return 401.

The deployed container allows the Bicep `allowedOrigin`, which defaults to `https://copilot.local`. Live experiment requests use that same default through `EXPERIMENT_ORIGIN`. When overriding the deployment parameter, set `EXPERIMENT_ORIGIN` to the identical HTTPS origin; do not disable or broaden origin validation.

Automated live evidence supports only the default `*.azurecontainerapps.io`
hostname and exact `/mcp` path. Set `ACA_RESOURCE_GROUP`,
`ACA_GATEWAY_APP_NAME`, `ACA_RUNTIME_APP_NAME`, and optionally
`AZURE_SUBSCRIPTION_ID`. Custom domains remain a manual follow-on.

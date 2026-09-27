# Remote setup

> This is a learning repository, not a production reference architecture.

After an explicitly authorized deployment, inject only its public HTTPS endpoint:

```powershell
node scripts/inject-remote-url.mjs https://YOUR-APP.example
npm run plugin:build
npm run plugin:compare
```

Never put a token or credential header in `mcp.json`. Configure client-managed authorization for the bearer exercise. Install only `plugins/remote` in a fresh client session, call `diagnostics`, expect `streamable-http`, run discovery parity, then the scenario. An invalid origin must return 403; an auth-enabled endpoint without a bearer token must return 401.

The deployed container allows the Bicep `allowedOrigin`, which defaults to `https://copilot.local`. Live experiment requests use that same default through `EXPERIMENT_ORIGIN`. When overriding the deployment parameter, set `EXPERIMENT_ORIGIN` to the identical HTTPS origin; do not disable or broaden origin validation.

Automated live evidence supports only the default `*.azurecontainerapps.io` hostname and exact `/mcp` path. Set `ACA_RESOURCE_GROUP` and `ACA_APP_NAME`, and optionally `AZURE_SUBSCRIPTION_ID`. The runner obtains the endpoint and runtime controls directly with `az containerapp show`; custom domains remain a manual follow-on.

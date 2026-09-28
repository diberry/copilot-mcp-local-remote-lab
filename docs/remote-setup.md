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
authorization for the bearer exercise.

Compare both remote profiles in separate fresh sessions:

1. Install `plugins/remote`. It contains only the connection manifest, MCP
   binding, and `server-artifact.json`. Record the missing agent, skill, hook,
   disclosure, and approval experience.
1. Uninstall it and install `plugins/companion`. It contains the same binding
   and attestation plus byte-identical canonical agent, skill, and hook files.
   It contains no capability executable. Confirm that it lists synthetic
   disclosure values and requests explicit approval before task tool calls.

For both profiles, call `diagnostics`, expect `placement: "company-mcp"`, and
verify that runtime health uses the attested artifact hash. An invalid origin
must return 403; an auth-enabled endpoint without a bearer token must return 401.

The deployed container allows the Bicep `allowedOrigin`, which defaults to `https://copilot.local`. Live experiment requests use that same default through `EXPERIMENT_ORIGIN`. When overriding the deployment parameter, set `EXPERIMENT_ORIGIN` to the identical HTTPS origin; do not disable or broaden origin validation.

Automated live evidence supports only the default `*.azurecontainerapps.io`
hostname and exact `/mcp` path. Set `ACA_RESOURCE_GROUP`,
`ACA_GATEWAY_APP_NAME`, `ACA_RUNTIME_APP_NAME`, and optionally
`AZURE_SUBSCRIPTION_ID`. Custom domains remain a manual follow-on.

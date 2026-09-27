# Remote setup

> This is a learning repository, not a production reference architecture.

After an explicitly authorized deployment, inject only its public HTTPS endpoint:

```powershell
node scripts/inject-remote-url.mjs https://YOUR-APP.example
npm run plugin:build
npm run plugin:compare
```

Never put a token or credential header in `mcp.json`. Configure client-managed authorization for the bearer exercise. Install only `plugins/remote` in a fresh client session, call `diagnostics`, expect `streamable-http`, run discovery parity, then the scenario. An invalid origin must return 403; an auth-enabled endpoint without a bearer token must return 401.

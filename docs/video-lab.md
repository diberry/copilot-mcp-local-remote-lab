# Video lab

> This is a learning repository, not a production reference architecture.

The videos record only a purpose-built local HTML storyboard from sanitized fixtures. This is `remote-test`/loopback illustration, not live ACA evidence. They do not record a native Copilot client, terminal, Azure portal, browser profile, credentials, or desktop.

A `live-aca` fixture is accepted only with a SHA-256 image digest, ACA revision, Azure region, and HTTPS `*.azurecontainerapps.io/mcp` endpoint. Rendered live claims come from those validated fields. Loopback fixtures must omit all deployment metadata.

Both fixtures must declare the same plugin version, tool count, and canonical discovery SHA-256. `video:prepare` rebuilds the plugin, performs real stdio and Streamable HTTP discovery, reads the authoritative version from matching canonical/local/remote generated plugin manifests, and atomically publishes a summary only after parity succeeds. Video preparation verifies both fixtures against that generated summary before rendering those values.

```powershell
npx playwright install chromium
npm run video:prepare
npm run video:capture
npm run video:verify
```

Open `artifacts/videos/index.html`. The four clips explain the execution boundary, equivalent tool flow, baseline versus cold/warm latency, and failure/recovery. Each has a description and text transcript. Inputs containing forbidden prompt, todo content, token, header, environment, identity, IP, or local-path fields fail closed. Treat videos, traces, screenshots, and raw inputs as local/CI artifacts with workflow retention of seven days.

# Video lab

> This is a learning repository, not a production reference architecture.

The videos record only a purpose-built local HTML storyboard from sanitized fixtures. They do not record a native Copilot client, terminal, Azure portal, browser profile, credentials, or desktop.

```powershell
npx playwright install chromium
npm run video:prepare
npm run video:capture
npm run video:verify
```

Open `artifacts/videos/index.html`. The four clips explain the execution boundary, equivalent tool flow, baseline versus cold/warm latency, and failure/recovery. Each has a description and text transcript. Inputs containing forbidden prompt, todo content, token, header, environment, identity, IP, or local-path fields fail closed. Treat videos, traces, screenshots, and raw inputs as local/CI artifacts with workflow retention of seven days.

# Copilot MCP local/remote lab

> [!IMPORTANT]
> This is a learning repository, not a production reference architecture. It uses synthetic data and secure-by-default controls, but the unauthenticated baseline endpoint is suitable only for a short-lived lab and must be removed immediately afterward.

Compare the **same GitHub Copilot Agent Plugin** across two MCP boundaries: a client-launched local process over `stdio`, and the same shared TypeScript tools over Streamable HTTP. The default automated experiment uses a real loopback HTTP listener and is labeled `remote-test`; it is not evidence of an Azure Container Apps (ACA) deployment.

## What runs where?

The plugin envelope, custom agent, skill, and hook are installed and interpreted by the Copilot client. The local MCP process runs on the learner device. In an explicitly authorized live experiment, only the remote MCP server runs in ACA. This repository does not implement a Microsoft 365 Copilot plugin.

## Learning path

1. Read [concepts](docs/concepts.md) and [architecture](docs/architecture.md).
2. Complete [local setup](docs/local-setup.md) and the [usage lab](docs/usage-lab.md).
3. Read [security and privacy](docs/security-and-privacy.md), then [deployment](docs/deployment.md).
4. Complete [remote setup](docs/remote-setup.md) and the [comparison lab](docs/comparison-lab.md).
5. Generate the [visual lab](docs/video-lab.md).
6. Follow [cleanup and cost controls](docs/cleanup-and-cost.md).

## Quick validation

Prerequisites are pinned in [configuration reference](docs/reference/configuration.md).

```powershell
npm ci
npm run check
npx playwright install chromium
npm run video:prepare
npm run video:capture
npm run video:verify
```

No Azure subscription or native Copilot client is required for these fixture/loopback checks, and none of these commands deploys Azure resources. See [troubleshooting](docs/troubleshooting.md), [tool reference](docs/reference/tools.md), and [contributing](CONTRIBUTING.md).

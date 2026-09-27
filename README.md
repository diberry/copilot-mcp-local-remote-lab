# Copilot MCP local/remote lab

> [!IMPORTANT]
> This is a learning repository, not a production reference architecture. It uses synthetic data and secure-by-default controls, but the unauthenticated baseline endpoint is suitable only for a short-lived lab and must be removed immediately afterward.

Compare the **same GitHub Copilot Agent Plugin** across two MCP boundaries: a client-launched local process over `stdio`, and the same shared TypeScript tools over Streamable HTTP. The default automated experiment uses a real loopback HTTP listener and is labeled `remote-test`; it is not evidence of an Azure Container Apps (ACA) deployment.

## What you will learn

By completing the lab, you will be able to:

1. Identify which parts of an Agent Plugin stay in the client and which MCP
   server components can move behind a remote boundary.
1. Prove that local and remote bindings expose the same plugin payload, tool
   catalog, schemas, scenario, and domain behavior.
1. Measure transport overhead with alternating paired runs while holding auth,
   storage, replica count, temperature, and scenario constant.
1. Distinguish loopback `remote-test` evidence from evidence collected against
   an explicitly authorized Azure Container Apps deployment.
1. Explain the operational tradeoffs introduced by a remote MCP boundary:
   authentication, origin validation, networking, observability, scaling,
   cost, and cleanup.

The point is not to prove that one transport is universally better. The point
is to make the boundary the only intended variable, gather auditable evidence,
and decide which tradeoffs fit a specific tool.

## What runs where?

The plugin envelope, custom agent, skill, and hook are installed and interpreted by the Copilot client. The local MCP process runs on the learner device. In an explicitly authorized live experiment, only the remote MCP server runs in ACA. This repository does not implement a Microsoft 365 Copilot plugin.

## Learning path

1. Start with the [learning contract](docs/learning-objectives.md), then read
   [concepts](docs/concepts.md), [architecture](docs/architecture.md), and the
   [source code tour](packages/README.md).
2. Complete [local setup](docs/local-setup.md) and the [usage lab](docs/usage-lab.md).
3. Read [security and privacy](docs/security-and-privacy.md), then [deployment](docs/deployment.md).
4. Complete [remote setup](docs/remote-setup.md) and the [comparison lab](docs/comparison-lab.md).
5. Generate the [visual lab](docs/video-lab.md).
6. Follow [cleanup and cost controls](docs/cleanup-and-cost.md).
7. Read the short essay
   [Where should an Agent Plugin live?](docs/blog/where-should-agent-plugin-live.md)
   for the architectural decision this experiment is designed to support.

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

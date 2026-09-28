# Copilot MCP local/remote lab

> [!IMPORTANT]
> This is a learning repository, not a production reference architecture. It uses synthetic data and secure-by-default controls, but the unauthenticated baseline endpoint is suitable only for a short-lived lab and must be removed immediately afterward.

Compare the **same GitHub Copilot Agent Plugin** across two MCP boundaries: a client-launched local process over `stdio`, and the same shared TypeScript tools over Streamable HTTP. Transport parity is the control, not the final lesson. A separate context-placement study shows how the evidence available to the AI and the responsibilities carried by the user change when tool execution becomes a shared service. The default automated experiment uses a real loopback HTTP listener and is labeled `remote-test`; it is not evidence of an Azure Container Apps (ACA) deployment.

## What you will learn

By completing the lab, you will be able to:

1. Identify which parts of an Agent Plugin stay in the client and which MCP
   server components can move behind a remote boundary.
1. Prove that local and remote bindings expose the same plugin payload, tool
   catalog, schemas, scenario, and domain behavior.
1. Explain that the model does not become inherently smarter when a tool moves
   remote; its answers can change because the tool can expose different,
   centrally governed evidence.
1. Compare user responsibilities for local runtime, updates, availability, and
   data access with service-operator responsibilities for identity, context
   governance, reliability, telemetry, scaling, and cost.
1. Measure transport overhead with alternating paired runs while holding auth,
   storage, replica count, temperature, and scenario constant.
1. Distinguish loopback `remote-test` evidence from evidence collected against
   an explicitly authorized Azure Container Apps deployment.
1. Explain the operational tradeoffs introduced by a remote MCP boundary:
   authentication, origin validation, networking, observability, scaling,
   cost, and cleanup.

The point is not to prove that one transport is universally better. The
transport baseline isolates the boundary. The context-placement cell then
changes one additional variable deliberately: where decision evidence is
governed. Together they show when a remote boundary changes more than latency.

## What runs where?

The plugin envelope, custom agent, skill, model reasoning, and hook remain in
the Copilot client. The local MCP process and its approved context run on the
learner device. In an explicitly authorized live experiment, only the remote
MCP server and operator-governed context run in ACA. This repository does not
implement a Microsoft 365 Copilot plugin.

## Learning path

1. Start with the [learning contract](docs/learning-objectives.md), then read
   [concepts](docs/concepts.md), [architecture](docs/architecture.md), and the
   [source code tour](packages/README.md).
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

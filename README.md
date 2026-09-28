# Copilot MCP local/remote lab

> [!IMPORTANT]
> This is a learning repository, not a production reference architecture. It uses synthetic data and secure-by-default controls, but the unauthenticated baseline endpoint is suitable only for a short-lived lab and must be removed immediately afterward.

Explore the tradeoffs between distributing a **complete client-installed Agent
Plugin** and running the same capability **behind a company's MCP layer**.
The remote design does not turn the plugin into an MCP server. A company MCP
gateway authenticates, authorizes, applies policy, and routes requests to a
server-hosted plugin runtime behind it.

The lab builds its evidence in stages. It first establishes transport,
discovery, domain, latency, and failure controls. It then uses one capability
inventory to compare the complete client plugin with a server-hosted plugin
runtime behind a representative company MCP gateway.

## What you will learn

By completing the lab, you will be able to:

1. Compare the complete client-hosted plugin with a server-hosted plugin
   runtime behind a representative company MCP gateway.
1. Identify which agent, skill, hook, tool, context, approval, and error
   behaviors remain faithful, require mapping, need a thin client companion,
   or cannot be preserved.
1. Evaluate what moves from the user to the company operator: updates,
   identity, policy, context governance, availability, telemetry, scaling,
   failure recovery, and cost.
1. Decide whether a capability should be client-hosted, server-hosted behind
   company MCP, or hybrid.
1. Use transport, discovery, latency, and deployment evidence as supporting
   costs rather than treating transport parity as the final result.

The central question is capability fidelity and responsibility transfer, not
which transport is faster. “Same plugin” is a hypothesis to test: the company
MCP layer might preserve tools while losing or changing client-native agent,
skill, hook, local-context, or approval behavior.

## What runs where?

The client topology installs and runs the complete plugin on the learner
device. The target remote topology keeps only the minimum connection surface
in the client; the company MCP gateway fronts a server-hosted plugin runtime.
A thin client companion is allowed only when fidelity evidence proves that a
client-native behavior cannot cross MCP. This repository does not implement a
Microsoft 365 Copilot plugin.

## Learning path

1. Start with the [learning contract](docs/learning-objectives.md), the
   [architecture and implementation plan](docs/implementation-plan.md),
   then read [concepts](docs/concepts.md), [architecture](docs/architecture.md),
   and the [source code tour](packages/README.md).
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

These commands validate the lab's transport foundation. No Azure subscription
or native Copilot client is required for the fixture/loopback checks, and none
of these commands deploys Azure resources. See
[troubleshooting](docs/troubleshooting.md),
[tool reference](docs/reference/tools.md), and
[contributing](CONTRIBUTING.md).

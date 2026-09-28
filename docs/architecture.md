# Architecture

> This is a learning repository, not a production reference architecture.

## Target topologies

The experiment compares two implementation topologies for one intended
capability. It does not assume that moving behind company MCP preserves every
Agent Plugin behavior.

### Complete client-hosted plugin

```mermaid
flowchart LR
  U[Learner] --> C[Copilot client]
  C --> P[Complete Agent Plugin]
  P --> A[Agent + skill + hooks]
  P --> R[Local capability runtime]
  R --> L[Approved local context]
  subgraph Device[Learner device]
    C
    P
    A
    R
    L
  end
```

The learner owns package installation, runtime compatibility, updates, local
access, device availability, and local evidence.

### Server-hosted plugin behind company MCP

```mermaid
flowchart LR
  U[Learner] --> C[Copilot client]
  C --> T[Minimum MCP connection surface]
  T --> G[Company MCP gateway]
  G --> P[Server-hosted plugin runtime]
  P --> S[Shared context and company systems]
  subgraph Company[Company trust boundary]
    G
    P
    S
  end
```

The company gateway owns authentication, authorization, policy, routing, rate
limits, and content-free operational telemetry. The plugin runtime behind it
owns the portable capability behavior and shared context access. The company
operator owns deployment, updates, availability, recovery, scaling, and cost.
The user still owns authentication, disclosure choices, and the decision to
trust or reject returned evidence.

## Capability mapping

```mermaid
flowchart TB
  D[Canonical capability definition] --> C[Client Agent Plugin adapter]
  D --> S[Server plugin-runtime adapter]
  C --> CP[Complete client package]
  S --> G[Company MCP gateway]
  D --> F[Fidelity inventory]
  CP --> F
  G --> F
```

The canonical capability definition records tool behavior, agent intent, skill
workflow, hook policy, context requirements, approvals, errors, and telemetry.
The adapters may produce different artifacts. Byte identity is not the target.
Every capability must instead receive one fidelity status:

- `native`;
- `mapped`;
- `companion-required`; or
- `unsupported`.

The hybrid topology is not assumed. It is selected only when a fidelity test
shows that valuable client-native behavior cannot cross MCP or when local and
offline context is a requirement.

## Current implementation gap

The repository currently builds one client plugin with local and remote MCP
bindings. Its custom agent, skill, and hooks remain client-side in both cases.
The HTTP adapter directly hosts the tools. There is no separate company MCP
gateway or server-hosted plugin runtime.

Those tests remain useful as a transport baseline, but they cannot answer
whether the complete plugin retains its behavior behind a company MCP layer.
The implementation changes are planned in the
[company MCP architecture proposal](proposals/plugin-behind-company-mcp.md).

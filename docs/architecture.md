# Architecture

> This is a learning repository, not a production reference architecture.

The client boundary contains the model interaction, package discovery, agent
instructions, skill, and hooks. The local process and learner-approved context
are also on the learner device. The cloud boundary contains only the remote MCP
adapter, its shared tool/domain code, and operator-governed context.

```mermaid
flowchart LR
  U[Learner] --> C[Copilot client<br/>plugin + agent + skill + hook]
  C -->|JSON-RPC stdio| L[Local MCP process<br/>learner-approved context]
  C -->|HTTPS POST /mcp| R[Remote MCP in ACA<br/>operator-governed context]
  subgraph Device[Learner device]
    C
    L
  end
  subgraph Azure[Azure trust boundary]
    R
  end
```

![Context diagram showing the Copilot client and local MCP process on the learner device, with the remote MCP server in Azure.](media/execution-context.svg)

Both adapters call one registration factory, which calls one injected todo service. Core code has no MCP, HTTP, or process imports.

```mermaid
flowchart TB
  S[stdio adapter] --> F[registerTodoTools]
  H[HTTP adapter] --> F
  F --> D[TodoService]
  D --> M[In-memory storage]
```

![Container diagram showing both stdio and HTTP adapters calling one shared tool-registration layer and todo core.](media/execution-containers.svg)

Each invocation follows the same logical sequence, with only the selected transport changing.

```mermaid
sequenceDiagram
  actor Learner
  participant Client
  participant Transport
  participant Tools
  participant Core
  Learner->>Client: Fixed synthetic scenario
  Client->>Transport: MCP request
  Transport->>Tools: Registered tool
  Tools->>Core: Validated operation
  Core-->>Client: Normalized result
```

![Sequence diagram tracing a todo tool call through the selected MCP transport, shared tools, and TodoService.](media/tool-call-sequence.svg)

The external inventories under `artifacts/plugin-inventory/` prove all bundle
files except `mcp.json` are byte-identical. Discovery exports prove the same
five names, descriptions, and schemas are visible. The baseline fixes auth off,
memory storage, one warm replica, seed, order, version, and machine; only the
boundary differs.

The context-placement cell uses the same `diagnostics` implementation and
schema but asks for synthetic decision evidence. The stdio adapter identifies
learner-approved local context; the HTTP adapter identifies operator-curated
team context. This difference is deliberate and must not be interpreted as a
baseline parity failure.

```mermaid
flowchart LR
  M[Client-side model] --> T[Same diagnostics tool]
  T --> LC[Local evidence<br/>learner governs]
  T --> RC[Remote evidence<br/>operator governs]
  LC --> LR[Local recommendation]
  RC --> RR[Remote recommendation]
```

The model still reasons in the client. The MCP boundary changes which governed
evidence can reach that reasoning and who must keep the evidence trustworthy.

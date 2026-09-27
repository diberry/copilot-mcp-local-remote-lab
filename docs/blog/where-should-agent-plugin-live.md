# Where should an Agent Plugin live? That is not quite the question

> This is a learning repository, not a production reference architecture.

When you build a GitHub Copilot Agent Plugin, it is tempting to ask: Should the
plugin run locally or in the cloud?

That question hides the most important architectural distinction.

The plugin belongs with the client. Its identity, custom agent, skills, hooks,
and MCP connection configuration shape the experience inside Copilot. What can
move is the **MCP server and the tool execution behind it**.

So the better question is:

> When should tool execution remain a client-launched local process, and when
> should it move behind a remote MCP boundary?

That is the question this lab was built to explore.

## Start local to learn faster

A local stdio server is a great starting point. The client launches the
process, MCP messages travel over standard input and output, and the tool can
work without a network hop.

That gives you a short feedback loop:

- Fewer moving parts while you shape the tool contract.
- Straightforward debugging on the developer machine.
- Low transport overhead.
- Offline-capable execution.
- Access to local resources, when the user explicitly grants it.

Local is not merely a prototype mode. For tools whose value is inherently
local—working with a checked-out repository, a local build, or a developer's
files—it might be the right final architecture.

But local execution also distributes the runtime. Every user needs compatible
dependencies, updates, and troubleshooting. Observability is fragmented.
Server-side integrations can be awkward or inappropriate. Local access also
raises its own trust questions.

## Move the server when the boundary earns its cost

A remote MCP server adds real costs: network latency, authentication, Origin
validation, deployment, monitoring, scaling, availability, and cloud spend.
Moving a tool to the cloud is not progress by itself.

The move becomes valuable when it unlocks something the local process cannot
provide well:

- Centralized updates and consistent runtime versions.
- Shared access to server-side systems.
- Managed identity and controlled secret handling.
- Central telemetry and operational support.
- Independent scaling and release management.
- A stable service boundary for many clients.

Those benefits must outweigh the new failure modes. A tool call can now fail
because of DNS, TLS, authorization, throttling, an unavailable revision, or a
cold instance—even when the tool implementation is correct.

The decision is therefore not “local is simple” versus “remote is modern.” It
is whether the remote boundary creates enough operational or product value to
justify what it introduces.

## MCP is the seam that makes progress possible

The path to progress is not moving everything. It is designing a seam that
lets you move the right thing without changing the experience.

In this lab, one TypeScript registration factory defines five todo tools. The
same schemas, descriptions, domain service, synthetic scenario, agent, skill,
and hook are used on both sides. The generated plugin bundles are identical
except for `mcp.json`.

One binding launches the server over stdio. The other connects through
Streamable HTTP.

That separation matters. If we changed the plugin, tools, and transport
together, any comparison would be ambiguous. By holding the capability
constant, we can ask useful questions:

- Does the client discover the same tools?
- Do both paths produce the same domain outcome?
- What latency does the boundary add in this environment?
- Which failures are local-process failures, and which are network failures?
- What security and operational controls does remote execution require?

MCP gives us a replaceable boundary. It lets a capability begin locally,
mature behind a shared service, or support both modes without duplicating its
business logic.

## Measure before you migrate

The lab deliberately avoids declaring a winner.

It first proves parity with real MCP clients over stdio and Streamable HTTP.
Then it runs alternating local-first and remote-first pairs against a fixed
scenario. Authentication, cold start, persistence, and replica changes stay in
separate experiment cells so they do not contaminate the baseline.

The default remote test uses loopback HTTP. That is useful protocol evidence,
but it is not cloud evidence. A live Azure Container Apps run must identify and
verify the actual endpoint, image, revision, region, storage mode, Origin, and
replica controls.

This discipline prevents a common mistake: collecting numbers before proving
that the two paths are doing the same work.

## A practical decision rule

Keep tool execution local while proximity, offline use, local resources, or
iteration speed are the main source of value.

Move it behind a remote MCP boundary when centralized operations, shared
integrations, managed identity, consistent deployment, or service-level
observability become more valuable than the additional latency and complexity.

Support both when users genuinely need both contexts—and prove that the
capability remains equivalent.

The path to progress is not “cloud first.” It is **contract first**:

1. Define one capability.
1. Separate it from its transport.
1. Prove parity across boundaries.
1. Measure the tradeoffs.
1. Move only when the new boundary earns its place.

The Agent Plugin does not need to choose a home. Its MCP contract gives the
tool implementation room to evolve.

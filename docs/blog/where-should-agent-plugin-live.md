# Where should an Agent Plugin live? I was asking the wrong question

> This is a learning repository, not a production reference architecture.

I started this experiment with a simple question:

> Should a GitHub Copilot Agent Plugin run locally or in the cloud?

It sounded like the right architectural decision. It wasn't.

The plugin stays with the client. Its identity, custom agent, skills, hooks,
and MCP configuration shape the experience inside Copilot. The part that can
move is the **MCP server and the tool execution behind it**.

That changes the question:

> When should tool execution remain a client-launched local process, and when
> has it earned a remote MCP boundary?

That is a much more useful question because it forces us to talk about value,
not location.

## Start local because learning speed matters

A local stdio server has very little ceremony. The client launches the
process, exchanges MCP messages over standard input and output, and receives
the result without a network hop.

That makes local execution a strong place to begin:

- You can shape the tool contract with fewer moving parts.
- You can debug the full call path on one machine.
- You avoid network latency and cloud cost.
- The tool can work offline.
- The tool can use explicitly granted local resources.

Local is not a lesser architecture. If the job is working with a checked-out
repository, a local build, or files on a developer's machine, local might be
exactly where the tool belongs.

But local execution distributes responsibility. Every user needs a compatible
runtime. Updates and support happen across many machines. Observability is
fragmented. Shared server-side integrations become harder.

That tension—not a preference for cloud—is what makes a remote option worth
testing.

## Move the server only when the boundary earns its cost

A remote MCP server can give you centralized updates, managed identity, shared
integrations, consistent runtime versions, and service-level observability.
Those are meaningful capabilities.

They are not free.

The network boundary adds authentication, Origin validation, DNS, TLS,
deployment, monitoring, scaling, availability, and cloud spend. A tool call
can now fail even when the tool itself is correct.

So “remote” is not automatically progress. It is progress when the new
boundary unlocks enough product or operational value to justify the latency
and complexity it introduces.

## The experiment needs one capability, not two implementations

To test the boundary honestly, I built one TypeScript tool implementation and
used it twice.

The plugin identity, agent, skill, hook, schemas, todo service, synthetic
scenario, and five-tool catalog stay fixed. Both adapters call the same tool
registration factory. The generated plugin bundles are byte-identical except
for `mcp.json`.

Only the connection changes:

- The local binding launches the MCP server over stdio.
- The remote binding connects through Streamable HTTP.

That constraint is the heart of the experiment. If I changed the plugin,
tools, and transport together, I could not explain the result.

With one controlled capability, I can ask:

- Does Copilot discover the same tools?
- Do both paths reach the same domain outcome?
- What latency appears in this environment?
- Which failures belong to the process, network, or authentication boundary?
- What does remote operation require that local execution does not?

MCP becomes the seam that lets the implementation evolve without rewriting the
experience.

## Prove parity before comparing performance

The lab does not begin with a stopwatch. It begins with evidence that both
paths do the same work.

Real MCP clients discover tools over stdio and Streamable HTTP. Contract tests
run the same todo scenario through both boundaries and compare the final state.
Only after those checks pass does the runner collect alternating local-first
and remote-first pairs.

Authentication, cold starts, persistence, and replica changes stay in separate
experiment cells. Mixing them into the baseline would produce a more dramatic
chart and a less useful conclusion.

The default remote test also uses loopback HTTP. That proves the protocol path,
not cloud performance. Live Azure Container Apps evidence must be tied to the
actual endpoint, image, revision, region, storage, Origin, and replica
controls.

The lesson is simple: before asking which path is faster, prove that both paths
are equivalent and name exactly what you measured.

## Use this decision rule

Keep tool execution local when its value comes from proximity, offline use,
local resources, privacy, or iteration speed.

Move it behind a remote MCP boundary when centralized operations, shared
systems, managed identity, consistent deployment, or observability create more
value than the added latency and operational burden.

Support both when people genuinely need both contexts—but keep one capability
contract and continuously prove parity.

That is why MCP is a path to progress. Not because everything should become a
service, but because a stable contract gives us options:

1. Start with the shortest learning loop.
1. Separate capability from transport.
1. Prove the two boundaries behave the same.
1. Measure the tradeoffs.
1. Move only when the new boundary earns its place.

The Agent Plugin does not need a new home. The MCP contract gives its tools
room to grow.

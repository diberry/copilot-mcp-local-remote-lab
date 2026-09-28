# Usage lab

> This is a learning repository, not a production reference architecture.

This lab first establishes tool transport parity, then compares the complete
client plugin with the same capability running behind a representative company
MCP gateway.

## 1. Predict the result

Before running either binding, write down what should remain identical:

- Five discovered tools.
- Plugin and server version `1.0.0`.
- Todo IDs and insertion order.
- `todo-2` completed in the final list.

The expected difference is the `diagnostics.transport` value: `stdio` locally
and `streamable-http` remotely.

## 2. Run the fixed scenario

Invoke the operations in this order:

1. `diagnostics`
1. `reset_todos`
1. `add_todo` with `synthetic-alpha`
1. `add_todo` with `synthetic-beta`
1. `add_todo` with `synthetic-gamma`
1. `list_todos`
1. `complete_todo` with `todo-2`
1. `list_todos`

The custom agent constrains this order, the skill explains experiment
controls, and the client hook records content-free timing metadata. Those
client extensions remain client-side. The MCP server returns wrappers with
`requestId`, `operation`, `outcome`, `serverVersion`, and `data` or normalized
`error`.

## 3. Check the evidence

For each binding, confirm:

- Discovery returns the five names in [tool reference](reference/tools.md).
- The final board has the same titles and stable IDs.
- Only `todo-2` is complete.
- The result wrapper shape is unchanged.
- The transport diagnostic identifies the boundary actually used.

If any domain result differs, stop. A latency comparison is not meaningful
until parity passes.

## 4. Explain the value

This scenario is intentionally small. Its value is not todo functionality; it
is a controlled probe that crosses every layer—client binding, MCP transport,
shared registration, validation, domain service, and normalized response.

## 5. Mark the transport checkpoint

Install one binding at a time in a fresh client session. Observe that the
custom agent, skill, and hooks remain installed in the client in both runs.
This checkpoint proves transport behavior, not complete-plugin placement.

The optional `diagnostics` context study remains useful for demonstrating
provenance and responsibility, but it is not evidence of server-hosted plugin
fidelity.

## 6. Run the placement prediction

For each capability, predict whether the server-hosted topology will preserve
it natively, map it through company MCP, require a thin client companion, or
lose it:

- agent instructions and decision rules;
- skill workflow;
- pre/post hook policy;
- tools and domain outcome;
- local and shared context;
- interactive approvals;
- normalized errors and recovery;
- evidence provenance and telemetry.

Then answer:

1. Which client-native behaviors are essential to the user experience?
1. Which company capabilities justify central hosting?
1. Which user responsibilities move to the company operator?
1. What new shared failure and trust boundaries appear?
1. Would you choose client, server behind company MCP, or hybrid, and what
   evidence would change your answer?

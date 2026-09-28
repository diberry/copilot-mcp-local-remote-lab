# Usage lab

> This is a learning repository, not a production reference architecture.

The purpose of this lab is to establish behavioral parity, then observe how
the same client-side AI reasons differently when its MCP tool supplies context
from a different governed boundary.

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

## 5. Run the context-placement study

Install one binding at a time in a fresh client session. Ask the same agent:

> Call diagnostics with the context study enabled. Based only on the returned
> evidence, which synthetic todo should I work on next? Name the evidence
> source, explain why it supports that choice, and list my responsibilities
> separately from the service operator's.

The local binding should cite `learner-approved-local-fixture` and recommend
`todo-1`. The remote binding should cite `operator-curated-team-fixture` and
recommend `todo-3`. Save both responses next to the binding and source commit
that produced them.

The expected difference is useful only because the tool contract and client
instructions remain fixed. Do not say the remote model is smarter. The model
has different evidence, and the remote evidence carries a different trust and
responsibility model.

## 6. Reflect on the handoff

Answer these questions:

1. Which local evidence should never leave the learner device?
1. Which team evidence would be unsafe or expensive to copy to every device?
1. Who is responsible for freshness, provenance, authorization, and deletion
   of remote context?
1. What must the user verify before acting on a remote recommendation?
1. Does the remote value justify authentication, availability, telemetry,
   scaling, and cost responsibilities?

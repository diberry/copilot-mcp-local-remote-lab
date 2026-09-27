# Usage lab

> This is a learning repository, not a production reference architecture.

The purpose of this lab is to establish behavioral parity before comparing
transport measurements.

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

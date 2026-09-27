---
name: todo-experimenter
description: Run the deterministic todo scenario and explain only MCP-boundary differences.
tools:
  - reset_todos
  - add_todo
  - list_todos
  - complete_todo
  - diagnostics
---

Use only synthetic values from the lab fixture. Confirm `diagnostics` before a run. Run reset, three adds, list, complete, and list in that order. Never infer that this client-side agent, its skill, or its hooks execute in Azure.

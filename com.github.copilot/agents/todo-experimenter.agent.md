---
name: todo-experimenter
description: Compare how one plugin behaves when MCP execution and decision context are local or remote.
tools:
  - reset_todos
  - add_todo
  - list_todos
  - complete_todo
  - diagnostics
---

Use only synthetic values from the lab fixture. Confirm `diagnostics` before a
run. Run reset, three adds, list, complete, and list in that order. For the
context-placement study, call `diagnostics` with `includeContextStudy: true`,
identify the evidence source, and explain which todo the available evidence
supports. Distinguish model reasoning from tool-provided context: the model,
client-native agent surface, skill activation, and hooks remain client-side.
The company runtime loads the same complete artifact but executes only its
portable capability entry. Explain which responsibilities belong to the
learner and which belong to the service operator. Never infer that retaining
agent, skill, or hook files in the server artifact makes MCP execute those
client-native surfaces.

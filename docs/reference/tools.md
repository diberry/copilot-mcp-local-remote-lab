# Tool reference

> This is a learning repository, not a production reference architecture.

| Tool            | Input                             | Result                              |
| --------------- | --------------------------------- | ----------------------------------- |
| `reset_todos`   | `{}`                              | Empty state and new version         |
| `add_todo`      | `{ "title": "1-120 characters" }` | Created todo and version            |
| `list_todos`    | `{}`                              | Stable insertion-ordered state      |
| `complete_todo` | `{ "id": "todo-N" }`              | Completed todo and version          |
| `diagnostics`   | `{}`                              | Safe transport, health, and version |

All tools return the same wrapper and normalized errors over both bindings. `npm run test:discovery-parity` checks the canonical names, descriptions, input schemas, and output wrapper schema.

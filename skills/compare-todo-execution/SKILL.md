---
name: compare-todo-execution
description: Compare identical todo tools over local stdio and remote Streamable HTTP without introducing confounds.
---

1. Verify the plugin payload and discovery parity gates.
2. Install only one generated binding in a fresh client session.
3. Run the fixed synthetic scenario at least 20 times.
4. Alternate local-first and remote-first pair order.
5. Keep authentication, persistence, replicas, failures, and cold starts out of the baseline.
6. Report counts, failures, median, p95, and paired deltas.

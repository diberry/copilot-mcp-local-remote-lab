# Comparison lab

> This is a learning repository, not a production reference architecture.

Run `npm run experiment:run`. It discards one setup run, alternates local→remote then remote→local, and performs at least 20 measured pairs. It reports count, failures, median, nearest-rank p95, and paired deltas.

The baseline must use memory storage, no auth, one warm instance, and no injected failure. Cold starts, bearer auth, persistence/multiple replicas, and failures are separate cells. Never merge those samples into baseline percentiles or claim statistical significance. Run `npm run experiment:verify-manifest` first and preserve only sanitized evidence.

# Video generation and evidence

This learning repository uses generated videos only as instructional evidence.

The lab includes four paced, verified WebM previews. Each video runs for at
least 20 seconds and presents six steps: context, action, evidence, and a clear
takeaway.

1. [Two plugin placements](./01-execution-boundary.webm) — compares a complete
   client plugin, connection-only remote profile, and thin companion while the
   exact same executable artifact runs in the private company runtime.
1. [Capability fidelity](./02-equivalent-tool-flow.webm) — shows which
   agent, skill, hook, disclosure, and approval behavior the companion retains
   and why MCP does not execute those client-native surfaces.
1. [Company value and cost](./03-latency-cold-warm.webm) — balances shared
   context, central updates, identity, and policy against network, service, and
   operating costs.
1. [Client, server, or hybrid](./04-failure-and-recovery.webm) — uses fidelity
   and responsibility evidence to make the placement decision.

Run `npm run video:prepare`, `npm run video:capture`, and
`npm run video:verify` in that order. The preparation command creates a local,
sanitized HTML storyboard. Playwright records it at a fixed viewport, locale,
color scheme, and reduced-motion setting. Generated files stay under
`artifacts/`. The four checked-in files in this folder are verified review
previews regenerated from the same sanitized fixtures.

The storyboard is backed by the deterministic, synthetic inputs in
`test/video/fixtures/local-run.json` and
`test/video/fixtures/remote-run.json`. It does not record a native Copilot
client, terminal, Azure portal, browser profile, or desktop.

Each video has a generated plain-text transcript and description. The
verification command requires all four videos, their descriptions, and their
transcripts before it builds the accessible index.

Before sharing an artifact, run `npm run video:verify`. The generation and
verification scripts reject sensitive evidence fields, including prompts,
todo content, tokens, authorization headers, environment data, identities, IP
addresses, and local paths. Review the rendered output once more for private
data before publishing it.

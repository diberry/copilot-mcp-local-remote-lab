# Video generation and evidence

This learning repository uses generated videos only as instructional evidence.

The lab produces four short WebM videos:

1. `01-execution-boundary.webm`
1. `02-equivalent-tool-flow.webm`
1. `03-latency-cold-warm.webm`
1. `04-failure-and-recovery.webm`

Run `npm run video:prepare`, `npm run video:capture`, and
`npm run video:verify` in that order. The preparation command creates a local,
sanitized HTML storyboard. Playwright records it at a fixed viewport, locale,
color scheme, and reduced-motion setting. Generated files stay under
`artifacts/` and are not source assets.

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

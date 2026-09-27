import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  describeVideoBoundary,
  validateVideoFixture,
  validateVideoFixturePair,
} from "./video-fixture-schema.mjs";
const forbiddenKeys =
  /prompt|todo(?:text|content|title)|token|authorization|headers?|environment|user(?:id|identity)|ip(?:address)?|localpath/i;
const fixtures = {};
for (const file of ["local-run.json", "remote-run.json"]) {
  const input = JSON.parse(
    await readFile(`test/video/fixtures/${file}`, "utf8"),
  );
  validateVideoFixture(input, file);
  fixtures[file] = input;
  const visit = (value, path = "") => {
    if (Array.isArray(value))
      return value.forEach((item, index) => visit(item, `${path}[${index}]`));
    if (value && typeof value === "object")
      for (const [key, item] of Object.entries(value)) {
        if (forbiddenKeys.test(key))
          throw new Error(`Forbidden video evidence field: ${path}.${key}`);
        visit(item, `${path}.${key}`);
      }
  };
  visit(input);
}
const remoteEvidence = fixtures["remote-run.json"];
const localEvidence = fixtures["local-run.json"];
const discoveryEvidence = JSON.parse(
  await readFile("artifacts/discovery/summary.json", "utf8"),
);
const pluginEvidence = validateVideoFixturePair(
  localEvidence,
  remoteEvidence,
  discoveryEvidence,
);
if (
  localEvidence.evidenceTier !== remoteEvidence.evidenceTier ||
  localEvidence.remoteEndpoint !== remoteEvidence.remoteEndpoint ||
  (remoteEvidence.evidenceTier === "live-aca" &&
    ["remoteImageDigest", "acaRevision", "azureRegion", "endpointUrl"].some(
      (key) => localEvidence[key] !== remoteEvidence[key],
    ))
)
  throw new Error("Video fixtures must describe the same evidence boundary.");
const boundaryLabel = describeVideoBoundary(remoteEvidence);
const scenes = [
  [
    "01-execution-boundary",
    "Execution boundary",
    `The client-side package remains fixed while the MCP path changes from a local child process to ${boundaryLabel}.`,
  ],
  [
    "02-equivalent-tool-flow",
    "Equivalent tool flow",
    `${pluginEvidence.toolCount} identical tool contracts verified by discovery SHA-256 ${pluginEvidence.discoverySha256} cross either transport.`,
  ],
  [
    "03-latency-cold-warm",
    "Latency: baseline, cold, and warm",
    "Alternating paired baseline results stay separate from local startup and remote cold-start evidence.",
  ],
  [
    "04-failure-and-recovery",
    "Failure and recovery",
    "Sanitized local process and remote network/auth failures map to stable categories and recovery guidance.",
  ],
];
await mkdir("artifacts/video-report", { recursive: true });
await mkdir("artifacts/videos/transcripts", { recursive: true });
const options = scenes
  .map(([id, title]) => `<button data-scene="${id}">${title}</button>`)
  .join("");
const data = JSON.stringify(
  Object.fromEntries(
    scenes.map(([id, title, description]) => [id, { title, description }]),
  ),
);
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>MCP boundary lab storyboard</title><style>body{font:22px system-ui;margin:0;background:#07152d;color:#fff}nav{display:flex;gap:8px;padding:18px;background:#10264a}button{font:inherit;padding:10px}main{padding:60px}h1{font-size:48px}.paths{display:flex;gap:40px;margin-top:50px}.card{border:3px solid #66b3ff;border-radius:14px;padding:30px;flex:1}.active{background:#154a7d}.evidence{font-family:monospace;color:#8ff0a4}</style></head><body><nav>${options}</nav><main><h1 id="title"></h1><p id="description"></p><div class="paths"><section class="card" id="client">Client package<br><span class="evidence">plugin ${pluginEvidence.pluginVersion} · ${pluginEvidence.toolCount} tools · discovery ${pluginEvidence.discoverySha256}</span></section><section class="card" id="boundary">MCP boundary<br><span class="evidence">${boundaryLabel}</span></section></div><p id="step" aria-live="polite"></p></main><script>const scenes=${data};function show(id){const s=scenes[id];title.textContent=s.title;description.textContent=s.description;step.textContent="Sanitized ${remoteEvidence.evidenceTier} fixture evidence · ${boundaryLabel} · no native client or credentials recorded";document.querySelectorAll(".card").forEach(x=>x.classList.toggle("active"));}document.querySelectorAll("button").forEach(b=>b.onclick=()=>show(b.dataset.scene));show(location.hash.slice(1)||Object.keys(scenes)[0]);</script></body></html>`;
await writeFile("artifacts/video-report/index.html", html);
for (const [id, title, description] of scenes)
  await writeFile(
    `artifacts/videos/transcripts/${id}.txt`,
    `${title}\n\n${description}\n\nThe storyboard shows sanitized ${remoteEvidence.evidenceTier} fixture evidence over ${boundaryLabel}. Plugin ${pluginEvidence.pluginVersion} exposes ${pluginEvidence.toolCount} tools with discovery SHA-256 ${pluginEvidence.discoverySha256}. Only the MCP boundary changes.\n`,
  );
await writeFile(
  "artifacts/videos/descriptions.json",
  `${JSON.stringify(Object.fromEntries(scenes.map(([id, title, description]) => [id, { title, description, transcript: `transcripts/${id}.txt` }])), null, 2)}\n`,
);
console.log("Prepared four sanitized storyboard scenes and transcripts.");

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
const median = (values) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};
const localMedian = median(localEvidence.durationsMs);
const remoteMedian = median(remoteEvidence.durationsMs);
const stepDurationMs = 3500;
const scenes = [
  {
    id: "01-execution-boundary",
    title: "One plugin, two context and responsibility boundaries",
    description: `See what stays in the client, what evidence changes across ${boundaryLabel}, and who becomes responsible for it.`,
    steps: [
      [
        "Keep the intelligence layer fixed",
        "Start with one client-side model and plugin",
        `Plugin ${pluginEvidence.pluginVersion} and the same ${pluginEvidence.toolCount} tools are used in both paths.`,
        "CLIENT-SIDE",
        "Model, plugin, agent, skill",
        "SERVER-SIDE",
        "Tool execution and context",
      ],
      [
        "Local evidence",
        "Use learner-approved context on the device",
        "The local tool can use synthetic focus evidence without sending it across a network boundary.",
        "SOURCE",
        "Learner-approved fixture",
        "RECOMMENDS",
        "todo-1",
      ],
      [
        "Local responsibility",
        "The learner operates the execution path",
        "Runtime updates, local access, device availability, and evidence inspection remain user responsibilities.",
        "USER OWNS",
        "Runtime + local access",
        "OPERATOR OWNS",
        "Compatible package updates",
      ],
      [
        "Remote evidence",
        "Use operator-governed team context",
        `The same tool contract reaches synthetic shared policy through ${boundaryLabel}.`,
        "SOURCE",
        "Operator-curated fixture",
        "RECOMMENDS",
        "todo-3",
      ],
      [
        "Remote responsibility",
        "Split trust between user and service operator",
        "The user authenticates and verifies provenance; the operator governs context, security, uptime, telemetry, and cost.",
        "USER OWNS",
        "Disclosure + trust decision",
        "OPERATOR OWNS",
        "Context + service",
      ],
      [
        "Takeaway",
        "The model did not become smarter",
        "Its recommendation changed because governed evidence and responsibility changed across the MCP boundary.",
        "FIXED",
        "Model + plugin + tools",
        "CHANGED",
        "Evidence + ownership",
      ],
    ],
  },
  {
    id: "02-equivalent-tool-flow",
    title: "Proving equivalent tool discovery",
    description: `${pluginEvidence.toolCount} tool contracts are discovered independently through both transports and compared canonically.`,
    steps: [
      [
        "Question",
        "Do both boundaries expose the same tools?",
        "The check uses real MCP clients rather than comparing a fixture with itself.",
        "LOCAL CLIENT",
        "StdioClientTransport",
        "HTTP CLIENT",
        "StreamableHTTPClientTransport",
      ],
      [
        "Local discovery",
        "Call tools/list over stdio",
        `The local adapter reports ${pluginEvidence.toolCount} tools from the shared registration factory.`,
        "TRANSPORT",
        "stdio",
        "DISCOVERED",
        `${pluginEvidence.toolCount} tools`,
      ],
      [
        "Remote discovery",
        "Call tools/list over Streamable HTTP",
        `The HTTP adapter independently reports ${pluginEvidence.toolCount} tools.`,
        "TRANSPORT",
        "Streamable HTTP",
        "DISCOVERED",
        `${pluginEvidence.toolCount} tools`,
      ],
      [
        "Canonical comparison",
        "Normalize names, descriptions, and schemas",
        "Ordering noise is removed before the two discovery payloads are hashed.",
        "LOCAL HASH",
        pluginEvidence.discoverySha256.slice(0, 16),
        "REMOTE HASH",
        pluginEvidence.discoverySha256.slice(0, 16),
      ],
      [
        "Behavior check",
        "Run the same todo workflow",
        "Reset, add, list, complete, and list use the same core implementation on each side.",
        "LOCAL FLOW",
        "5 operations",
        "REMOTE FLOW",
        "Same 5 operations",
      ],
      [
        "Takeaway",
        "Parity is evidence, not an assumption",
        `Both boundaries match canonical discovery SHA-256 ${pluginEvidence.discoverySha256}.`,
        "PLUGIN",
        pluginEvidence.pluginVersion,
        "RESULT",
        "Discovery parity passed",
      ],
    ],
  },
  {
    id: "03-latency-cold-warm",
    title: "Reading the paired latency baseline",
    description:
      "See how alternating paired measurements compare transport overhead without mixing cold-start data into the baseline.",
    steps: [
      [
        "Experiment design",
        "Use 20 paired observations",
        "Each pair runs the same todo scenario once locally and once through remote-test HTTP.",
        "LOCAL SAMPLES",
        `${localEvidence.durationsMs.length}`,
        "REMOTE SAMPLES",
        `${remoteEvidence.durationsMs.length}`,
      ],
      [
        "Pair 1",
        "Measure local, then remote",
        "The first pair begins with stdio and immediately follows with Streamable HTTP.",
        "STDIO",
        `${localEvidence.durationsMs[0]} ms`,
        "HTTP",
        `${remoteEvidence.durationsMs[0]} ms`,
      ],
      [
        "Pair 2",
        "Reverse the order",
        "Alternation reduces systematic bias from always running one boundary first.",
        "HTTP",
        `${remoteEvidence.durationsMs[1]} ms`,
        "STDIO",
        `${localEvidence.durationsMs[1]} ms`,
      ],
      [
        "Baseline result",
        "Compare the medians",
        "These sanitized fixture values illustrate the report; they are not a production benchmark.",
        "STDIO MEDIAN",
        `${localMedian} ms`,
        "HTTP MEDIAN",
        `${remoteMedian} ms`,
      ],
      [
        "Keep cells separate",
        "Do not mix cold starts into warm baseline",
        "Authentication, cold start, persistence, replicas, and failures require distinct experiment cells.",
        "BASELINE",
        "Warm · memory · 1 replica",
        "FOLLOW-ONS",
        "Measured separately",
      ],
      [
        "Takeaway",
        "Interpret the delta narrowly",
        "The paired report describes this controlled boundary comparison, not universal transport performance.",
        "OBSERVED DELTA",
        `${remoteMedian - localMedian} ms median`,
        "CLAIM",
        "Lab evidence only",
      ],
    ],
  },
  {
    id: "04-failure-and-recovery",
    title: "Boundary failure and recovery",
    description:
      "Watch local process and remote network failures remain distinguishable while the shared todo behavior stays intact.",
    steps: [
      [
        "Healthy state",
        "Begin with both paths available",
        "The same tool catalog and todo behavior are ready behind each boundary.",
        "LOCAL",
        "stdio ready",
        "REMOTE-TEST",
        "HTTP ready",
      ],
      [
        "Local failure",
        "Child process cannot start",
        "The local adapter reports a process-start boundary category instead of a todo-domain error.",
        "BOUNDARY",
        localEvidence.recoveryScenario.boundaryFailureCategory,
        "TOOL DATA",
        "Unchanged",
      ],
      [
        "Local recovery",
        "Restart the child and rediscover tools",
        "A successful tools/list proves that the local boundary has recovered.",
        "ACTION",
        "Restart + initialize",
        "RESULT",
        localEvidence.recoveryScenario.recoveryOutcome,
      ],
      [
        "Remote failure",
        "HTTP endpoint becomes unreachable",
        "The remote adapter reports a network boundary category without exposing request content.",
        "BOUNDARY",
        remoteEvidence.recoveryScenario.boundaryFailureCategory,
        "PRIVACY",
        "No prompts or tokens",
      ],
      [
        "Remote recovery",
        "Restore the endpoint and reconnect",
        "The client creates a new MCP session and repeats discovery before tool execution.",
        "ACTION",
        "Reconnect + initialize",
        "RESULT",
        remoteEvidence.recoveryScenario.recoveryOutcome,
      ],
      [
        "Takeaway",
        "Recover the boundary, not the domain",
        "Stable categories tell the learner whether to restart a process, restore connectivity, or fix tool input.",
        "LOCAL GUIDANCE",
        "Restart process",
        "REMOTE GUIDANCE",
        "Restore network",
      ],
    ],
  },
];
await mkdir("artifacts/video-report", { recursive: true });
await mkdir("artifacts/videos/transcripts", { recursive: true });
const options = scenes
  .map(({ id, title }) => `<button data-scene="${id}">${title}</button>`)
  .join("");
const data = JSON.stringify(
  Object.fromEntries(scenes.map((scene) => [scene.id, scene])),
);
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>MCP boundary lab storyboard</title><style>*{box-sizing:border-box}body{font:20px system-ui;margin:0;background:#061326;color:#fff;overflow:hidden}nav{display:flex;gap:8px;padding:12px 18px;background:#10264a}button{font:600 14px system-ui;padding:8px 12px;color:#d9eaff;background:#183862;border:1px solid #4c7fb8;border-radius:6px}.shell{height:calc(100vh - 54px);display:grid;grid-template-rows:auto 8px 1fr auto}.heading{padding:28px 48px 18px}.eyebrow{color:#8cc8ff;font-size:17px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}h1{font-size:42px;margin:8px 0 10px}#description{margin:0;color:#c8d8eb}.progress{background:#122a4b}.progress>div{height:100%;width:0;background:#43d6b5;transition:width .5s ease}.stage{display:grid;grid-template-columns:1fr 1fr;gap:28px;padding:32px 48px}.card{border:2px solid #4f83bd;border-radius:16px;padding:28px;background:#0d2340;box-shadow:0 12px 30px #0005}.label{font-size:15px;color:#7fc2ff;font-weight:700;letter-spacing:.08em}.value{font:700 28px ui-monospace,monospace;margin-top:14px;color:#fff;overflow-wrap:anywhere}.callout{margin:0 48px 32px;padding:22px 26px;border-left:6px solid #43d6b5;background:#0b2d35}.callout strong{display:block;font-size:25px;margin-bottom:8px}.callout span{color:#d7edf0}.footer{display:flex;justify-content:space-between;padding:0 48px 18px;color:#a8bed8;font-size:15px}.step-flash{animation:flash .55s ease}@keyframes flash{from{opacity:.35;transform:translateY(8px)}to{opacity:1;transform:none}}@media(prefers-reduced-motion:reduce){.progress>div{transition:none}.step-flash{animation:none}}</style></head><body><nav>${options}</nav><main class="shell"><header class="heading"><div class="eyebrow" id="eyebrow"></div><h1 id="title"></h1><p id="description"></p></header><div class="progress" aria-label="Video progress"><div id="progress"></div></div><div class="stage"><section class="card" id="left"><div class="label" id="left-label"></div><div class="value" id="left-value"></div></section><section class="card" id="right"><div class="label" id="right-label"></div><div class="value" id="right-value"></div></section></div><section class="callout" id="callout" aria-live="polite"><strong id="headline"></strong><span id="detail"></span></section><footer class="footer"><span id="step-count"></span><span>Sanitized ${remoteEvidence.evidenceTier} evidence · ${boundaryLabel}</span></footer></main><script>const scenes=${data};const stepDuration=${stepDurationMs};let timer;function renderStep(scene,index){const [eyebrowText,headlineText,detailText,leftTitle,leftBody,rightTitle,rightBody]=scene.steps[index];eyebrow.textContent=eyebrowText;title.textContent=scene.title;description.textContent=scene.description;headline.textContent=headlineText;detail.textContent=detailText;document.querySelector("#left-label").textContent=leftTitle;document.querySelector("#left-value").textContent=leftBody;document.querySelector("#right-label").textContent=rightTitle;document.querySelector("#right-value").textContent=rightBody;document.querySelector("#step-count").textContent="Step "+(index+1)+" of "+scene.steps.length;progress.style.width=((index+1)/scene.steps.length*100)+"%";callout.classList.remove("step-flash");void callout.offsetWidth;callout.classList.add("step-flash");timeline.dataset.status=index===scene.steps.length-1?"complete":"playing";}function show(id){clearInterval(timer);const scene=scenes[id];timeline.dataset.scene=id;timeline.dataset.status="playing";let index=0;renderStep(scene,index);timer=setInterval(()=>{index+=1;if(index>=scene.steps.length){clearInterval(timer);return;}renderStep(scene,index);},stepDuration);}document.querySelectorAll("button").forEach(button=>button.onclick=()=>show(button.dataset.scene));const timeline=document.querySelector("main");show(location.hash.slice(1)||Object.keys(scenes)[0]);</script></body></html>`;
await writeFile("artifacts/video-report/index.html", html);
for (const { id, title, description, steps } of scenes)
  await writeFile(
    `artifacts/videos/transcripts/${id}.txt`,
    `${title}\n\n${description}\n\n${steps.map((step, index) => `Step ${index + 1}: ${step[1]}\n${step[2]}\n${step[3]}: ${step[4]}. ${step[5]}: ${step[6]}.`).join("\n\n")}\n\nEvidence note: This storyboard uses sanitized ${remoteEvidence.evidenceTier} fixture evidence over ${boundaryLabel}. Plugin ${pluginEvidence.pluginVersion} exposes ${pluginEvidence.toolCount} tools with discovery SHA-256 ${pluginEvidence.discoverySha256}.\n`,
  );
await writeFile(
  "artifacts/videos/descriptions.json",
  `${JSON.stringify(Object.fromEntries(scenes.map(({ id, title, description, steps }) => [id, { title, description, transcript: `transcripts/${id}.txt`, expectedDurationSeconds: (steps.length * stepDurationMs) / 1000 }])), null, 2)}\n`,
);
console.log("Prepared four sanitized storyboard scenes and transcripts.");

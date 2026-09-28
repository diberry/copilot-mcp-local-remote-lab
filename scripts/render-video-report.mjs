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
const artifactEvidence = JSON.parse(
  await readFile("artifacts/plugin-inventory/summary.json", "utf8"),
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
    title: "One lab, two plugin placements",
    description:
      "Compare a complete client-installed plugin with the same capability running behind a company MCP gateway.",
    steps: [
      [
        "Architecture question",
        "Where should the complete capability live?",
        "The lab keeps one intended capability and compares two placement topologies.",
        "OPTION A",
        "Complete client plugin",
        "OPTION B",
        "Plugin behind company MCP",
      ],
      [
        "Client topology",
        "Install the complete Agent Plugin",
        "Agent behavior, skill workflow, hooks, tools, and approved local context execute on the learner device.",
        "CLIENT",
        "Complete plugin package",
        "CONTEXT",
        "Learner-approved local",
      ],
      [
        "Client ownership",
        "The learner operates the capability",
        "Installation, updates, runtime compatibility, local access, availability, and evidence remain user responsibilities.",
        "USER OWNS",
        "Package + runtime",
        "FAILURE RADIUS",
        "One device",
      ],
      [
        "Company topology",
        "Load the same artifact behind MCP",
        "The remote client has connection metadata only. The private runtime loads the exact artifact bytes used by the local client.",
        "ARTIFACT SHA-256",
        artifactEvidence.serverArtifactSha256.slice(0, 16),
        "PUBLIC PATH",
        "Gateway → private runtime",
      ],
      [
        "Company ownership",
        "Transfer service operations",
        "The operator owns deployment, shared context, policy, uptime, telemetry, scaling, recovery, and cost.",
        "USER OWNS",
        "Authentication + trust",
        "OPERATOR OWNS",
        "Gateway + runtime",
      ],
      [
        "Takeaway",
        "Placement changes more than transport",
        "The decision includes capability fidelity, context, trust, responsibility, failure radius, and cost.",
        "ONE LAB",
        "One capability",
        "DECISION",
        "Client · server · hybrid",
      ],
    ],
  },
  {
    id: "02-equivalent-tool-flow",
    title: "Measure capability fidelity",
    description:
      "Inventory every plugin behavior and record how faithfully each placement preserves it.",
    steps: [
      [
        "Inventory",
        "Start with the complete capability",
        `Record agent behavior, skill steps, hook policy, ${pluginEvidence.toolCount} tools, context, approvals, errors, and telemetry.`,
        "CANONICAL SOURCE",
        "Capability inventory",
        "EXPECTED RESULT",
        "No silent omissions",
      ],
      [
        "Native",
        "Preserve behavior without adaptation",
        "Client-native behavior receives a native status when the selected topology executes it directly.",
        "STATUS",
        "native",
        "EVIDENCE",
        "Behavior test passes",
      ],
      [
        "Mapped",
        "Represent behavior through company MCP",
        "A mapped status requires a tested gateway or runtime contract with equivalent intent and outcome.",
        "STATUS",
        "mapped",
        "EVIDENCE",
        "Mapping test passes",
      ],
      [
        "Companion required",
        "Keep only proven client behavior",
        "A thin companion is justified only when a fidelity test proves that valuable behavior cannot cross the boundary.",
        "STATUS",
        "companion-required",
        "RULE",
        "Evidence before code",
      ],
      [
        "Unsupported",
        "Name an accepted loss",
        "Unsupported behavior is visible in the report instead of disappearing behind a matching final todo state.",
        "STATUS",
        "unsupported",
        "RESULT",
        "Explicit tradeoff",
      ],
      [
        "Takeaway",
        "Task parity is not enough",
        "The placement passes only when every capability has a status and evidence.",
        "DISCOVERY HASH",
        pluginEvidence.discoverySha256.slice(0, 16),
        "FIDELITY",
        "Complete inventory",
      ],
    ],
  },
  {
    id: "03-latency-cold-warm",
    title: "Compare company value and cost",
    description:
      "Balance centralized company capabilities against network, operations, and shared-service costs.",
    steps: [
      [
        "Shared context",
        "Reach governed company systems",
        "The server placement can use centrally authorized policy, knowledge, and integrations without copying them to every device.",
        "GAIN",
        "Shared governed context",
        "RESPONSIBILITY",
        "Freshness + provenance",
      ],
      [
        "Central updates",
        "Deploy one runtime revision",
        "The operator can update and roll back the shared capability without coordinating every client package.",
        "GAIN",
        "Consistent runtime",
        "RESPONSIBILITY",
        "Safe rollout + rollback",
      ],
      [
        "Identity and policy",
        "Enforce the company boundary",
        "The gateway centralizes authentication, authorization, tenant policy, rate limits, and audit evidence.",
        "GAIN",
        "Company controls",
        "RESPONSIBILITY",
        "Secure enforcement",
      ],
      [
        "Transport cost",
        "Measure the network path",
        "The paired fixture illustrates one cost of placement; it is evidence for this run, not a universal benchmark.",
        "LOCAL MEDIAN",
        `${localMedian} ms`,
        "REMOTE MEDIAN",
        `${remoteMedian} ms`,
      ],
      [
        "Shared failure domain",
        "Accept a larger blast radius",
        "Network, gateway, runtime, identity, and company-context failures can affect many users at once.",
        "COST",
        "Service dependency",
        "OPERATOR OWNS",
        "Uptime + recovery",
      ],
      [
        "Takeaway",
        "Centralization is an exchange",
        "Shared capability and governance are valuable only when they justify fidelity gaps, network dependence, operations, and cost.",
        "GAIN",
        "Consistency + governance",
        "COST",
        "Dependency + ownership",
      ],
    ],
  },
  {
    id: "04-failure-and-recovery",
    title: "Choose client, server, or hybrid",
    description:
      "Use capability and responsibility evidence to make the final placement decision.",
    steps: [
      [
        "Client-hosted",
        "Keep the complete plugin on the device",
        "Choose client when exact client behavior, private local context, offline use, low latency, or per-user isolation is essential.",
        "BEST FOR",
        "Local + offline needs",
        "USER OWNS",
        "Runtime + updates",
      ],
      [
        "Server-hosted",
        "Place the runtime behind company MCP",
        "Choose server when shared systems, governed context, central policy, updates, and observability justify the service boundary.",
        "BEST FOR",
        "Shared company value",
        "OPERATOR OWNS",
        "Gateway + runtime",
      ],
      [
        "Hybrid",
        "Retain a thin client companion",
        "Choose hybrid only for client-native behavior or local context that a failed fidelity test proves cannot cross MCP.",
        "CLIENT",
        "Minimum companion",
        "SERVER",
        "Shared capability",
      ],
      [
        "Evidence",
        "Compare the same synthetic task",
        "Use outcome, instructions, workflow, policy, approvals, context, errors, provenance, failure, updates, latency, and cost.",
        "DO NOT STOP AT",
        "Matching todo state",
        "REQUIRE",
        "Full fidelity report",
      ],
      [
        "Responsibility",
        "Name who owns every concern",
        "The decision is incomplete until user and operator duties are explicit for data, trust, identity, uptime, telemetry, recovery, and cost.",
        "USER",
        "Disclosure + trust",
        "OPERATOR",
        "Service + governance",
      ],
      [
        "Takeaway",
        "Defend the placement",
        "The lab does not prescribe one answer; it produces evidence for client, server, or hybrid.",
        "QUESTION",
        "Where should it live?",
        "ANSWER",
        "The evidence decides",
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
    `${title}\n\n${description}\n\n${steps.map((step, index) => `Step ${index + 1}: ${step[1]}\n${step[2]}\n${step[3]}: ${step[4]}. ${step[5]}: ${step[6]}.`).join("\n\n")}\n\nEvidence note: This storyboard uses sanitized ${remoteEvidence.evidenceTier} fixture evidence over ${boundaryLabel}. Plugin ${pluginEvidence.pluginVersion} exposes ${pluginEvidence.toolCount} tools with discovery SHA-256 ${pluginEvidence.discoverySha256}. The client and company runtime load executable artifact SHA-256 ${artifactEvidence.serverArtifactSha256}; the remote client carries only its attestation.\n`,
  );
await writeFile(
  "artifacts/videos/descriptions.json",
  `${JSON.stringify(Object.fromEntries(scenes.map(({ id, title, description, steps }) => [id, { title, description, transcript: `transcripts/${id}.txt`, expectedDurationSeconds: (steps.length * stepDurationMs) / 1000 }])), null, 2)}\n`,
);
console.log("Prepared four sanitized storyboard scenes and transcripts.");

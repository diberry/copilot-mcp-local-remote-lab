import { readFile, stat, writeFile } from "node:fs/promises";
const ids = [
  "01-execution-boundary",
  "02-equivalent-tool-flow",
  "03-latency-cold-warm",
  "04-failure-and-recovery",
];
const descriptions = JSON.parse(
  await readFile("artifacts/videos/descriptions.json", "utf8"),
);
const forbidden =
  /access[_-]?token|authorization:\s*bearer|-----BEGIN .*PRIVATE KEY-----|todo(?:Text|Title|Content)|localPath/i;
const rows = [];
for (const id of ids) {
  const video = await stat(`artifacts/videos/${id}.webm`);
  if (video.size < 1000) throw new Error(`${id}: video is unexpectedly small`);
  const transcript = await readFile(
    `artifacts/videos/transcripts/${id}.txt`,
    "utf8",
  );
  if (
    !descriptions[id]?.description ||
    descriptions[id]?.expectedDurationSeconds < 20 ||
    transcript.length < 500
  )
    throw new Error(`${id}: description/transcript missing`);
  if (forbidden.test(JSON.stringify(descriptions[id]) + transcript))
    throw new Error(`${id}: forbidden evidence`);
  rows.push(
    `<article><h2>${descriptions[id].title}</h2><p>${descriptions[id].description}</p><video controls preload="metadata" src="${id}.webm"></video><p><a href="${descriptions[id].transcript}">Read transcript</a></p></article>`,
  );
}
await writeFile(
  "artifacts/videos/index.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>MCP lab videos</title></head><body><h1>MCP local/remote visual lab</h1>${rows.join("")}</body></html>`,
);
console.log(
  "Verified four WebM captures, descriptions, transcripts, and privacy fields.",
);

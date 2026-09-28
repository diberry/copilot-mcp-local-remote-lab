import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { filesUnder, inventory, root, sha256 } from "./lib.mjs";

const locations = [
  "artifacts/plugin/canonical",
  "artifacts/plugin/runtime",
  "plugins/local",
];
const hashes = [];
for (const location of locations) {
  const directory = resolve(root, location);
  const manifest = JSON.parse(
    await readFile(resolve(directory, "artifact.json"), "utf8"),
  );
  const bytes = await readFile(resolve(directory, manifest.entry));
  if (sha256(bytes) !== manifest.entrySha256)
    throw new Error(
      `${location}: plugin artifact hash does not match manifest`,
    );
  const payload = (await inventory(directory)).filter(
    ({ path }) => path !== "artifact.json" && path !== "mcp.json",
  );
  const actualPayloadSha256 = sha256(JSON.stringify(payload));
  if (actualPayloadSha256 !== manifest.payloadSha256)
    throw new Error(`${location}: complete plugin payload hash mismatch`);
  hashes.push(actualPayloadSha256);
}
if (new Set(hashes).size !== 1)
  throw new Error("Client and company runtime do not use one plugin artifact.");
const remoteAttestation = JSON.parse(
  await readFile(resolve(root, "plugins/remote/server-artifact.json"), "utf8"),
);
if (remoteAttestation.payloadSha256 !== hashes[0])
  throw new Error("Remote connection does not attest the server artifact.");
try {
  await readFile(
    resolve(root, "plugins/remote/dist/plugin/capability.js"),
    "utf8",
  );
  throw new Error("Remote connection incorrectly contains plugin execution.");
} catch (error) {
  if (
    !(error instanceof Error) ||
    !("code" in error) ||
    error.code !== "ENOENT"
  )
    throw error;
}

for (const packageName of ["company-mcp-gateway", "server-plugin-runtime"]) {
  const files = await filesUnder(resolve(root, `packages/${packageName}/src`));
  for (const file of files) {
    const text = await readFile(
      resolve(root, `packages/${packageName}/src`, file),
      "utf8",
    );
    if (/plugin-capability|todo-core/.test(text))
      throw new Error(
        `${packageName}/${file} imports plugin implementation source`,
      );
  }
}

console.log(
  `One executable plugin artifact is reused by the client and company runtime: ${hashes[0]}`,
);

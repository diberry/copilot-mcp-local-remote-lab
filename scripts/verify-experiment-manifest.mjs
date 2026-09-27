import { readFile } from "node:fs/promises";
import {
  ExperimentManifestSchema,
  validateBaseline,
} from "../dist/packages/experiment-runner/src/manifest.js";
const manifest = ExperimentManifestSchema.parse(
  JSON.parse(await readFile("examples/experiment-manifest.json", "utf8")),
);
validateBaseline(manifest);
const text = JSON.stringify(manifest).toLowerCase();
for (const term of [
  "subscriptionid",
  "tenantid",
  "token",
  "prompt",
  "todotext",
  "localpath",
  "userid",
])
  if (text.includes(term)) throw new Error(`Forbidden manifest field: ${term}`);
console.log("Experiment manifest and baseline confound controls passed.");

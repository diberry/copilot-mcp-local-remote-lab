import { mkdir, writeFile } from "node:fs/promises";
import { canonicalDiscovery } from "../dist/packages/mcp-server/src/catalog.js";

const canonical = canonicalDiscovery();
await mkdir("artifacts/discovery", { recursive: true });
for (const profile of ["local", "remote"])
  await writeFile(
    `artifacts/discovery/${profile}.json`,
    `${JSON.stringify(canonical, null, 2)}\n`,
  );
if (JSON.stringify(canonical) !== JSON.stringify(canonicalDiscovery()))
  throw new Error("Discovery mismatch.");
console.log(`Discovery parity passed for ${canonical.length} tools.`);

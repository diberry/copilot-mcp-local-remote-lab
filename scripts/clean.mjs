import { rm } from "node:fs/promises";
for (const path of ["dist", "plugins", "artifacts"])
  await rm(path, { recursive: true, force: true });

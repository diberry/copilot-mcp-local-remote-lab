import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

export const root = resolve(import.meta.dirname, "..");
export const sha256 = (data) => createHash("sha256").update(data).digest("hex");
export async function filesUnder(directory) {
  const output = [];
  async function walk(current) {
    for (const entry of await readdir(current, { withFileTypes: true })) {
      const path = resolve(current, entry.name);
      if (entry.isDirectory()) await walk(path);
      else output.push(relative(directory, path).replaceAll("\\", "/"));
    }
  }
  await walk(directory);
  return output.sort();
}
export async function inventory(directory) {
  return Promise.all(
    (await filesUnder(directory)).map(async (file) => ({
      path: file,
      sha256: sha256(await readFile(resolve(directory, file))),
    })),
  );
}

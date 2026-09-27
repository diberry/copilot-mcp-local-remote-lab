import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHttpApp } from "../../mcp-server/src/http.js";
import { summarize } from "./metrics.js";
import { ExperimentManifestSchema, validateBaseline } from "./manifest.js";
import { runScenario } from "./scenario.js";

const repetitions = Number(process.env.REPETITIONS ?? 20);
if (!Number.isInteger(repetitions) || repetitions < 20)
  throw new Error("REPETITIONS must be at least 20.");
const fixture = JSON.parse(
  await readFile("examples/experiment-manifest.json", "utf8"),
);
const hashes = JSON.parse(
  await readFile("artifacts/plugin-inventory/summary.json", "utf8"),
);
const manifest = ExperimentManifestSchema.parse({
  ...fixture,
  ...hashes,
  sourceCommit: process.env.SOURCE_COMMIT ?? "uncommitted-worktree",
  nodeVersion: process.versions.node,
  timestampUtc: new Date().toISOString(),
});
validateBaseline(manifest);
const local: number[] = [];
const remote: number[] = [];
const pairs = [];
const app = createHttpApp();
await new Promise<void>((resolveListen) =>
  app.listen(0, "127.0.0.1", resolveListen),
);
const address = app.address();
if (!address || typeof address === "string")
  throw new Error("Test HTTP listener did not start.");
const localClient = new Client({ name: "experiment-local", version: "1.0.0" });
const remoteClient = new Client({
  name: "experiment-remote",
  version: "1.0.0",
});
await localClient.connect(
  new StdioClientTransport({
    command: process.execPath,
    args: [resolve("plugins/local/dist/plugin/stdio.js")],
  }),
);
await remoteClient.connect(
  new StreamableHTTPClientTransport(
    new URL(`http://127.0.0.1:${address.port}/mcp`),
    { requestInit: { headers: { origin: "http://127.0.0.1:3000" } } },
  ),
);
try {
  await runScenario(localClient, "stdio");
  await runScenario(remoteClient, "streamable-http");
  for (let index = 0; index < repetitions; index++) {
    const order =
      index % 2 === 0
        ? (["stdio", "streamable-http"] as const)
        : (["streamable-http", "stdio"] as const);
    const pair: Record<string, number> = {};
    for (const transport of order) {
      const result = await runScenario(
        transport === "stdio" ? localClient : remoteClient,
        transport,
      );
      pair[transport] = result.durationMs;
      (transport === "stdio" ? local : remote).push(result.durationMs);
    }
    pairs.push({
      pairId: `${manifest.pairId}-${index + 1}`,
      order,
      localMs: pair.stdio,
      remoteMs: pair["streamable-http"],
      deltaMs: pair["streamable-http"]! - pair.stdio!,
    });
  }
} finally {
  await localClient.close();
  await remoteClient.close();
  await new Promise<void>((resolveClose, reject) =>
    app.close((error) => (error ? reject(error) : resolveClose())),
  );
}
const report = {
  manifest,
  failures: 0,
  local: summarize(local),
  remote: summarize(remote),
  pairs,
};
await mkdir("artifacts/experiments", { recursive: true });
await writeFile(
  "artifacts/experiments/baseline.json",
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));

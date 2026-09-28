import { existsSync } from "node:fs";
if (existsSync("plugins/local") || existsSync("plugins/remote")) {
  console.error(
    "Generated plugin bundles remain. Run npm run clean after uninstalling them.",
  );
  process.exitCode = 1;
} else {
  console.log(
    "No generated local plugin bundles remain. Verify Azure absence with: az group exists --name <resource-group>",
  );
}

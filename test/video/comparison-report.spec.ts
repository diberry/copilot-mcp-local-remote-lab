import { copyFile, mkdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
const scenes = [
  "01-execution-boundary",
  "02-equivalent-tool-flow",
  "03-latency-cold-warm",
  "04-failure-and-recovery",
];

for (const scene of scenes) {
  test(`capture ${scene}`, async ({ browser }) => {
    await mkdir("artifacts/videos", { recursive: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      locale: "en-US",
      colorScheme: "light",
      reducedMotion: "reduce",
      recordVideo: {
        dir: "artifacts/video-raw",
        size: { width: 1280, height: 720 },
      },
    });
    const page = await context.newPage();
    const video = page.video();
    await page.goto(`/#${scene}`);
    await page.locator(`[data-scene="${scene}"]`).click();
    await expect(page.locator("h1")).not.toBeEmpty();
    await page.waitForTimeout(1200);
    await context.close();
    if (!video) throw new Error("Video recording unavailable.");
    await copyFile(await video.path(), `artifacts/videos/${scene}.webm`);
  });
}

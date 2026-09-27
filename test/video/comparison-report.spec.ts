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
    test.setTimeout(45_000);
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
    await page.locator(`button[data-scene="${scene}"]`).click();
    await expect(page.locator("h1")).not.toBeEmpty();
    await expect(page.locator("body")).not.toContainText(
      "Azure Container Apps",
    );
    await expect(page.locator("main")).toHaveAttribute(
      "data-status",
      "complete",
      { timeout: 30_000 },
    );
    await page.waitForTimeout(1500);
    await context.close();
    if (!video) throw new Error("Video recording unavailable.");
    await copyFile(await video.path(), `artifacts/videos/${scene}.webm`);

    const verifier = await browser.newContext();
    const metadataPage = await verifier.newPage();
    await metadataPage.goto("/");
    const duration = await metadataPage.evaluate(
      (source) =>
        new Promise<number>((resolve, reject) => {
          const element = document.createElement("video");
          element.preload = "metadata";
          element.onloadedmetadata = () => resolve(element.duration);
          element.onerror = () => reject(new Error("Video metadata failed."));
          element.src = source;
          document.body.append(element);
        }),
      `/videos/${scene}.webm`,
    );
    await verifier.close();
    expect(duration).toBeGreaterThanOrEqual(20);
  });
}

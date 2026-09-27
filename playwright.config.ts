import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "test/video",
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1280, height: 720 },
    colorScheme: "light",
    locale: "en-US",
    reducedMotion: "reduce",
  },
  webServer: {
    command: "node scripts/serve-video.mjs",
    url: "http://127.0.0.1:4173/health",
    reuseExistingServer: false,
  },
});

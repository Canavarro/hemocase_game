import { defineConfig, devices } from "@playwright/test";

// Ambientes gerenciados (CI/containers) podem apontar um Chromium já instalado
// via PW_CHROMIUM_PATH quando o build baixado pelo Playwright não existe.
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure", launchOptions: executablePath ? { executablePath, args: ["--no-sandbox"] } : {} },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Chromium com emulação de iPhone: o rig só instala Chromium, e o que o
    // teste valida (layout mobile + toque) independe do motor WebKit.
    { name: "mobile", use: { ...devices["iPhone 13"], browserName: "chromium" } },
  ],
  webServer: {
    command: "npm run start -w @hemocase/server",
    cwd: "../..",
    url: "http://127.0.0.1:3000/api/health",
    reuseExistingServer: true,
  },
});

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv, type Plugin } from "vite";
import { handleAiRequest } from "./src/ai/openAiServer";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-expect-error process is a nodejs global
const base = process.env.VITE_BASE_PATH || "/";

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
  base,
  plugins: [react(), localAiPlugin(env.OPENAI_API_KEY, env.OPENAI_MODEL)],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    passWithNoTests: true,
    setupFiles: "./src/test/setup.ts",
  },
};
});

function localAiPlugin(apiKey: string | undefined, model: string | undefined): Plugin {
  return {
    name: "local-ai-api",
    configureServer(server) {
      server.middlewares.use("/api/ai", async (request, response) => {
        try {
          await handleAiRequest(request, response, apiKey, model);
        } catch (error) {
          response.statusCode = 500;
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : "AI-anropet misslyckades." }));
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/ai", async (request, response) => {
        try {
          await handleAiRequest(request, response, apiKey, model);
        } catch (error) {
          response.statusCode = 500;
          response.setHeader("Content-Type", "application/json");
          response.end(JSON.stringify({ error: error instanceof Error ? error.message : "AI-anropet misslyckades." }));
        }
      });
    },
  };
}

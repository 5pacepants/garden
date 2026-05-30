import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { loadEnv, type Plugin } from "vite";
import { handleAiRequest } from "./src/ai/openAiServer";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;
// @ts-expect-error process is a nodejs global
const base = process.env.VITE_BASE_PATH || "/";

// https://vite.dev/config/
export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    base,
  plugins: [react(), localAiPlugin(env.OPENAI_API_KEY, env.OPENAI_MODEL), localDriveSyncPlugin()],

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

function localDriveSyncPlugin(): Plugin {
  return {
    name: "local-drive-sync-api",
    configureServer(server) {
      server.middlewares.use("/api/drive-sync/garden-state", handleDriveSyncRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use("/api/drive-sync/garden-state", handleDriveSyncRequest);
    },
  };
}

async function handleDriveSyncRequest(
  request: { method?: string; on(event: string, callback: (chunk?: Buffer | Error) => void): void },
  response: { statusCode: number; setHeader(name: string, value: string): void; end(body?: string): void },
) {
  const filePath = resolveDriveSyncStatePath();

  if (request.method === "GET") {
    if (!existsSync(filePath)) {
      response.statusCode = 404;
      response.end();
      return;
    }

    response.setHeader("Content-Type", "application/json");
    response.end(await readFile(filePath, "utf8"));
    return;
  }

  if (request.method === "PUT") {
    const body = await readRequestBody(request);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, body, "utf8");
    response.statusCode = 204;
    response.end();
    return;
  }

  response.statusCode = 405;
  response.end();
}

function resolveDriveSyncStatePath(): string {
  const candidates = [
    path.resolve(process.cwd(), "drive-sync", "garden-state.json"),
    path.resolve(process.cwd(), "..", "..", "drive-sync", "garden-state.json"),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

function readRequestBody(request: { on(event: string, callback: (chunk?: Buffer | Error) => void): void }): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += String(chunk ?? "");
    });
    request.on("end", () => resolve(data));
    request.on("error", (error) => reject(error));
  });
}

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

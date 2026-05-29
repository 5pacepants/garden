import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { registerServiceWorker } from "../../src/registerServiceWorker";

describe("registerServiceWorker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers the service worker from the Vite base path", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { serviceWorker: { register } });

    await registerServiceWorker({ baseUrl: "/garden/" });

    expect(register).toHaveBeenCalledWith("/garden/sw.js", { scope: "/garden/" });
  });

  it("does nothing when service workers are unavailable", async () => {
    vi.stubGlobal("navigator", {});

    await expect(registerServiceWorker()).resolves.toBeUndefined();
  });

  it("swallows service worker registration failures", async () => {
    const register = vi.fn().mockRejectedValue(new Error("registration failed"));
    vi.stubGlobal("navigator", { serviceWorker: { register } });

    await expect(registerServiceWorker({ baseUrl: "/" })).resolves.toBeUndefined();
  });
});

describe("service worker source", () => {
  const swSource = readFileSync("public/sw.js", "utf8");

  it("bypasses API requests instead of caching garden state responses", () => {
    expect(swSource).toContain('requestUrl.pathname.startsWith("/api/")');
  });

  it("keeps runtime static asset cache writes attached to the fetch event", () => {
    expect(swSource).toMatch(/event\.waitUntil\(cacheWrite\)/);
    expect(swSource).toContain("cache.put(event.request, responseClone)");
  });

  it("claims clients as part of activation completion", () => {
    expect(swSource).toContain("self.clients.claim()");
    expect(swSource).toMatch(/Promise\.all\(\[[\s\S]*self\.clients\.claim\(\)[\s\S]*\]\)/);
  });
});

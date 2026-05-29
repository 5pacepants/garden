import { afterEach, describe, expect, it, vi } from "vitest";
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
});

import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
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

type ServiceWorkerHarness = ReturnType<typeof createServiceWorkerHarness>;

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

function createDeferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((deferredResolve) => {
    resolve = deferredResolve;
  });
  return { promise, resolve };
}

function createServiceWorkerHarness(options: { fetch?: ReturnType<typeof vi.fn>; cachedResponses?: Map<string, unknown> } = {}) {
  const swSource = readFileSync("public/sw.js", "utf8");
  const listeners: Record<string, Array<(event: any) => void>> = {};
  const cachedResponses = options.cachedResponses ?? new Map<string, unknown>();
  const cachePut = vi.fn().mockResolvedValue(undefined);
  const cacheAddAll = vi.fn().mockResolvedValue(undefined);
  const cacheDelete = vi.fn().mockResolvedValue(true);
  const fetch = options.fetch ?? vi.fn().mockResolvedValue(createFetchResponse());
  const self = {
    location: { origin: "https://example.test" },
    registration: { scope: "https://example.test/garden/" },
    clients: { claim: vi.fn().mockResolvedValue(undefined) },
    skipWaiting: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn((type: string, handler: (event: any) => void) => {
      listeners[type] = [...(listeners[type] ?? []), handler];
    }),
  };
  const caches = {
    open: vi.fn().mockResolvedValue({ addAll: cacheAddAll, put: cachePut }),
    keys: vi.fn().mockResolvedValue(["old-cache", "tradgard-app-shell-v1"]),
    delete: cacheDelete,
    match: vi.fn((request: { url?: string } | string) => Promise.resolve(cachedResponses.get(cacheKey(request)))),
  };

  runInNewContext(swSource, { URL, self, caches, fetch, Promise });

  return { cacheAddAll, cacheDelete, cachePut, caches, fetch, listeners, self };
}

function cacheKey(request: { url?: string } | string) {
  return typeof request === "string" ? request : request.url ?? "";
}

function createFetchResponse() {
  const clone = { fromClone: true };
  return { ok: true, clone: vi.fn(() => clone) };
}

function createFetchEvent(url: string, options: { mode?: string; method?: string } = {}) {
  let responsePromise: Promise<unknown> | undefined;
  const event = {
    request: {
      method: options.method ?? "GET",
      mode: options.mode ?? "same-origin",
      url,
    },
    respondWith: vi.fn((response: Promise<unknown>) => {
      responsePromise = Promise.resolve(response);
    }),
    waitUntil: vi.fn(),
  };

  return { event, get responsePromise() { return responsePromise; } };
}

function createExtendableEvent() {
  let lifetimePromise: Promise<unknown> | undefined;
  const event = {
    waitUntil: vi.fn((promise: Promise<unknown>) => {
      lifetimePromise = Promise.resolve(promise);
    }),
  };

  return { event, get lifetimePromise() { return lifetimePromise; } };
}

function dispatch(harness: ServiceWorkerHarness, type: string, event: unknown) {
  for (const listener of harness.listeners[type] ?? []) {
    listener(event);
  }
}

describe("service worker behavior", () => {
  it("keeps skipWaiting in the install event lifetime", async () => {
    const harness = createServiceWorkerHarness();
    const skipWaiting = createDeferred<void>();
    harness.self.skipWaiting.mockReturnValue(skipWaiting.promise);
    const installEvent = createExtendableEvent();

    dispatch(harness, "install", installEvent.event);
    await flushPromises();

    expect(harness.self.skipWaiting).toHaveBeenCalled();
    expect(installEvent.lifetimePromise).toBeDefined();
    let lifetimeSettled = false;
    installEvent.lifetimePromise?.then(() => {
      lifetimeSettled = true;
    });
    await flushPromises();
    expect(lifetimeSettled).toBe(false);

    skipWaiting.resolve();
    await installEvent.lifetimePromise;
    expect(lifetimeSettled).toBe(true);
  });

  it("bypasses base-path API requests without handling the response", () => {
    const harness = createServiceWorkerHarness();
    const { event } = createFetchEvent("https://example.test/garden/api/drive-sync/garden-state");

    dispatch(harness, "fetch", event);

    expect(event.respondWith).not.toHaveBeenCalled();
    expect(event.waitUntil).not.toHaveBeenCalled();
    expect(harness.fetch).not.toHaveBeenCalled();
  });

  it("handles same-origin static assets and schedules successful responses for caching", async () => {
    const response = createFetchResponse();
    const harness = createServiceWorkerHarness({ fetch: vi.fn().mockResolvedValue(response) });
    const fetchEvent = createFetchEvent("https://example.test/garden/assets/index.js");

    dispatch(harness, "fetch", fetchEvent.event);
    await fetchEvent.responsePromise;

    expect(fetchEvent.event.respondWith).toHaveBeenCalledOnce();
    expect(fetchEvent.event.waitUntil).toHaveBeenCalledOnce();
    await fetchEvent.event.waitUntil.mock.calls[0][0];
    expect(harness.cachePut).toHaveBeenCalledWith(fetchEvent.event.request, response.clone.mock.results[0].value);
  });

  it("uses the cached app shell as the navigation fallback when the network fails", async () => {
    const appShell = { cached: "app shell" };
    const cachedResponses = new Map<string, unknown>([["https://example.test/garden/index.html", appShell]]);
    const harness = createServiceWorkerHarness({ fetch: vi.fn().mockRejectedValue(new Error("offline")), cachedResponses });
    const fetchEvent = createFetchEvent("https://example.test/garden/plants", { mode: "navigate" });

    dispatch(harness, "fetch", fetchEvent.event);

    await expect(fetchEvent.responsePromise).resolves.toBe(appShell);
  });

  it("claims clients in the activate event lifetime", async () => {
    const harness = createServiceWorkerHarness();
    const activateEvent = createExtendableEvent();

    dispatch(harness, "activate", activateEvent.event);
    await activateEvent.lifetimePromise;

    expect(activateEvent.event.waitUntil).toHaveBeenCalledOnce();
    expect(harness.self.clients.claim).toHaveBeenCalledOnce();
  });
});

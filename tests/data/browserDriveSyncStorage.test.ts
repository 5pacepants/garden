import { describe, expect, it, vi } from "vitest";
import { BrowserDriveSyncStorage } from "../../src/data/browserDriveSyncStorage";

describe("BrowserDriveSyncStorage", () => {
  it("reads garden state JSON from the local browser drive-sync endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "{\"plants\":[{\"swedishName\":\"Syrenbuske\"}]}",
    });
    const storage = new BrowserDriveSyncStorage(fetcher);

    await expect(storage.read()).resolves.toContain("Syrenbuske");
    expect(fetcher).toHaveBeenCalledWith("/api/drive-sync/garden-state");
  });

  it("returns null when the local browser drive-sync endpoint is unavailable", async () => {
    const storage = new BrowserDriveSyncStorage(vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(storage.read()).resolves.toBeNull();
  });

  it("writes garden state JSON to the local browser drive-sync endpoint", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true });
    const storage = new BrowserDriveSyncStorage(fetcher);

    await storage.write("{\"plants\":[]}");

    expect(fetcher).toHaveBeenCalledWith(
      "/api/drive-sync/garden-state",
      expect.objectContaining({
        method: "PUT",
        body: "{\"plants\":[]}",
      }),
    );
  });
});

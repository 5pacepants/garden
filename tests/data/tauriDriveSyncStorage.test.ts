import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { TauriDriveSyncStorage } from "../../src/data/tauriDriveSyncStorage";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("tauri drive sync storage", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
  });

  it("reads backup JSON through the Tauri command", async () => {
    vi.mocked(invoke).mockResolvedValueOnce('{"version":1}');
    const storage = new TauriDriveSyncStorage();

    await expect(storage.read()).resolves.toBe('{"version":1}');

    expect(invoke).toHaveBeenCalledWith("read_drive_sync_backup");
  });

  it("writes backup JSON through the Tauri command", async () => {
    vi.mocked(invoke).mockResolvedValueOnce(null);
    const storage = new TauriDriveSyncStorage();

    await storage.write('{"version":1}');

    expect(invoke).toHaveBeenCalledWith("write_drive_sync_backup", { json: '{"version":1}' });
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { TauriMediaService } from "../../src/data/mediaService";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("media service", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
  });

  it("stores a picked image through Tauri", async () => {
    vi.mocked(invoke).mockResolvedValueOnce({
      reference: "appmedia://image-1.jpg",
      fileName: "image-1.jpg",
      url: "asset://localhost/image-1.jpg",
    });

    const result = await new TauriMediaService().pickAndStoreImage();

    expect(invoke).toHaveBeenCalledWith("pick_and_store_image");
    expect(result).toEqual({
      reference: "appmedia://image-1.jpg",
      fileName: "image-1.jpg",
      url: "asset://localhost/image-1.jpg",
    });
  });

  it("returns null when the picker is cancelled", async () => {
    vi.mocked(invoke).mockResolvedValueOnce(null);

    await expect(new TauriMediaService().pickAndStoreImage()).resolves.toBeNull();
  });
});

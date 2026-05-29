import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("PWA manifest", () => {
  it("defines installable app metadata and required icons", async () => {
    const manifest = JSON.parse(await readFile("public/manifest.webmanifest", "utf8"));

    expect(manifest.name).toBe("Tradgard");
    expect(manifest.short_name).toBe("Tradgard");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe(".");
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "icons/icon-192.png", sizes: "192x192", type: "image/png" }),
        expect.objectContaining({ src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }),
      ]),
    );
  });
});

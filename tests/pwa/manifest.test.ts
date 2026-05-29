import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const pngDimensions = (bytes: Buffer) => ({
  width: bytes.readUInt32BE(16),
  height: bytes.readUInt32BE(20),
});

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

  it("keeps the maskable source icon full bleed", async () => {
    const sourceIcon = await readFile("public/pwa-icon.svg", "utf8");

    expect(sourceIcon).toContain('<rect width="512" height="512" fill="#45624c"/>');
  });

  it("points to existing PNG icons with matching dimensions", async () => {
    const manifest = JSON.parse(await readFile("public/manifest.webmanifest", "utf8"));

    const iconDimensions = await Promise.all(
      manifest.icons.map(async (icon: { src: string }) => ({
        src: icon.src,
        ...pngDimensions(await readFile(`public/${icon.src}`)),
      })),
    );

    expect(iconDimensions).toEqual(
      expect.arrayContaining([
        { src: "icons/icon-192.png", width: 192, height: 192 },
        { src: "icons/icon-512.png", width: 512, height: 512 },
      ]),
    );
  });
});

import { resolveBrowserImageReference, storeBrowserImage } from "../../src/data/browserImageStore";
import { describe, expect, it } from "vitest";

describe("browserImageStore", () => {
  it("stores large generated images outside garden state and returns a lightweight reference", async () => {
    const reference = await storeBrowserImage("data:image/png;base64,generated", "map-image-ai");

    expect(reference).toBe("indexeddb://map-images/map-image-ai");
    await expect(resolveBrowserImageReference(reference)).resolves.toBe("data:image/png;base64,generated");
  });

  it("leaves non-data image references unchanged", async () => {
    await expect(storeBrowserImage("appmedia://garden.jpg", "map-image-ai")).resolves.toBe("appmedia://garden.jpg");
    await expect(resolveBrowserImageReference("appmedia://garden.jpg")).resolves.toBe("appmedia://garden.jpg");
  });
});

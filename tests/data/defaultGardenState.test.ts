import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("default garden state", () => {
  it("uses the configured base path for the bundled background image", async () => {
    vi.stubEnv("VITE_BASE_PATH", "/garden/");

    const { createDefaultGardenState } = await import("../../src/data/defaultGardenState");
    const state = createDefaultGardenState();

    expect(state.map.backgroundImage).toBe("/garden/bakgrund.png");
  });
});

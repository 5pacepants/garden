// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_BASE_PATH", "/garden/");

describe("vite base path", () => {
  it("uses VITE_BASE_PATH for GitHub Pages subpath builds", async () => {
    const { default: configFactory } = await import("../../vite.config");
    const config = await configFactory({ command: "build", mode: "production" });

    expect(config.base).toBe("/garden/");
  });
});

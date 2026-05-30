import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("mobile layout CSS", () => {
  it("defines a phone layout with bottom navigation and no desktop min-width", async () => {
    const css = await readFile("src/styles/app.css", "utf8");

    expect(css).toContain("@media (max-width: 760px)");
    expect(css).toContain("body {\n    min-width: 0;");
    expect(css).toMatch(/\.sidebar\s*{[^}]*position: fixed;/s);
    expect(css).toMatch(/\.nav-list\s*{[^}]*display: grid;[^}]*grid-auto-flow: column;/s);
    expect(css).toContain("grid-auto-flow: column;");
    expect(css).toContain("padding-bottom: calc(72px + env(safe-area-inset-bottom));");
  });
});

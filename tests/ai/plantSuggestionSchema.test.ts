import { describe, expect, it } from "vitest";
import { parsePlantSuggestion } from "../../src/ai/plantSuggestionSchema";

describe("plant suggestion schema", () => {
  it("accepts a valid plant suggestion", () => {
    const suggestion = parsePlantSuggestion({
      swedishName: "Röd solhatt",
      latinName: "Echinacea purpurea",
      type: "perennial",
      needs: { light: ["full_sun"] },
      tags: ["pollinator-friendly"],
      careSchedule: [],
    });

    expect(suggestion.swedishName).toBe("Röd solhatt");
  });

  it("rejects invalid suggestions", () => {
    expect(() => parsePlantSuggestion({ swedishName: "Saknar krav" })).toThrow("Invalid plant suggestion");
  });
});

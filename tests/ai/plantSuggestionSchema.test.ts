import { describe, expect, it } from "vitest";
import { parsePlantNameSuggestions, parsePlantRecommendations, parsePlantSuggestion } from "../../src/ai/plantSuggestionSchema";

describe("plant suggestion schema", () => {
  it("accepts a valid plant suggestion", () => {
    const suggestion = parsePlantSuggestion({
      swedishName: "Rod solhatt",
      latinName: "Echinacea purpurea",
      type: "perennial",
      needs: { light: ["sun"] },
      tags: ["pollinator-friendly", "edible"],
      plantInfo: "Blommar lange och lockar pollinatorer.",
      harvestMonths: [8, 9],
      careSchedule: [],
    });

    expect(suggestion.swedishName).toBe("Rod solhatt");
    expect(suggestion.plantInfo).toBe("Blommar lange och lockar pollinatorer.");
    expect(suggestion.harvestMonths).toEqual([8, 9]);
  });

  it("rejects invalid suggestions", () => {
    expect(() => parsePlantSuggestion({ swedishName: "Saknar krav" })).toThrow("Invalid plant suggestion");
  });

  it("adds pollinator tag when plant info says it attracts pollinators", () => {
    const suggestion = parsePlantSuggestion({
      swedishName: "Fältvädd",
      latinName: "Knautia arvensis",
      type: "perennial",
      needs: { light: ["sun"] },
      tags: [],
      plantInfo: "Attraktiv för pollinatörer som bin och fjärilar.",
      careSchedule: [],
    });

    expect(suggestion.tags).toContain("pollinator-friendly");
  });

  it("parses plant name suggestions", () => {
    expect(parsePlantNameSuggestions({ suggestions: ["Lavendel", 1, "Lavandin"] })).toEqual(["Lavendel", "Lavandin"]);
  });

  it("parses plant recommendations", () => {
    const recommendations = parsePlantRecommendations({
      recommendations: [
        {
          swedishName: "Stappsalvia",
          reason: "Passar i sol.",
          type: "perennial",
          light: ["sun"],
          moisture: ["normal"],
          tags: ["pollinator-friendly"],
        },
      ],
    });

    expect(recommendations[0]).toMatchObject({ swedishName: "Stappsalvia", reason: "Passar i sol." });
  });
});

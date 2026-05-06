import type { PlantSuggestion } from "./plantSuggestionSchema";

export interface PlantSuggestionService {
  suggestPlant(input: { name: string }): Promise<PlantSuggestion>;
}

export class MockPlantSuggestionService implements PlantSuggestionService {
  async suggestPlant(input: { name: string }): Promise<PlantSuggestion> {
    return {
      swedishName: input.name || "Röd solhatt",
      latinName: input.name.toLowerCase().includes("solhatt") ? "Echinacea purpurea" : undefined,
      type: "perennial",
      needs: {
        light: ["full_sun"],
        moisture: ["normal", "dry"],
        soilTraits: ["well_drained"],
      },
      floweringMonths: [7, 8, 9],
      heightCm: 80,
      widthCm: 45,
      tags: ["pollinator-friendly"],
      notes: "AI-förslag: granska och justera innan du litar på rådet.",
      careSchedule: [
        {
          actionType: "prune",
          timing: { type: "date", month: 5, day: 1 },
          instructions: "Klipp ner fjolårets växtdelar på våren.",
          priority: "normal",
          taskMode: "suggested",
          source: "ai",
        },
      ],
    };
  }
}

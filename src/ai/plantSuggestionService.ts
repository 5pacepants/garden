import type { PlantRecommendation, PlantSuggestion } from "./plantSuggestionSchema";

export interface PlantSuggestionService {
  suggestPlant(input: { name: string }): Promise<PlantSuggestion>;
  suggestPlantNames?(input: { query: string }): Promise<string[]>;
  recommendPlants?(input: { context: string }): Promise<PlantRecommendation[]>;
}

export class MockPlantSuggestionService implements PlantSuggestionService {
  async suggestPlant(input: { name: string }): Promise<PlantSuggestion> {
    return {
      swedishName: input.name || "Röd solhatt",
      latinName: input.name.toLowerCase().includes("solhatt") ? "Echinacea purpurea" : undefined,
      type: "perennial",
      needs: {
        light: ["sun"],
        moisture: ["normal", "dry"],
        soilTraits: ["well_drained"],
      },
      floweringMonths: [7, 8, 9],
      heightCm: 80,
      widthCm: 45,
      tags: ["pollinator-friendly"],
      plantInfo: "AI-förslag: granska och justera innan du litar på rådet.",
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

  async suggestPlantNames(input: { query: string }): Promise<string[]> {
    if (!input.query.trim()) {
      return [];
    }

    return ["Lavendel", "Stäppsalvia", "Röd solhatt"].filter((name) =>
      name.toLowerCase().includes(input.query.toLowerCase()),
    );
  }

  async recommendPlants(): Promise<PlantRecommendation[]> {
    return [
      {
        swedishName: "Stäppsalvia",
        latinName: "Salvia nemorosa",
        reason: "Passar i soligt läge och lockar pollinatörer.",
        type: "perennial",
        light: ["sun"],
        moisture: ["normal", "dry"],
        tags: ["pollinator-friendly"],
      },
    ];
  }
}


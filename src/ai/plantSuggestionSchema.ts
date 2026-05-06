import type { CareScheduleRule, PlantNeeds, PlantType } from "../domain/models";

export type PlantSuggestion = {
  swedishName: string;
  latinName?: string;
  type: PlantType;
  needs: PlantNeeds;
  floweringMonths?: number[];
  heightCm?: number;
  widthCm?: number;
  tags: string[];
  notes?: string;
  careSchedule: Array<Omit<CareScheduleRule, "id" | "plantId">>;
};

export function parsePlantSuggestion(value: unknown): PlantSuggestion {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid plant suggestion");
  }

  const candidate = value as Partial<PlantSuggestion>;

  if (!candidate.swedishName || !candidate.type || !candidate.needs || !Array.isArray(candidate.tags)) {
    throw new Error("Invalid plant suggestion");
  }

  return {
    swedishName: candidate.swedishName,
    latinName: candidate.latinName,
    type: candidate.type,
    needs: candidate.needs,
    floweringMonths: candidate.floweringMonths,
    heightCm: candidate.heightCm,
    widthCm: candidate.widthCm,
    tags: candidate.tags,
    notes: candidate.notes,
    careSchedule: Array.isArray(candidate.careSchedule) ? candidate.careSchedule : [],
  };
}

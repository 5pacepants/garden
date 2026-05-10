import type { CareScheduleRule, LightCondition, MoistureCondition, PlantNeeds, PlantType } from "../domain/models";

export type PlantSuggestion = {
  swedishName: string;
  latinName?: string;
  type: PlantType;
  needs: PlantNeeds;
  floweringMonths?: number[];
  harvestMonths?: number[];
  heightCm?: number;
  widthCm?: number;
  tags: string[];
  plantInfo?: string;
  notes?: string;
  careSchedule: Array<Omit<CareScheduleRule, "id" | "plantId">>;
};

export type PlantRecommendation = {
  swedishName: string;
  latinName?: string;
  reason: string;
  type: PlantType;
  light: LightCondition[];
  moisture: MoistureCondition[];
  tags: string[];
};

export function parsePlantSuggestion(value: unknown): PlantSuggestion {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid plant suggestion");
  }

  const candidate = value as Partial<PlantSuggestion>;

  if (!candidate.swedishName || !candidate.type || !candidate.needs || !Array.isArray(candidate.tags)) {
    throw new Error("Invalid plant suggestion");
  }

  const plantInfo = candidate.plantInfo ?? candidate.notes;

  return {
    swedishName: candidate.swedishName,
    latinName: candidate.latinName ?? undefined,
    type: candidate.type,
    needs: candidate.needs,
    floweringMonths: candidate.floweringMonths,
    harvestMonths: candidate.harvestMonths,
    heightCm: candidate.heightCm,
    widthCm: candidate.widthCm,
    tags: normalizePlantSuggestionTags(candidate.tags, plantInfo),
    plantInfo,
    notes: candidate.notes,
    careSchedule: Array.isArray(candidate.careSchedule) ? candidate.careSchedule : [],
  };
}

function normalizePlantSuggestionTags(tags: string[], plantInfo: string | undefined): string[] {
  const normalizedTags = [...tags];
  const text = plantInfo?.toLowerCase() ?? "";
  const mentionsPollinators = /pollinatör|pollinerare|bin|humlor|fjäril|fjärilar|nektar/.test(text);

  if (mentionsPollinators && !normalizedTags.includes("pollinator-friendly")) {
    normalizedTags.push("pollinator-friendly");
  }

  return normalizedTags;
}

export function parsePlantNameSuggestions(value: unknown): string[] {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid plant name suggestions");
  }

  const candidate = value as { suggestions?: unknown };
  if (!Array.isArray(candidate.suggestions)) {
    throw new Error("Invalid plant name suggestions");
  }

  return candidate.suggestions.filter((item): item is string => typeof item === "string");
}

export function parsePlantRecommendations(value: unknown): PlantRecommendation[] {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid plant recommendations");
  }

  const candidate = value as { recommendations?: unknown };
  if (!Array.isArray(candidate.recommendations)) {
    throw new Error("Invalid plant recommendations");
  }

  return candidate.recommendations.map((item) => {
    const recommendation = item as Partial<PlantRecommendation>;
    if (!recommendation.swedishName || !recommendation.reason || !recommendation.type) {
      throw new Error("Invalid plant recommendations");
    }

    return {
      swedishName: recommendation.swedishName,
      latinName: recommendation.latinName ?? undefined,
      reason: recommendation.reason,
      type: recommendation.type,
      light: Array.isArray(recommendation.light) ? recommendation.light : [],
      moisture: Array.isArray(recommendation.moisture) ? recommendation.moisture : [],
      tags: Array.isArray(recommendation.tags) ? recommendation.tags : [],
    };
  });
}

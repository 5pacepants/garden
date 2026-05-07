import type { LightCondition, MoistureCondition, PlaceMatch, Plant, PlantNeeds, SoilTrait, Zone } from "./models";

export type ZoneConditions = {
  light?: LightCondition;
  moisture?: MoistureCondition;
  soilTraits?: SoilTrait[];
};

export type RankedPlantMatch = {
  plant: Plant;
  match: PlaceMatch;
};

const matchRank: Record<PlaceMatch["state"], number> = {
  good: 0,
  possible: 1,
  unknown: 2,
  warning: 3,
};

export function matchPlantToConditions(plantNeeds: PlantNeeds, zoneConditions: ZoneConditions): PlaceMatch {
  if (!hasKnownNeeds(plantNeeds)) {
    return { state: "unknown", reasons: ["Växtens krav saknas."] };
  }

  if (!hasKnownConditions(zoneConditions)) {
    return { state: "unknown", reasons: ["Platsens förhållanden saknas."] };
  }

  const warnings: string[] = [];
  const confirmations: string[] = [];
  const unknowns: string[] = [];

  compareLight(plantNeeds, zoneConditions, warnings, confirmations, unknowns);
  compareMoisture(plantNeeds, zoneConditions, warnings, confirmations, unknowns);
  compareSoil(plantNeeds, zoneConditions, warnings, confirmations, unknowns);

  if (warnings.length > 0) {
    return { state: "warning", reasons: warnings };
  }

  if (unknowns.length > 0) {
    return { state: confirmations.length > 0 ? "possible" : "unknown", reasons: [...confirmations, ...unknowns] };
  }

  return { state: "good", reasons: confirmations.length > 0 ? confirmations : ["Platsen matchar växtens krav."] };
}

export function rankPlantsForConditions(plants: Plant[], zoneConditions: ZoneConditions): RankedPlantMatch[] {
  return plants
    .map((plant) => ({
      plant,
      match: matchPlantToConditions(plant.needs, zoneConditions),
    }))
    .sort((a, b) => matchRank[a.match.state] - matchRank[b.match.state] || a.plant.swedishName.localeCompare(b.plant.swedishName));
}

export function getPlacementWarning(plant: Plant, zonesAtPoint: Zone[]): PlaceMatch {
  if (zonesAtPoint.length === 0) {
    return { state: "unknown", reasons: ["Ingen zon är markerad här."] };
  }

  if (hasConflictingZones(zonesAtPoint)) {
    return {
      state: "possible",
      reasons: ["Platsen har motstridiga zonförhållanden. Kontrollera zonlagren."],
    };
  }

  return matchPlantToConditions(plant.needs, mergeZoneConditions(zonesAtPoint));
}

function hasKnownNeeds(needs: PlantNeeds): boolean {
  return Boolean(needs.light?.length || needs.moisture?.length || needs.soilTraits?.length);
}

function hasKnownConditions(conditions: ZoneConditions): boolean {
  return Boolean(conditions.light || conditions.moisture || conditions.soilTraits?.length);
}

function compareLight(
  needs: PlantNeeds,
  conditions: ZoneConditions,
  warnings: string[],
  confirmations: string[],
  unknowns: string[],
): void {
  if (!needs.light?.length || !conditions.light) {
    unknowns.push("Ljusbehov eller ljuszon saknas.");
    return;
  }

  if (needs.light.includes(conditions.light)) {
    confirmations.push("Platsen matchar växtens ljusbehov.");
    return;
  }

  warnings.push(`Växten vill ha ${formatLightList(needs.light)}, men platsen är ${formatLight(conditions.light)}.`);
}

function compareMoisture(
  needs: PlantNeeds,
  conditions: ZoneConditions,
  warnings: string[],
  confirmations: string[],
  unknowns: string[],
): void {
  if (!needs.moisture?.length || !conditions.moisture) {
    unknowns.push("Fuktbehov eller fuktzon saknas.");
    return;
  }

  if (needs.moisture.includes(conditions.moisture)) {
    confirmations.push("Platsen matchar växtens fuktbehov.");
    return;
  }

  warnings.push(`Växtens fuktbehov passar inte platsens markfukt.`);
}

function compareSoil(
  needs: PlantNeeds,
  conditions: ZoneConditions,
  warnings: string[],
  confirmations: string[],
  unknowns: string[],
): void {
  if (!needs.soilTraits?.length) {
    return;
  }

  if (!conditions.soilTraits?.length) {
    unknowns.push("Jorddata saknas för platsen.");
    return;
  }

  const hasMatchingTrait = needs.soilTraits.some((trait) => conditions.soilTraits?.includes(trait));

  if (hasMatchingTrait) {
    confirmations.push("Platsen matchar minst ett av växtens jordkrav.");
    return;
  }

  warnings.push("Växtens jordkrav matchar inte platsens jorddata.");
}

function mergeZoneConditions(zones: Zone[]): ZoneConditions {
  return {
    light: firstKnown(zones.map((zone) => zone.light)),
    moisture: firstKnown(zones.map((zone) => zone.moisture)),
    soilTraits: [...new Set(zones.flatMap((zone) => zone.soilTraits ?? []))],
  };
}

function hasConflictingZones(zones: Zone[]): boolean {
  const lightValues = new Set(zones.map((zone) => zone.light).filter(Boolean));
  const moistureValues = new Set(zones.map((zone) => zone.moisture).filter(Boolean));

  return lightValues.size > 1 || moistureValues.size > 1;
}

function firstKnown<T>(values: Array<T | undefined>): T | undefined {
  return values.find((value): value is T => value !== undefined);
}

function formatLightList(values: LightCondition[]): string {
  return values.map(formatLight).join(" eller ");
}

function formatLight(value: LightCondition): string {
  if (value === "sun") {
    return "sol";
  }

  if (value === "half_sun") {
    return "halvsol";
  }

  if (value === "part_shade") {
    return "halvskugga";
  }

  return "skugga";
}


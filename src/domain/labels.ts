import type {
  CareActionType,
  HistoryEventType,
  LightCondition,
  MoistureCondition,
  PlaceMatchState,
  PlantStatus,
  PlantType,
  SoilTrait,
  TaskStatus,
} from "./models";

const plantStatusLabels: Record<PlantStatus, string> = {
  existing: "Befintlig",
  planned: "Planerad",
  wishlist: "Önskelista",
  removed: "Borttagen",
};

const plantTypeLabels: Record<PlantType, string> = {
  perennial: "Perenner",
  shrub: "Buske",
  tree: "Träd",
  vegetable: "Grönsak",
  herb: "Ört",
  bulb: "Lökväxt",
  grass: "Gräs",
  other: "Annat",
};

const lightConditionLabels: Record<LightCondition, string> = {
  sun: "Sol",
  half_sun: "Halvsol",
  part_shade: "Halvskugga",
  shade: "Skugga",
};

const moistureConditionLabels: Record<MoistureCondition, string> = {
  dry: "Torr",
  normal: "Normal",
  moist: "Fuktig",
};

const soilTraitLabels: Record<SoilTrait, string> = {
  clay: "Lera",
  sandy: "Sandig",
  well_drained: "Väldränerad",
  humus_rich: "Humusrik",
};

const careActionLabels: Record<CareActionType, string> = {
  water: "Vattna",
  prune: "Beskär",
  fertilize: "Gödsla",
  plant: "Plantera",
  move: "Flytta",
  divide: "Dela",
  harvest: "Skörda",
  weed: "Rensa ogräs",
  inspect: "Inspektera",
  custom: "Egen åtgärd",
};

const taskStatusLabels: Record<TaskStatus, string> = {
  open: "Öppen",
  completed: "Klar",
};

const historyEventTypeLabels: Record<HistoryEventType, string> = {
  planted: "Planterad",
  moved: "Flyttad",
  pruned: "Beskuren",
  fertilized: "Gödd",
  watered: "Vattnad",
  divided: "Delad",
  harvested: "Skördad",
  problem: "Problem",
  frost_damage: "Frostskada",
  overwintering: "Övervintring",
  comment: "Kommentar",
  photo: "Foto",
};

const placeMatchStateLabels: Record<PlaceMatchState, string> = {
  good: "Bra plats",
  possible: "Möjlig plats",
  warning: "Varning",
  unknown: "Okänt",
};

const priorityLabels = {
  low: "Låg",
  normal: "Normal",
  high: "Hög",
} as const;

const commonTagLabels: Record<string, string> = {
  edible: "Ätbar",
  pollinator: "Pollinatörsvänlig",
  "pollinator-friendly": "Pollinatörsvänlig",
  pollinator_friendly: "Pollinatörsvänlig",
  evergreen: "Vintergrön",
  fragrant: "Doftande",
};

export function fallbackLabel(value: string | undefined): string {
  return value ? value : "Okänt";
}

export function plantStatusLabel(value: PlantStatus): string {
  return plantStatusLabels[value] ?? fallbackLabel(value);
}

export function plantTypeLabel(value: PlantType): string {
  return plantTypeLabels[value] ?? fallbackLabel(value);
}

export function lightConditionLabel(value: LightCondition): string {
  return lightConditionLabels[value] ?? fallbackLabel(value);
}

export function moistureConditionLabel(value: MoistureCondition): string {
  return moistureConditionLabels[value] ?? fallbackLabel(value);
}

export function soilTraitLabel(value: SoilTrait): string {
  return soilTraitLabels[value] ?? fallbackLabel(value);
}

export function careActionLabel(value: CareActionType): string {
  return careActionLabels[value] ?? fallbackLabel(value);
}

export function taskStatusLabel(value: TaskStatus): string {
  return taskStatusLabels[value] ?? fallbackLabel(value);
}

export function historyEventTypeLabel(value: HistoryEventType): string {
  return historyEventTypeLabels[value] ?? fallbackLabel(value);
}

export function placeMatchStateLabel(value: PlaceMatchState): string {
  return placeMatchStateLabels[value] ?? fallbackLabel(value);
}

export function priorityLabel(value: keyof typeof priorityLabels): string {
  return priorityLabels[value] ?? fallbackLabel(value);
}

export function tagLabel(value: string): string {
  return commonTagLabels[value] ?? value;
}


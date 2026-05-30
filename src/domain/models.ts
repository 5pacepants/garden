export type EntityId = string;

export type Point = {
  x: number;
  y: number;
};

export type Polygon = Point[];

export type PlantStatus = "existing" | "planned" | "wishlist" | "removed";

export type PlantType =
  | "perennial"
  | "shrub"
  | "tree"
  | "vegetable"
  | "herb"
  | "bulb"
  | "grass"
  | "other";

export type LightCondition = "sun" | "half_sun" | "part_shade" | "shade";

export type MoistureCondition = "dry" | "normal" | "moist";

export type SoilTrait = "clay" | "sandy" | "well_drained" | "humus_rich";

export type PlaceMatchState = "good" | "possible" | "warning" | "unknown";

export type GardenMap = {
  id: EntityId;
  name: string;
  backgroundImage?: string;
};

export type SavedMapImage = {
  id: EntityId;
  name: string;
  image: string;
  source: "uploaded" | "builder" | "ai";
  createdAt: string;
  layout?: unknown;
};

export type Bed = {
  id: EntityId;
  name: string;
  polygon: Polygon;
  notes?: string;
  soilTraits?: SoilTrait[];
};

export type Zone = {
  id: EntityId;
  name: string;
  polygon: Polygon;
  light?: LightCondition;
  moisture?: MoistureCondition;
  soilTraits?: SoilTrait[];
};

export type PlantPlacement =
  | {
      type: "map";
      position: Point;
    }
  | {
      type: "bed";
      bedId: EntityId;
      relativePosition: Point;
    };

export type PlantNeeds = {
  light?: LightCondition[];
  moisture?: MoistureCondition[];
  soilTraits?: SoilTrait[];
};

export type PlantSize = {
  heightCm?: number;
  widthCm?: number;
};

export type PurchaseInfo = {
  price?: number;
  store?: string;
  link?: string;
  priority?: "low" | "normal" | "high";
};

export type CareActionType =
  | "water"
  | "prune"
  | "fertilize"
  | "plant"
  | "move"
  | "divide"
  | "harvest"
  | "weed"
  | "inspect"
  | "custom";

export type CareIntervalUnit = "day" | "week" | "month" | "year";

export type CareTiming =
  | {
      type: "date";
      month: number;
      day: number;
    }
  | {
      type: "month";
      month: number;
    }
  | {
      type: "range";
      startMonth: number;
      endMonth: number;
    }
  | {
      type: "weekly";
      startMonth: number;
      endMonth: number;
      intervalWeeks: number;
    }
  | {
      type: "recurring";
      unit: CareIntervalUnit;
      interval: number;
      months: number[];
    }
  | {
      type: "relative";
      label: string;
    }
  | {
      type: "condition";
      label: string;
    };

export type CareScheduleRule = {
  id: EntityId;
  plantId: EntityId;
  actionType: CareActionType;
  timing: CareTiming;
  instructions: string;
  priority: "low" | "normal" | "high";
  taskMode: "automatic" | "suggested";
  source: "manual" | "ai";
  lastPerformedDate?: string;
};

export type Plant = {
  id: EntityId;
  swedishName: string;
  latinName?: string;
  cultivar?: string;
  status: PlantStatus;
  type: PlantType;
  image?: string;
  placement: PlantPlacement;
  needs: PlantNeeds;
  floweringMonths?: number[];
  harvestMonths?: number[];
  pruningMonths?: number[];
  size?: PlantSize;
  mapRadius?: number;
  tags: string[];
  plantInfo?: string;
  notes?: string;
  purchaseInfo?: PurchaseInfo;
  careSchedule: CareScheduleRule[];
};

export type TaskStatus = "open" | "completed";

export type Task = {
  id: EntityId;
  title: string;
  actionType: CareActionType;
  status: TaskStatus;
  dueDate?: string;
  priority: "low" | "normal" | "high";
  plantId?: EntityId;
  bedId?: EntityId;
  notes?: string;
  sourceCareRuleId?: EntityId;
  completedAt?: string;
};

export type HistoryEventType =
  | "planted"
  | "moved"
  | "pruned"
  | "fertilized"
  | "watered"
  | "divided"
  | "harvested"
  | "problem"
  | "frost_damage"
  | "overwintering"
  | "comment"
  | "photo";

export type HistoryEvent = {
  id: EntityId;
  type: HistoryEventType;
  date: string;
  title: string;
  comment?: string;
  plantId?: EntityId;
  bedId?: EntityId;
  photoId?: EntityId;
};

export type Photo = {
  id: EntityId;
  date: string;
  label: string;
  dataUrl?: string;
  filePath?: string;
  plantId?: EntityId;
  bedId?: EntityId;
  historyEventId?: EntityId;
};

export type PlaceMatch = {
  state: PlaceMatchState;
  reasons: string[];
};

export type GardenState = {
  version: 1;
  map: GardenMap;
  mapImages?: SavedMapImage[];
  beds: Bed[];
  zones: Zone[];
  plants: Plant[];
  tasks: Task[];
  historyEvents: HistoryEvent[];
  photos: Photo[];
};


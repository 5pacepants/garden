import type { GardenState, LightCondition } from "../domain/models";
import { storeBrowserImage } from "./browserImageStore";
import { getBundledBackgroundImageReference } from "./bundledMedia";
import { createDefaultGardenState } from "./defaultGardenState";
import type { GardenRepository } from "./gardenRepository";
import { exportGardenState, importGardenState } from "./importExport";

export class LocalStorageGardenRepository implements GardenRepository {
  constructor(private readonly storageKey = "private-garden-state") {}

  hasStoredState(): boolean {
    return localStorage.getItem(this.storageKey) !== null;
  }

  async load(): Promise<GardenState> {
    const stored = localStorage.getItem(this.storageKey);

    if (!stored) {
      return createDefaultGardenState();
    }

    const state = await prepareStateForLocalStorage(applyHouseMapDefaults(this.importJson(stored)));
    localStorage.setItem(this.storageKey, this.exportJson(state));
    return state;
  }

  async save(state: GardenState): Promise<void> {
    localStorage.setItem(this.storageKey, this.exportJson(await prepareStateForLocalStorage(state)));
  }

  exportJson(state: GardenState): string {
    return exportGardenState(state);
  }

  importJson(json: string): GardenState {
    return importGardenState(json);
  }
}

const demoZoneIds = new Set(["zone_sunny_front", "zone_shady_hedge"]);
const demoBedIds = new Set(["bed_front_border"]);
const demoPlantIds = new Set(["plant_echinacea", "plant_lavender_plan", "plant_currant"]);
const demoTaskIds = new Set(["task_prune_echinacea", "task_plan_lavender"]);
const demoHistoryIds = new Set(["history_echinacea_planted", "history_front_note"]);

function applyHouseMapDefaults(state: GardenState): GardenState {
  return {
    ...state,
  map: {
    ...state.map,
      backgroundImage: getBundledBackgroundImageReference(),
    },
    mapImages: state.mapImages ?? [],
    zones: state.zones
      .filter((zone) => !demoZoneIds.has(zone.id))
      .map((zone) => ({ ...zone, light: normalizeLightCondition(zone.light) })),
    beds: state.beds.filter((bed) => !demoBedIds.has(bed.id)),
    plants: state.plants
      .filter((plant) => !demoPlantIds.has(plant.id))
      .map((plant) => ({
        ...plant,
        needs: {
          ...plant.needs,
          light: plant.needs.light?.map(normalizeLightCondition).filter((value): value is LightCondition => Boolean(value)),
        },
      })),
    tasks: state.tasks.filter(
      (task) =>
        !demoTaskIds.has(task.id) &&
        !demoPlantIds.has(task.plantId ?? "") &&
        !demoBedIds.has(task.bedId ?? ""),
    ),
    historyEvents: state.historyEvents.filter(
      (event) =>
        !demoHistoryIds.has(event.id) &&
        !demoPlantIds.has(event.plantId ?? "") &&
        !demoBedIds.has(event.bedId ?? ""),
    ),
  };
}

function normalizeLightCondition(value: LightCondition | "full_sun" | undefined): LightCondition | undefined {
  return value === "full_sun" ? "sun" : value;
}

async function prepareStateForLocalStorage(state: GardenState): Promise<GardenState> {
  let backgroundImage = state.map.backgroundImage;
  const mapImages = await Promise.all(
    (state.mapImages ?? []).map(async (image) => {
      if (image.source !== "ai" || !image.image.startsWith("data:image/")) {
        return image;
      }

      const reference = await storeBrowserImage(image.image, image.id);
      if (backgroundImage === image.image) {
        backgroundImage = reference;
      }
      return { ...image, image: reference };
    }),
  );

  return {
    ...state,
    map: { ...state.map, backgroundImage },
    mapImages,
  };
}


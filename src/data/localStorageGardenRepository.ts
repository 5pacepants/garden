import { createDemoGardenState } from "../domain/fixtures";
import type { GardenState } from "../domain/models";
import type { GardenRepository } from "./gardenRepository";
import { exportGardenState, importGardenState } from "./importExport";

export class LocalStorageGardenRepository implements GardenRepository {
  constructor(private readonly storageKey = "private-garden-state") {}

  async load(): Promise<GardenState> {
    const stored = localStorage.getItem(this.storageKey);

    if (!stored) {
      return createDemoGardenState();
    }

    const state = applyHouseMapDefaults(this.importJson(stored));
    localStorage.setItem(this.storageKey, this.exportJson(state));
    return state;
  }

  async save(state: GardenState): Promise<void> {
    localStorage.setItem(this.storageKey, this.exportJson(state));
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
      backgroundImage: "/bakgrund.png",
    },
    zones: state.zones.filter((zone) => !demoZoneIds.has(zone.id)),
    beds: state.beds.filter((bed) => !demoBedIds.has(bed.id)),
    plants: state.plants.filter((plant) => !demoPlantIds.has(plant.id)),
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

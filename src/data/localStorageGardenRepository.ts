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

    return this.importJson(stored);
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

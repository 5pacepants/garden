import type { GardenState } from "../domain/models";

export interface GardenRepository {
  load(): Promise<GardenState>;
  save(state: GardenState): Promise<void>;
  exportJson(state: GardenState): string;
  importJson(json: string): GardenState;
}

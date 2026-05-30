import type { GardenState } from "../domain/models";
import defaultGardenStateJson from "./defaultGardenState.json";

export function createDefaultGardenState(): GardenState {
  return JSON.parse(JSON.stringify(defaultGardenStateJson)) as GardenState;
}

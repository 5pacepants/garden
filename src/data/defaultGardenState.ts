import type { GardenState } from "../domain/models";
import defaultGardenStateJson from "./defaultGardenState.json";
import { getBundledBackgroundImageReference } from "./bundledMedia";

export function createDefaultGardenState(): GardenState {
  const state = JSON.parse(JSON.stringify(defaultGardenStateJson)) as GardenState;
  state.map.backgroundImage = getBundledBackgroundImageReference();
  return state;
}

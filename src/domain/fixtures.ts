import type { GardenState } from "./models";

export function createDemoGardenState(): GardenState {
  return {
    version: 1,
    map: {
      id: "map_main",
      name: "Min trädgård",
      backgroundImage: "/hus-test.png",
    },
    zones: [],
    beds: [],
    plants: [],
    tasks: [],
    historyEvents: [],
    photos: [],
  };
}

import { relativeToWorldPoint } from "./geometry";
import type { GardenState, Plant } from "./models";
import { generateTasksFromCareSchedule } from "./careSchedule";

const defaultPlantMapRadius = 1.8;
const minPlantMapRadius = 0.8;
const maxPlantMapRadius = 6;
const plantMapRadiusStep = 0.4;

export function deletePlant(state: GardenState, plantId: string): GardenState {
  return {
    ...state,
    plants: state.plants.filter((plant) => plant.id !== plantId),
    tasks: state.tasks.filter((task) => task.plantId !== plantId),
    historyEvents: state.historyEvents.filter((event) => event.plantId !== plantId),
    photos: state.photos.filter((photo) => photo.plantId !== plantId),
  };
}

export function deleteBed(state: GardenState, bedId: string): GardenState {
  const bed = state.beds.find((item) => item.id === bedId);
  if (!bed) {
    return state;
  }

  return {
    ...state,
    beds: state.beds.filter((item) => item.id !== bedId),
    plants: state.plants.map((plant) => {
      if (plant.placement.type !== "bed" || plant.placement.bedId !== bedId) {
        return plant;
      }

      return {
        ...plant,
        placement: {
          type: "map",
          position: relativeToWorldPoint(plant.placement.relativePosition, bed.polygon),
        },
      };
    }),
    tasks: state.tasks.filter((task) => task.bedId !== bedId),
    historyEvents: state.historyEvents.filter((event) => event.bedId !== bedId),
    photos: state.photos.filter((photo) => photo.bedId !== bedId),
  };
}

export function deleteZone(state: GardenState, zoneId: string): GardenState {
  return {
    ...state,
    zones: state.zones.filter((zone) => zone.id !== zoneId),
  };
}

export function resizePlantMapNode(plant: Plant, direction: 1 | -1): Plant {
  const currentRadius = plant.mapRadius ?? defaultPlantMapRadius;
  return {
    ...plant,
    mapRadius: clampRadius(Number((currentRadius + direction * plantMapRadiusStep).toFixed(1))),
  };
}

export function getPlantMapRadius(plant: Plant): number {
  return plant.mapRadius ?? defaultPlantMapRadius;
}

export function savePlantAndSyncCareTasks(
  state: GardenState,
  plant: Plant,
  fromDate = new Date(),
  toDate = addDays(fromDate, 90),
): GardenState {
  const plants = state.plants.some((existing) => existing.id === plant.id)
    ? state.plants.map((existing) => (existing.id === plant.id ? plant : existing))
    : [...state.plants, plant];
  const careRuleIds = new Set(plant.careSchedule.map((rule) => rule.id));
  const retainedTasks = state.tasks.filter(
    (task) => task.plantId !== plant.id || !task.sourceCareRuleId || careRuleIds.has(task.sourceCareRuleId),
  );
  const generatedTasks = generateTasksFromCareSchedule(plant, fromDate, toDate);
  const existingTaskIds = new Set(retainedTasks.map((task) => task.id));
  const tasks = [...retainedTasks, ...generatedTasks.filter((task) => !existingTaskIds.has(task.id))];

  return {
    ...state,
    plants,
    tasks,
  };
}

function clampRadius(value: number): number {
  return Math.max(minPlantMapRadius, Math.min(maxPlantMapRadius, value));
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}


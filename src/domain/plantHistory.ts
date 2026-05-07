import { createId } from "./ids";
import type { HistoryEvent, Plant } from "./models";

export function createPlantingHistoryEventIfNeeded(
  previousPlant: Plant | null,
  nextPlant: Plant,
  historyEvents: HistoryEvent[],
  date: string,
): HistoryEvent | null {
  if (nextPlant.status !== "existing") {
    return null;
  }

  if (previousPlant?.status === "existing") {
    return null;
  }

  const hasPlantingEvent = historyEvents.some((event) => event.plantId === nextPlant.id && event.type === "planted");
  if (hasPlantingEvent) {
    return null;
  }

  return {
    id: createId("history"),
    type: "planted",
    date,
    title: `Planterade ${nextPlant.swedishName}`,
    plantId: nextPlant.id,
  };
}

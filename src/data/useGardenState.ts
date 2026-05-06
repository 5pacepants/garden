import { useCallback, useEffect, useMemo, useState } from "react";
import type { Bed, GardenState, HistoryEvent, Photo, Plant, Task, Zone } from "../domain/models";
import type { GardenRepository } from "./gardenRepository";
import { LocalStorageGardenRepository } from "./localStorageGardenRepository";

type GardenActionResult = {
  gardenState: GardenState | null;
  isLoading: boolean;
  error: string | null;
  addPlant: (plant: Plant) => void;
  updatePlant: (plant: Plant) => void;
  addBed: (bed: Bed) => void;
  updateBed: (bed: Bed) => void;
  addZone: (zone: Zone) => void;
  updateZone: (zone: Zone) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  completeTask: (taskId: string, completedAt?: string) => void;
  addHistoryEvent: (event: HistoryEvent) => void;
  addPhoto: (photo: Photo) => void;
  replaceState: (state: GardenState) => void;
};

const defaultRepository = new LocalStorageGardenRepository();

export function useGardenState(repository: GardenRepository = defaultRepository): GardenActionResult {
  const [gardenState, setGardenState] = useState<GardenState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    repository
      .load()
      .then((state) => {
        if (isMounted) {
          setGardenState(state);
          setError(null);
        }
      })
      .catch((loadError: unknown) => {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Kunde inte läsa trädgårdsdata.");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [repository]);

  const updateState = useCallback(
    (updater: (state: GardenState) => GardenState) => {
      setGardenState((current) => {
        if (!current) {
          return current;
        }

        const next = updater(current);
        void repository.save(next).catch((saveError: unknown) => {
          setError(saveError instanceof Error ? saveError.message : "Kunde inte spara trädgårdsdata.");
        });
        return next;
      });
    },
    [repository],
  );

  return useMemo(
    () => ({
      gardenState,
      isLoading,
      error,
      addPlant: (plant: Plant) => updateState((state) => ({ ...state, plants: [...state.plants, plant] })),
      updatePlant: (plant: Plant) =>
        updateState((state) => ({
          ...state,
          plants: state.plants.map((existing) => (existing.id === plant.id ? plant : existing)),
        })),
      addBed: (bed: Bed) => updateState((state) => ({ ...state, beds: [...state.beds, bed] })),
      updateBed: (bed: Bed) =>
        updateState((state) => ({
          ...state,
          beds: state.beds.map((existing) => (existing.id === bed.id ? bed : existing)),
        })),
      addZone: (zone: Zone) => updateState((state) => ({ ...state, zones: [...state.zones, zone] })),
      updateZone: (zone: Zone) =>
        updateState((state) => ({
          ...state,
          zones: state.zones.map((existing) => (existing.id === zone.id ? zone : existing)),
        })),
      addTask: (task: Task) => updateState((state) => ({ ...state, tasks: [...state.tasks, task] })),
      updateTask: (task: Task) =>
        updateState((state) => ({
          ...state,
          tasks: state.tasks.map((existing) => (existing.id === task.id ? task : existing)),
        })),
      completeTask: (taskId: string, completedAt = new Date().toISOString()) =>
        updateState((state) => ({
          ...state,
          tasks: state.tasks.map((task) =>
            task.id === taskId ? { ...task, status: "completed", completedAt } : task,
          ),
        })),
      addHistoryEvent: (event: HistoryEvent) =>
        updateState((state) => ({ ...state, historyEvents: [...state.historyEvents, event] })),
      addPhoto: (photo: Photo) => updateState((state) => ({ ...state, photos: [...state.photos, photo] })),
      replaceState: (state: GardenState) => {
        setGardenState(state);
        void repository.save(state).catch((saveError: unknown) => {
          setError(saveError instanceof Error ? saveError.message : "Kunde inte spara trädgårdsdata.");
        });
      },
    }),
    [error, gardenState, isLoading, updateState],
  );
}

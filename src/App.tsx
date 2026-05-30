import { useEffect, useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { MobileDetailDialog } from "./components/MobileDetailDialog";
import { useGardenState } from "./data/useGardenState";
import { GardenMap } from "./features/map/GardenMap";
import { MapFocusOverlay } from "./features/map/MapFocusOverlay";
import { MapBuilderView } from "./features/mapBuilder/MapBuilderView";
import type { MapSelection } from "./features/map/mapSelection";
import { defaultPlantFilters, filterPlants, PlantFilters } from "./features/plants/PlantFilters";
import { PlantList } from "./features/plants/PlantList";
import { PlanningView } from "./features/planning/PlanningView";
import { CalendarView } from "./features/tasks/CalendarView";
import { TaskList } from "./features/tasks/TaskList";
import { HistoryTimeline } from "./features/history/HistoryTimeline";
import { PhotoHistory } from "./features/history/PhotoHistory";
import type { AppView } from "./components/Sidebar";
import { createPlantSuggestionService } from "./ai/plantSuggestionServiceFactory";
import { type AiSettings, SettingsView } from "./features/settings/SettingsView";
import type { GardenMapLayout } from "./features/mapBuilder/mapBuilderModel";
import type { SavedMapImage } from "./domain/models";
import "./styles/app.css";

const defaultAiSettings: AiSettings = {
  enabled: true,
};

function App() {
  const {
    addBed,
    addHistoryEvent,
    addPhoto,
    addPlant,
    addTask,
    addZone,
    completeTask,
    deleteBed,
    deletePlant,
    deleteZone,
    gardenState,
    isLoading,
    error,
    savePlant,
    updateBed,
    updatePlant,
    updateZone,
    replaceState,
  } = useGardenState();
  const [activeView, setActiveView] = useState<AppView>("map");
  const [selection, setSelection] = useState<MapSelection>(null);
  const [isMapFocusOpen, setIsMapFocusOpen] = useState(false);
  const [plantFilters, setPlantFilters] = useState(defaultPlantFilters);
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const [editingMapLayout, setEditingMapLayout] = useState<GardenMapLayout | undefined>(undefined);
  const isMobileViewport = useIsMobileViewport();
  const tasks = gardenState?.tasks ?? [];
  const plants = gardenState?.plants ?? [];
  const plantIdsWithTasksThisWeek = useMemo(() => getPlantIdsWithTasksThisWeek(tasks), [tasks]);
  const filteredPlants = useMemo(
    () => filterPlants(plants, plantFilters, plantIdsWithTasksThisWeek),
    [plants, plantFilters, plantIdsWithTasksThisWeek],
  );
  const visiblePlantIds = useMemo(() => new Set(filteredPlants.map((plant) => plant.id)), [filteredPlants]);
  const suggestionService = useMemo(
    () => createPlantSuggestionService({ enabled: aiSettings.enabled, isDevelopment: import.meta.env.DEV }),
    [aiSettings],
  );

  if (isLoading) {
    return <div className="loading-state">Läser trädgårdsdata...</div>;
  }

  if (error || !gardenState) {
    return <div className="loading-state error-state">{error ?? "Kunde inte läsa trädgårdsdata."}</div>;
  }

  const currentGardenState = gardenState;
  const shouldShowMobileDetail =
    isMobileViewport && Boolean(selection) && !isMapFocusOpen && (activeView === "map" || activeView === "plants");

  function updateAiSettings(settings: AiSettings) {
    setAiSettings(settings);
    localStorage.setItem("private-garden-ai-settings", JSON.stringify(settings));
  }

  function saveMapImage(image: SavedMapImage) {
    replaceState({
      ...currentGardenState,
      mapImages: [...(currentGardenState.mapImages ?? []).filter((existing) => existing.id !== image.id), image],
    });
  }

  return (
    <AppShell
      activeView={activeView}
      gardenState={gardenState}
      onDeleteSelection={(nextSelection) => {
        if (nextSelection.type === "plant") {
          deletePlant(nextSelection.id);
        } else if (nextSelection.type === "bed") {
          deleteBed(nextSelection.id);
        } else {
          deleteZone(nextSelection.id);
        }
        setSelection(null);
      }}
      onAddPhoto={addPhoto}
      onSaveBed={updateBed}
      onSavePlant={savePlant}
      onSaveZone={updateZone}
      onViewChange={setActiveView}
      selection={selection}
      showDetailPanel={!isMobileViewport}
      suggestionService={suggestionService}
      tasks={gardenState.tasks}
    >
      {(activeView === "map" || activeView === "plants") && <PlantFilters value={plantFilters} onChange={setPlantFilters} />}
      {activeView === "map" && (
        <GardenMap
          gardenState={gardenState}
          plantFilters={plantFilters}
          visiblePlantIds={visiblePlantIds}
          onAddBed={addBed}
          onAddPlant={addPlant}
          onAddZone={addZone}
          onUpdateBed={updateBed}
          onUpdatePlant={updatePlant}
          onUpdateZone={updateZone}
          onSelectionChange={setSelection}
          onOpenFocus={() => {
            setIsMapFocusOpen(true);
            void enterMapFocusDisplay();
          }}
          selection={selection}
        />
      )}
      {activeView === "map" && isMapFocusOpen && (
        <MapFocusOverlay
          gardenState={gardenState}
          onAddBed={addBed}
          onAddPhoto={addPhoto}
          onAddPlant={addPlant}
          onAddZone={addZone}
          onClose={() => {
            setIsMapFocusOpen(false);
            void exitMapFocusDisplay();
          }}
          onDeleteSelection={(nextSelection) => {
            if (nextSelection.type === "plant") {
              deletePlant(nextSelection.id);
            } else if (nextSelection.type === "bed") {
              deleteBed(nextSelection.id);
            } else {
              deleteZone(nextSelection.id);
            }
            setSelection(null);
          }}
          onSaveBed={updateBed}
          onSavePlant={savePlant}
          onSaveZone={updateZone}
          onSelectionChange={setSelection}
          onUpdateBed={updateBed}
          onUpdatePlant={updatePlant}
          onUpdateZone={updateZone}
          selection={selection}
          suggestionService={suggestionService}
        />
      )}
      {activeView === "mapBuilder" && (
        <MapBuilderView
          gardenState={gardenState}
          initialLayout={editingMapLayout}
          onApplyGardenState={replaceState}
          onSaveMapImage={saveMapImage}
        />
      )}
      {activeView === "plants" && (
        <PlantList plants={filteredPlants} tasks={gardenState.tasks} onSelectPlant={(id) => setSelection({ type: "plant", id })} />
      )}
      {activeView === "tasks" && (
        <TaskList tasks={gardenState.tasks} onAddTask={addTask} onCompleteTask={completeTask} />
      )}
      {activeView === "calendar" && <CalendarView tasks={gardenState.tasks} />}
      {activeView === "history" && (
        <>
          <HistoryTimeline
            events={gardenState.historyEvents}
            onAddEvent={addHistoryEvent}
            onSelectLinkedObject={(nextSelection) => {
              setSelection(nextSelection);
              setActiveView("map");
            }}
          />
          <PhotoHistory photos={gardenState.photos} onAddPhoto={addPhoto} />
        </>
      )}
      {activeView === "planning" && (
        <PlanningView plants={gardenState.plants} onSelectPlant={(id) => setSelection({ type: "plant", id })} />
      )}
      {activeView === "settings" && (
        <SettingsView
          aiSettings={aiSettings}
          gardenState={gardenState}
          onAiSettingsChange={updateAiSettings}
          onEditMapImage={(image) => {
            if (isGardenMapLayout(image.layout)) {
              setEditingMapLayout(image.layout);
              setActiveView("mapBuilder");
            }
          }}
          onImportGardenState={replaceState}
        />
      )}
      {shouldShowMobileDetail && selection && (
        <MobileDetailDialog
          gardenState={gardenState}
          onAddPhoto={addPhoto}
          onClose={() => setSelection(null)}
          onDeleteSelection={(nextSelection) => {
            if (nextSelection.type === "plant") {
              deletePlant(nextSelection.id);
            } else if (nextSelection.type === "bed") {
              deleteBed(nextSelection.id);
            } else {
              deleteZone(nextSelection.id);
            }
            setSelection(null);
          }}
          onSaveBed={updateBed}
          onSavePlant={savePlant}
          onSaveZone={updateZone}
          selection={selection}
          suggestionService={suggestionService}
        />
      )}
    </AppShell>
  );
}

function useIsMobileViewport(): boolean {
  const query = "(max-width: 760px)";
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function isGardenMapLayout(value: unknown): value is GardenMapLayout {
  const candidate = value as Partial<GardenMapLayout> | undefined;
  return Boolean(candidate?.id && candidate.name && Array.isArray(candidate.elements));
}

function loadAiSettings(): AiSettings {
  const stored = localStorage.getItem("private-garden-ai-settings");
  if (!stored) {
    return defaultAiSettings;
  }

  try {
    return { ...defaultAiSettings, ...JSON.parse(stored) };
  } catch {
    return defaultAiSettings;
  }
}

function getPlantIdsWithTasksThisWeek(tasks: Array<{ dueDate?: string; plantId?: string; status: string }>): Set<string> {
  const today = new Date();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const weekAhead = todayTime + 7 * 24 * 60 * 60 * 1000;

  return new Set(
    tasks
      .filter((task) => task.status === "open" && task.plantId && task.dueDate)
      .filter((task) => {
        const [year, month, day] = String(task.dueDate).split("-").map(Number);
        const dueTime = new Date(year, month - 1, day).getTime();
        return dueTime >= todayTime && dueTime <= weekAhead;
      })
      .map((task) => String(task.plantId)),
  );
}

async function enterMapFocusDisplay() {
  try {
    await document.documentElement.requestFullscreen?.();
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (orientation: "landscape") => Promise<void>;
    };
    await orientation.lock?.("landscape");
  } catch {
    // Browser support varies, especially on iOS. The overlay still works if fullscreen or orientation lock is denied.
  }
}

async function exitMapFocusDisplay() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
  } catch {
    // Keep closing the in-app overlay even if the browser refuses to exit fullscreen programmatically.
  }
}

export default App;

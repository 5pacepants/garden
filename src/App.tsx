import { useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { useGardenState } from "./data/useGardenState";
import { GardenMap } from "./features/map/GardenMap";
import type { MapSelection } from "./features/map/mapSelection";
import { defaultPlantFilters, filterPlants, PlantFilters } from "./features/plants/PlantFilters";
import { PlantList } from "./features/plants/PlantList";
import { PlanningView } from "./features/planning/PlanningView";
import { CalendarView } from "./features/tasks/CalendarView";
import { TaskList } from "./features/tasks/TaskList";
import { HistoryTimeline } from "./features/history/HistoryTimeline";
import { PhotoHistory } from "./features/history/PhotoHistory";
import type { AppView } from "./components/Sidebar";
import { MockPlantSuggestionService } from "./ai/plantSuggestionService";
import { BrowserAiPlantSuggestionService } from "./ai/browserAiPlantSuggestionService";
import { type AiSettings, SettingsView } from "./features/settings/SettingsView";
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
  const [plantFilters, setPlantFilters] = useState(defaultPlantFilters);
  const [aiSettings, setAiSettings] = useState<AiSettings>(() => loadAiSettings());
  const tasks = gardenState?.tasks ?? [];
  const plants = gardenState?.plants ?? [];
  const plantIdsWithTasksThisWeek = useMemo(() => getPlantIdsWithTasksThisWeek(tasks), [tasks]);
  const filteredPlants = useMemo(
    () => filterPlants(plants, plantFilters, plantIdsWithTasksThisWeek),
    [plants, plantFilters, plantIdsWithTasksThisWeek],
  );
  const visiblePlantIds = useMemo(() => new Set(filteredPlants.map((plant) => plant.id)), [filteredPlants]);
  const suggestionService = useMemo(
    () =>
      aiSettings.enabled
        ? new BrowserAiPlantSuggestionService()
        : new MockPlantSuggestionService(),
    [aiSettings],
  );

  if (isLoading) {
    return <div className="loading-state">Läser trädgårdsdata...</div>;
  }

  if (error || !gardenState) {
    return <div className="loading-state error-state">{error ?? "Kunde inte läsa trädgårdsdata."}</div>;
  }

  function updateAiSettings(settings: AiSettings) {
    setAiSettings(settings);
    localStorage.setItem("private-garden-ai-settings", JSON.stringify(settings));
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
      onSaveBed={updateBed}
      onSavePlant={savePlant}
      onSaveZone={updateZone}
      onViewChange={setActiveView}
      selection={selection}
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
          selection={selection}
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
          onImportGardenState={replaceState}
        />
      )}
    </AppShell>
  );
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

export default App;

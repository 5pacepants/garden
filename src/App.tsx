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
import "./styles/app.css";

function App() {
  const {
    addBed,
    addHistoryEvent,
    addPhoto,
    addPlant,
    addTask,
    addZone,
    completeTask,
    gardenState,
    isLoading,
    error,
    updateBed,
    updatePlant,
    updateZone,
  } = useGardenState();
  const [activeView, setActiveView] = useState<AppView>("map");
  const [selection, setSelection] = useState<MapSelection>(null);
  const [plantFilters, setPlantFilters] = useState(defaultPlantFilters);

  if (isLoading) {
    return <div className="loading-state">Läser trädgårdsdata...</div>;
  }

  if (error || !gardenState) {
    return <div className="loading-state error-state">{error ?? "Kunde inte läsa trädgårdsdata."}</div>;
  }

  const plantIdsWithTasksThisWeek = getPlantIdsWithTasksThisWeek(gardenState.tasks);
  const filteredPlants = filterPlants(gardenState.plants, plantFilters, plantIdsWithTasksThisWeek);
  const visiblePlantIds = useMemo(() => new Set(filteredPlants.map((plant) => plant.id)), [filteredPlants]);

  return (
    <AppShell
      activeView={activeView}
      gardenState={gardenState}
      onUpdateBed={updateBed}
      onUpdatePlant={updatePlant}
      onUpdateZone={updateZone}
      onViewChange={setActiveView}
      selection={selection}
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
          <HistoryTimeline events={gardenState.historyEvents} onAddEvent={addHistoryEvent} />
          <PhotoHistory photos={gardenState.photos} onAddPhoto={addPhoto} />
        </>
      )}
      {activeView === "planning" && (
        <PlanningView plants={gardenState.plants} onSelectPlant={(id) => setSelection({ type: "plant", id })} />
      )}
      {activeView === "settings" && <section className="content-panel"><h2>Inställningar</h2><p>Backup, AI och kartbild kommer i kommande tasks.</p></section>}
    </AppShell>
  );
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

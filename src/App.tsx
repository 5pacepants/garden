import { useMemo, useState } from "react";
import { AppShell } from "./components/AppShell";
import { useGardenState } from "./data/useGardenState";
import { GardenMap } from "./features/map/GardenMap";
import type { MapSelection } from "./features/map/mapSelection";
import { defaultPlantFilters, filterPlants, PlantFilters } from "./features/plants/PlantFilters";
import { PlantList } from "./features/plants/PlantList";
import "./styles/app.css";

function App() {
  const { addBed, addPlant, addZone, gardenState, isLoading, error, updateBed, updatePlant, updateZone } = useGardenState();
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
      gardenState={gardenState}
      onUpdateBed={updateBed}
      onUpdatePlant={updatePlant}
      onUpdateZone={updateZone}
      selection={selection}
      tasks={gardenState.tasks}
    >
      <PlantFilters value={plantFilters} onChange={setPlantFilters} />
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
      <PlantList plants={filteredPlants} tasks={gardenState.tasks} onSelectPlant={(id) => setSelection({ type: "plant", id })} />
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

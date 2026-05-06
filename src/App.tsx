import { useState } from "react";
import { AppShell } from "./components/AppShell";
import { useGardenState } from "./data/useGardenState";
import { GardenMap } from "./features/map/GardenMap";
import type { MapSelection } from "./features/map/mapSelection";
import "./styles/app.css";

function App() {
  const { addBed, addPlant, addZone, gardenState, isLoading, error, updateBed, updatePlant, updateZone } = useGardenState();
  const [selection, setSelection] = useState<MapSelection>(null);

  if (isLoading) {
    return <div className="loading-state">Läser trädgårdsdata...</div>;
  }

  if (error || !gardenState) {
    return <div className="loading-state error-state">{error ?? "Kunde inte läsa trädgårdsdata."}</div>;
  }

  return (
    <AppShell
      gardenState={gardenState}
      onUpdateBed={updateBed}
      onUpdatePlant={updatePlant}
      onUpdateZone={updateZone}
      selection={selection}
      tasks={gardenState.tasks}
    >
      <GardenMap
        gardenState={gardenState}
        onAddBed={addBed}
        onAddPlant={addPlant}
        onAddZone={addZone}
        onSelectionChange={setSelection}
        selection={selection}
      />
    </AppShell>
  );
}

export default App;

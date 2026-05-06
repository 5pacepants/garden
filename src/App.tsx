import { useState } from "react";
import { AppShell } from "./components/AppShell";
import { useGardenState } from "./data/useGardenState";
import { GardenMap } from "./features/map/GardenMap";
import type { MapSelection } from "./features/map/mapSelection";
import "./styles/app.css";

function App() {
  const { gardenState, isLoading, error } = useGardenState();
  const [selection, setSelection] = useState<MapSelection>(null);

  if (isLoading) {
    return <div className="loading-state">Läser trädgårdsdata...</div>;
  }

  if (error || !gardenState) {
    return <div className="loading-state error-state">{error ?? "Kunde inte läsa trädgårdsdata."}</div>;
  }

  return (
    <AppShell gardenState={gardenState} selection={selection} tasks={gardenState.tasks}>
      <GardenMap gardenState={gardenState} onSelectionChange={setSelection} selection={selection} />
    </AppShell>
  );
}

export default App;

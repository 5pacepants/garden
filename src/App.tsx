import { AppShell } from "./components/AppShell";
import { relativeToWorldPoint } from "./domain/geometry";
import type { GardenState, Plant, Point } from "./domain/models";
import { useGardenState } from "./data/useGardenState";
import "./styles/app.css";

function App() {
  const { gardenState, isLoading, error } = useGardenState();

  if (isLoading) {
    return <div className="loading-state">Läser trädgårdsdata...</div>;
  }

  if (error || !gardenState) {
    return <div className="loading-state error-state">{error ?? "Kunde inte läsa trädgårdsdata."}</div>;
  }

  return (
    <AppShell tasks={gardenState.tasks}>
      <section className="map-placeholder" aria-label="Trädgårdskarta">
        <div className="map-grid">
          {gardenState.zones.map((zone) => (
            <div className="zone zone-sun" key={zone.id} style={boxStyle(zone.polygon)}>
              {zone.name}
            </div>
          ))}
          {gardenState.beds.map((bed) => (
            <div className="bed-shape" key={bed.id} style={boxStyle(bed.polygon)}>
              {bed.name}
            </div>
          ))}
          {gardenState.plants.map((plant) => {
            const position = getPlantWorldPosition(plant, gardenState);

            return (
              <button
                className={`plant-node ${plant.status}`}
                key={plant.id}
                style={{ left: `${position.x}%`, top: `${position.y}%` }}
                type="button"
                aria-label={plant.swedishName}
                title={plant.swedishName}
              />
            );
          })}
        </div>
        <div className="map-caption">
          <span className="eyebrow">Karta</span>
          <h2>{gardenState.map.name}</h2>
          <p>
            {gardenState.plants.length} växter, {gardenState.beds.length} rabatt och {gardenState.zones.length} zoner
            laddade från lokal lagring.
          </p>
        </div>
      </section>
    </AppShell>
  );
}

function getPlantWorldPosition(plant: Plant, gardenState: GardenState): Point {
  if (plant.placement.type === "map") {
    return plant.placement.position;
  }

  const bedPlacement = plant.placement;
  return relativeToWorldPoint(
    bedPlacement.relativePosition,
    gardenState.beds.find((bed) => bed.id === bedPlacement.bedId)?.polygon ?? [],
  );
}

function boxStyle(polygon: Array<{ x: number; y: number }>) {
  if (polygon.length === 0) {
    return undefined;
  }

  const xs = polygon.map((point) => point.x);
  const ys = polygon.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    left: `${minX}%`,
    top: `${minY}%`,
    width: `${maxX - minX}%`,
    height: `${maxY - minY}%`,
  };
}

export default App;

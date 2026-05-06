import type { Plant, Task } from "../../domain/models";

type PlantListProps = {
  plants: Plant[];
  tasks: Task[];
  onSelectPlant: (plantId: string) => void;
};

export function PlantList({ plants, tasks, onSelectPlant }: PlantListProps) {
  return (
    <section className="plant-list-panel" aria-label="Växtlista">
      <div className="list-header">
        <span className="eyebrow">Växter</span>
        <h2>{plants.length} matchar filter</h2>
      </div>
      <div className="plant-list">
        {plants.map((plant) => (
          <button className="plant-list-item" key={plant.id} onClick={() => onSelectPlant(plant.id)} type="button">
            <span>
              <strong>{plant.swedishName}</strong>
              <small>{plant.latinName ?? plant.type}</small>
            </span>
            <span className={`status-dot ${plant.status}`}>{plant.status}</span>
            <small>{getNextTaskLabel(plant.id, tasks)}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function getNextTaskLabel(plantId: string, tasks: Task[]): string {
  const nextTask = tasks
    .filter((task) => task.plantId === plantId && task.status === "open" && task.dueDate)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))[0];

  return nextTask ? `${nextTask.dueDate}: ${nextTask.title}` : "Ingen kommande uppgift";
}

import { plantStatusLabel, plantTypeLabel, priorityLabel } from "../../domain/labels";
import type { Plant } from "../../domain/models";

type PlanningViewProps = {
  plants: Plant[];
  onSelectPlant: (plantId: string) => void;
};

export function PlanningView({ plants, onSelectPlant }: PlanningViewProps) {
  const plannedPlants = plants.filter((plant) => plant.status === "planned" || plant.status === "wishlist");

  return (
    <section className="content-panel">
      <div className="list-header">
        <span className="eyebrow">Planering</span>
        <h2>{plannedPlants.length} planerade köp</h2>
      </div>
      {plannedPlants.length === 0 && <p className="helper-text">Här ser du växter du planerat till din trädgård.</p>}
      <div className="plant-list">
        {plannedPlants.map((plant) => (
          <button className="plant-list-item" key={plant.id} onClick={() => onSelectPlant(plant.id)} type="button">
            <span>
              <strong>{plant.swedishName}</strong>
              <small>{plant.latinName ?? plantTypeLabel(plant.type)}</small>
            </span>
            <span className={`status-dot ${plant.status}`}>{plantStatusLabel(plant.status)}</span>
            <small>
              {formatPrice(plant.purchaseInfo?.price)} · {plant.purchaseInfo?.store ?? "Ingen butik"} ·{" "}
              {priorityLabel(plant.purchaseInfo?.priority ?? "normal")}
            </small>
            {plant.purchaseInfo?.link && <small>{plant.purchaseInfo.link}</small>}
          </button>
        ))}
      </div>
    </section>
  );
}

function formatPrice(price: number | undefined): string {
  return typeof price === "number" ? `${price} kr` : "Inget pris";
}

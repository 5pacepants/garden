import type { Plant, PlantStatus, PlantType } from "../../domain/models";

type PlantCardProps = {
  plant: Plant;
  onChange: (plant: Plant) => void;
};

const plantStatuses: PlantStatus[] = ["existing", "planned", "wishlist", "removed"];
const plantTypes: PlantType[] = ["perennial", "shrub", "tree", "vegetable", "herb", "bulb", "grass", "other"];

export function PlantCard({ plant, onChange }: PlantCardProps) {
  return (
    <form className="editor-form">
      <label>
        Svenskt namn
        <input value={plant.swedishName} onChange={(event) => onChange({ ...plant, swedishName: event.target.value })} />
      </label>
      <label>
        Latinskt namn
        <input value={plant.latinName ?? ""} onChange={(event) => onChange({ ...plant, latinName: event.target.value })} />
      </label>
      <label>
        Status
        <select value={plant.status} onChange={(event) => onChange({ ...plant, status: event.target.value as PlantStatus })}>
          {plantStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label>
        Typ
        <select value={plant.type} onChange={(event) => onChange({ ...plant, type: event.target.value as PlantType })}>
          {plantTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label>
        Anteckningar
        <textarea value={plant.notes ?? ""} onChange={(event) => onChange({ ...plant, notes: event.target.value })} />
      </label>
    </form>
  );
}

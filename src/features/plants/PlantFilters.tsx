import { lightConditionLabel, moistureConditionLabel, plantStatusLabel, plantTypeLabel, tagLabel } from "../../domain/labels";
import type { LightCondition, MoistureCondition, Plant, PlantStatus, PlantType } from "../../domain/models";

export type PlantFilterState = {
  status: "all" | PlantStatus;
  type: "all" | PlantType;
  floweringMonth: "all" | number;
  tag: "all" | "edible" | "pollinator-friendly" | "evergreen";
  light: "all" | LightCondition;
  moisture: "all" | MoistureCondition;
  taskThisWeek: boolean;
};

type PlantFiltersProps = {
  value: PlantFilterState;
  onChange: (value: PlantFilterState) => void;
};

export const defaultPlantFilters: PlantFilterState = {
  status: "all",
  type: "all",
  floweringMonth: "all",
  tag: "all",
  light: "all",
  moisture: "all",
  taskThisWeek: false,
};

const statuses: Array<"all" | PlantStatus> = ["all", "existing", "planned", "wishlist", "removed"];
const types: Array<"all" | PlantType> = ["all", "perennial", "shrub", "tree", "vegetable", "herb", "bulb", "grass", "other"];
const lightOptions: Array<"all" | LightCondition> = ["all", "full_sun", "part_shade", "shade"];
const moistureOptions: Array<"all" | MoistureCondition> = ["all", "dry", "normal", "moist"];
const tagOptions: PlantFilterState["tag"][] = ["all", "edible", "pollinator-friendly", "evergreen"];

export function PlantFilters({ value, onChange }: PlantFiltersProps) {
  return (
    <div className="plant-filters" aria-label="Växtfilter">
      <select value={value.status} onChange={(event) => onChange({ ...value, status: event.target.value as PlantFilterState["status"] })}>
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status === "all" ? "Alla statusar" : plantStatusLabel(status)}
          </option>
        ))}
      </select>
      <select value={value.type} onChange={(event) => onChange({ ...value, type: event.target.value as PlantFilterState["type"] })}>
        {types.map((type) => (
          <option key={type} value={type}>
            {type === "all" ? "Alla typer" : plantTypeLabel(type)}
          </option>
        ))}
      </select>
      <select
        value={value.floweringMonth}
        onChange={(event) =>
          onChange({
            ...value,
            floweringMonth: event.target.value === "all" ? "all" : Number(event.target.value),
          })
        }
      >
        <option value="all">Alla blomningstider</option>
        {Array.from({ length: 12 }, (_, index) => index + 1).map((month) => (
          <option key={month} value={month}>
            Månad {month}
          </option>
        ))}
      </select>
      <select value={value.tag} onChange={(event) => onChange({ ...value, tag: event.target.value as PlantFilterState["tag"] })}>
        {tagOptions.map((tag) => (
          <option key={tag} value={tag}>
            {tag === "all" ? "Alla taggar" : tagLabel(tag)}
          </option>
        ))}
      </select>
      <select value={value.light} onChange={(event) => onChange({ ...value, light: event.target.value as PlantFilterState["light"] })}>
        {lightOptions.map((light) => (
          <option key={light} value={light}>
            {light === "all" ? "Alla ljuslägen" : lightConditionLabel(light)}
          </option>
        ))}
      </select>
      <select
        value={value.moisture}
        onChange={(event) => onChange({ ...value, moisture: event.target.value as PlantFilterState["moisture"] })}
      >
        {moistureOptions.map((moisture) => (
          <option key={moisture} value={moisture}>
            {moisture === "all" ? "Alla fuktlägen" : moistureConditionLabel(moisture)}
          </option>
        ))}
      </select>
      <label className="checkbox-filter">
        <input checked={value.taskThisWeek} onChange={(event) => onChange({ ...value, taskThisWeek: event.target.checked })} type="checkbox" />
        Uppgift denna vecka
      </label>
    </div>
  );
}

export function filterPlants(plants: Plant[], filters: PlantFilterState, plantIdsWithTasksThisWeek = new Set<string>()): Plant[] {
  return plants.filter((plant) => {
    if (filters.status !== "all" && plant.status !== filters.status) {
      return false;
    }

    if (filters.type !== "all" && plant.type !== filters.type) {
      return false;
    }

    if (filters.floweringMonth !== "all" && !plant.floweringMonths?.includes(filters.floweringMonth)) {
      return false;
    }

    if (filters.tag !== "all" && !plant.tags.includes(filters.tag)) {
      return false;
    }

    if (filters.light !== "all" && !plant.needs.light?.includes(filters.light)) {
      return false;
    }

    if (filters.moisture !== "all" && !plant.needs.moisture?.includes(filters.moisture)) {
      return false;
    }

    if (filters.taskThisWeek && !plantIdsWithTasksThisWeek.has(plant.id)) {
      return false;
    }

    return true;
  });
}

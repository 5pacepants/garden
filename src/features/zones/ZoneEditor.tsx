import type { LightCondition, MoistureCondition, Zone } from "../../domain/models";

type ZoneEditorProps = {
  zone: Zone;
  onChange: (zone: Zone) => void;
};

const lightOptions: Array<LightCondition | ""> = ["", "full_sun", "part_shade", "shade"];
const moistureOptions: Array<MoistureCondition | ""> = ["", "dry", "normal", "moist"];

export function ZoneEditor({ zone, onChange }: ZoneEditorProps) {
  return (
    <form className="editor-form">
      <label>
        Namn
        <input value={zone.name} onChange={(event) => onChange({ ...zone, name: event.target.value })} />
      </label>
      <label>
        Ljus
        <select
          value={zone.light ?? ""}
          onChange={(event) => onChange({ ...zone, light: emptyToUndefined(event.target.value) as LightCondition | undefined })}
        >
          {lightOptions.map((value) => (
            <option key={value || "none"} value={value}>
              {value || "Okänt"}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fukt
        <select
          value={zone.moisture ?? ""}
          onChange={(event) =>
            onChange({ ...zone, moisture: emptyToUndefined(event.target.value) as MoistureCondition | undefined })
          }
        >
          {moistureOptions.map((value) => (
            <option key={value || "none"} value={value}>
              {value || "Okänt"}
            </option>
          ))}
        </select>
      </label>
      <p className="helper-text">{zone.polygon.length} punkter i polygonen.</p>
    </form>
  );
}

function emptyToUndefined(value: string): string | undefined {
  return value === "" ? undefined : value;
}

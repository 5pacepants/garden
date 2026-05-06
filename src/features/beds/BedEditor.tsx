import type { Bed } from "../../domain/models";

type BedEditorProps = {
  bed: Bed;
  onChange: (bed: Bed) => void;
};

export function BedEditor({ bed, onChange }: BedEditorProps) {
  return (
    <form className="editor-form">
      <label>
        Namn
        <input value={bed.name} onChange={(event) => onChange({ ...bed, name: event.target.value })} />
      </label>
      <label>
        Anteckningar
        <textarea value={bed.notes ?? ""} onChange={(event) => onChange({ ...bed, notes: event.target.value })} />
      </label>
      <p className="helper-text">{bed.polygon.length} punkter i polygonen.</p>
    </form>
  );
}

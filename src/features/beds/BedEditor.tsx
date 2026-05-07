import { useEffect, useState } from "react";
import type { Bed } from "../../domain/models";

type BedEditorProps = {
  bed: Bed;
  onSave: (bed: Bed) => void;
};

export function BedEditor({ bed, onSave }: BedEditorProps) {
  const [draft, setDraft] = useState(bed);

  useEffect(() => {
    setDraft(bed);
  }, [bed]);

  return (
    <form className="editor-form">
      <label>
        Namn
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      </label>
      <label>
        Anteckningar
        <textarea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
      </label>
      <div className="editor-actions">
        <button onClick={() => onSave(draft)} type="button">Spara</button>
        <button className="secondary" onClick={() => setDraft(bed)} type="button">Avbryt</button>
      </div>
      <p className="helper-text">{bed.polygon.length} punkter i polygonen.</p>
    </form>
  );
}

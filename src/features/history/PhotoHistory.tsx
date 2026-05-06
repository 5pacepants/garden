import { createId } from "../../domain/ids";
import type { Photo } from "../../domain/models";

type PhotoHistoryProps = {
  photos: Photo[];
  onAddPhoto: (photo: Photo) => void;
};

export function PhotoHistory({ photos, onAddPhoto }: PhotoHistoryProps) {
  return (
    <section className="content-panel">
      <div className="list-header">
        <span className="eyebrow">Foto</span>
        <h2>{photos.length} bilder</h2>
      </div>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const label = String(form.get("label") ?? "").trim();
          if (!label) return;
          onAddPhoto({
            id: createId("photo"),
            label,
            date: String(form.get("date") || new Date().toISOString().slice(0, 10)),
            filePath: String(form.get("filePath") || undefined),
          });
          event.currentTarget.reset();
        }}
      >
        <input name="label" placeholder="Bildbeskrivning" />
        <input name="date" type="date" />
        <input name="filePath" placeholder="Fil/länk senare" />
        <button type="submit">Lägg till foto</button>
      </form>
      <div className="timeline">
        {photos.map((photo) => (
          <article className="timeline-item" key={photo.id}>
            <strong>{photo.date}: {photo.label}</strong>
            <small>{photo.filePath ?? "Ingen fil kopplad ännu"}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

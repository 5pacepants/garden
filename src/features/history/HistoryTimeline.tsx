import { createId } from "../../domain/ids";
import type { HistoryEvent, HistoryEventType } from "../../domain/models";

type HistoryTimelineProps = {
  events: HistoryEvent[];
  onAddEvent: (event: HistoryEvent) => void;
};

const eventTypes: HistoryEventType[] = ["planted", "moved", "pruned", "fertilized", "watered", "divided", "harvested", "problem", "frost_damage", "overwintering", "comment", "photo"];

export function HistoryTimeline({ events, onAddEvent }: HistoryTimelineProps) {
  return (
    <section className="content-panel">
      <div className="list-header">
        <span className="eyebrow">Historik</span>
        <h2>{events.length} händelser</h2>
      </div>
      <form
        className="inline-form"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const title = String(form.get("title") ?? "").trim();
          if (!title) return;
          onAddEvent({
            id: createId("history"),
            type: String(form.get("type")) as HistoryEventType,
            date: String(form.get("date") || new Date().toISOString().slice(0, 10)),
            title,
            comment: String(form.get("comment") || undefined),
          });
          event.currentTarget.reset();
        }}
      >
        <input name="title" placeholder="Ny historikhändelse" />
        <input name="date" type="date" />
        <select name="type" defaultValue="comment">
          {eventTypes.map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <input name="comment" placeholder="Kommentar" />
        <button type="submit">Logga</button>
      </form>
      <div className="timeline">
        {[...events].sort((a, b) => b.date.localeCompare(a.date)).map((event) => (
          <article className="timeline-item" key={event.id}>
            <strong>{event.date}: {event.title}</strong>
            <small>{event.type}{event.comment ? ` · ${event.comment}` : ""}</small>
          </article>
        ))}
      </div>
    </section>
  );
}

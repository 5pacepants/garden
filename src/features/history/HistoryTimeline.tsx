import { historyEventTypeLabel } from "../../domain/labels";
import { createId } from "../../domain/ids";
import type { HistoryEvent, HistoryEventType } from "../../domain/models";

type LinkedHistorySelection = {
  type: "plant" | "bed";
  id: string;
};

type HistoryTimelineProps = {
  events: HistoryEvent[];
  onAddEvent: (event: HistoryEvent) => void;
  onSelectLinkedObject?: (selection: LinkedHistorySelection) => void;
};

const eventTypes: HistoryEventType[] = ["planted", "moved", "pruned", "fertilized", "watered", "divided", "harvested", "problem", "frost_damage", "overwintering", "comment", "photo"];

export function HistoryTimeline({ events, onAddEvent, onSelectLinkedObject }: HistoryTimelineProps) {
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
            <option key={type} value={type}>{historyEventTypeLabel(type)}</option>
          ))}
        </select>
        <input name="comment" placeholder="Kommentar" />
        <button type="submit">Logga</button>
      </form>
      <div className="timeline">
        {[...events].sort((a, b) => b.date.localeCompare(a.date)).map((event) => {
          const linkedSelection = getLinkedSelection(event);
          const content = (
            <>
              <strong>{event.date}: {event.title}</strong>
              <small>{historyEventTypeLabel(event.type)}{event.comment ? ` · ${event.comment}` : ""}</small>
            </>
          );

          return linkedSelection && onSelectLinkedObject ? (
            <button className="timeline-item timeline-button" key={event.id} onClick={() => onSelectLinkedObject(linkedSelection)} type="button">
              {content}
            </button>
          ) : (
            <article className="timeline-item" key={event.id}>
              {content}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getLinkedSelection(event: HistoryEvent): LinkedHistorySelection | null {
  if (event.plantId) {
    return { type: "plant", id: event.plantId };
  }

  if (event.bedId) {
    return { type: "bed", id: event.bedId };
  }

  return null;
}

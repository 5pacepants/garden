import { groupTasksByCalendarDay } from "../../domain/careSchedule";
import type { Task } from "../../domain/models";

type CalendarViewProps = {
  tasks: Task[];
};

export function CalendarView({ tasks }: CalendarViewProps) {
  const grouped = groupTasksByCalendarDay(tasks.filter((task) => task.status === "open"));
  const days = Object.keys(grouped).sort();

  return (
    <section className="content-panel">
      <div className="list-header">
        <span className="eyebrow">Kalender</span>
        <h2>Kommande skötsel</h2>
      </div>
      <div className="calendar-list">
        {days.map((day) => (
          <article className="calendar-day" key={day}>
            <strong>{day}</strong>
            <ul>
              {grouped[day].map((task) => (
                <li key={task.id}>{task.title}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

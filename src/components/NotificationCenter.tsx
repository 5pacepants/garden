import type { Task } from "../domain/models";
import { selectTopNotifications } from "../domain/notifications";

type NotificationCenterProps = {
  tasks: Task[];
};

export function NotificationCenter({ tasks }: NotificationCenterProps) {
  const items = selectTopNotifications(tasks, new Date()).map((task) => task.title);
  const visibleItems = items.length > 0 ? items : ["Inga uppgifter kommande vecka"];

  return (
    <section className="notification-center" aria-label="Aktuella notiser">
      <div>
        <span className="eyebrow">Aktuellt</span>
        <h2>Den här veckan</h2>
      </div>
      <div className="notification-list">
        {visibleItems.map((item) => (
          <span className="notification-pill" key={item}>
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

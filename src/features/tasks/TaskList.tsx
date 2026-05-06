import type { Task } from "../../domain/models";
import { TaskEditor } from "./TaskEditor";

type TaskListProps = {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onCompleteTask: (taskId: string) => void;
};

export function TaskList({ tasks, onAddTask, onCompleteTask }: TaskListProps) {
  const openTasks = tasks.filter((task) => task.status === "open").sort(compareTasks);
  const completedTasks = tasks.filter((task) => task.status === "completed").sort(compareTasks);

  return (
    <section className="content-panel">
      <div className="list-header">
        <span className="eyebrow">Uppgifter</span>
        <h2>{openTasks.length} öppna</h2>
      </div>
      <TaskEditor onAddTask={onAddTask} />
      <div className="task-list">
        {openTasks.map((task) => (
          <article className="task-row" key={task.id}>
            <div>
              <strong>{task.title}</strong>
              <small>{task.dueDate ?? "Inget datum"} · {task.actionType} · {task.priority}</small>
            </div>
            <button onClick={() => onCompleteTask(task.id)} type="button">Klar</button>
          </article>
        ))}
      </div>
      {completedTasks.length > 0 && (
        <details className="completed-section">
          <summary>Avklarade ({completedTasks.length})</summary>
          {completedTasks.map((task) => (
            <div className="task-row muted" key={task.id}>{task.title}</div>
          ))}
        </details>
      )}
    </section>
  );
}

function compareTasks(a: Task, b: Task): number {
  return String(a.dueDate ?? "9999").localeCompare(String(b.dueDate ?? "9999"));
}

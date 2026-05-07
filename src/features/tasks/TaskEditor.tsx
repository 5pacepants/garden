import { careActionLabel, priorityLabel } from "../../domain/labels";
import { createId } from "../../domain/ids";
import type { CareActionType, Task } from "../../domain/models";

type TaskEditorProps = {
  onAddTask: (task: Task) => void;
};

const actionTypes: CareActionType[] = ["water", "prune", "fertilize", "plant", "move", "divide", "harvest", "weed", "inspect", "custom"];

export function TaskEditor({ onAddTask }: TaskEditorProps) {
  return (
    <form
      className="inline-form"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const title = String(form.get("title") ?? "").trim();
        if (!title) return;
        onAddTask({
          id: createId("task"),
          title,
          actionType: String(form.get("actionType")) as CareActionType,
          status: "open",
          priority: String(form.get("priority")) as Task["priority"],
          dueDate: String(form.get("dueDate") || undefined),
        });
        event.currentTarget.reset();
      }}
    >
      <input name="title" placeholder="Ny uppgift" />
      <input name="dueDate" type="date" />
      <select name="actionType" defaultValue="water">
        {actionTypes.map((type) => (
          <option key={type} value={type}>{careActionLabel(type)}</option>
        ))}
      </select>
      <select name="priority" defaultValue="normal">
        <option value="low">{priorityLabel("low")}</option>
        <option value="normal">{priorityLabel("normal")}</option>
        <option value="high">{priorityLabel("high")}</option>
      </select>
      <button type="submit">Lägg till</button>
    </form>
  );
}

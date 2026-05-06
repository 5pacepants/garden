import type { ReactNode } from "react";
import type { GardenState, Task } from "../domain/models";
import type { MapSelection } from "../features/map/mapSelection";
import { DetailPanel } from "./DetailPanel";
import { NotificationCenter } from "./NotificationCenter";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
  gardenState: GardenState | null;
  selection: MapSelection;
  tasks: Task[];
};

export function AppShell({ children, gardenState, selection, tasks }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="workspace">
        <NotificationCenter tasks={tasks} />
        {children}
      </main>
      <DetailPanel gardenState={gardenState} selection={selection} />
    </div>
  );
}

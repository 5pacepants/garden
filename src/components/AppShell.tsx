import type { ReactNode } from "react";
import type { Task } from "../domain/models";
import { DetailPanel } from "./DetailPanel";
import { NotificationCenter } from "./NotificationCenter";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
  tasks: Task[];
};

export function AppShell({ children, tasks }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="workspace">
        <NotificationCenter tasks={tasks} />
        {children}
      </main>
      <DetailPanel />
    </div>
  );
}

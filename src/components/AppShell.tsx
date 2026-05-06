import type { ReactNode } from "react";
import { DetailPanel } from "./DetailPanel";
import { NotificationCenter } from "./NotificationCenter";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="workspace">
        <NotificationCenter />
        {children}
      </main>
      <DetailPanel />
    </div>
  );
}

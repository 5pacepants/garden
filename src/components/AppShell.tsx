import type { ReactNode } from "react";
import type { Bed, GardenState, Plant, Task, Zone } from "../domain/models";
import type { MapSelection } from "../features/map/mapSelection";
import { DetailPanel } from "./DetailPanel";
import { NotificationCenter } from "./NotificationCenter";
import { Sidebar } from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
  gardenState: GardenState | null;
  onUpdateBed: (bed: Bed) => void;
  onUpdatePlant: (plant: Plant) => void;
  onUpdateZone: (zone: Zone) => void;
  selection: MapSelection;
  tasks: Task[];
};

export function AppShell({
  children,
  gardenState,
  onUpdateBed,
  onUpdatePlant,
  onUpdateZone,
  selection,
  tasks,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="workspace">
        <NotificationCenter tasks={tasks} />
        {children}
      </main>
      <DetailPanel
        gardenState={gardenState}
        onUpdateBed={onUpdateBed}
        onUpdatePlant={onUpdatePlant}
        onUpdateZone={onUpdateZone}
        selection={selection}
      />
    </div>
  );
}

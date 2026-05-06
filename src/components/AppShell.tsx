import type { ReactNode } from "react";
import type { Bed, GardenState, Plant, Task, Zone } from "../domain/models";
import type { MapSelection } from "../features/map/mapSelection";
import type { PlantSuggestionService } from "../ai/plantSuggestionService";
import { DetailPanel } from "./DetailPanel";
import { NotificationCenter } from "./NotificationCenter";
import { Sidebar, type AppView } from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
  activeView: AppView;
  gardenState: GardenState | null;
  onViewChange: (view: AppView) => void;
  onUpdateBed: (bed: Bed) => void;
  onUpdatePlant: (plant: Plant) => void;
  onUpdateZone: (zone: Zone) => void;
  selection: MapSelection;
  suggestionService: PlantSuggestionService;
  tasks: Task[];
};

export function AppShell({
  children,
  activeView,
  gardenState,
  onUpdateBed,
  onUpdatePlant,
  onUpdateZone,
  onViewChange,
  selection,
  suggestionService,
  tasks,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onViewChange={onViewChange} />
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
        suggestionService={suggestionService}
      />
    </div>
  );
}

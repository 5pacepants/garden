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
  onSaveBed: (bed: Bed) => void;
  onSavePlant: (plant: Plant) => void;
  onSaveZone: (zone: Zone) => void;
  selection: MapSelection;
  suggestionService: PlantSuggestionService;
  tasks: Task[];
};

export function AppShell({
  children,
  activeView,
  gardenState,
  onSaveBed,
  onSavePlant,
  onSaveZone,
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
        onSaveBed={onSaveBed}
        onSavePlant={onSavePlant}
        onSaveZone={onSaveZone}
        selection={selection}
        suggestionService={suggestionService}
      />
    </div>
  );
}

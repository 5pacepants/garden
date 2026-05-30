import type { ReactNode } from "react";
import type { Bed, GardenState, Photo, Plant, Task, Zone } from "../domain/models";
import type { MapSelection } from "../features/map/mapSelection";
import type { PlantSuggestionService } from "../ai/plantSuggestionService";
import { WeatherPanel } from "../features/weather/WeatherPanel";
import { DetailPanel } from "./DetailPanel";
import { NotificationCenter } from "./NotificationCenter";
import { Sidebar, type AppView } from "./Sidebar";

type AppShellProps = {
  children: ReactNode;
  activeView: AppView;
  gardenState: GardenState | null;
  onViewChange: (view: AppView) => void;
  onSaveBed: (bed: Bed) => void;
  onAddPhoto: (photo: Photo) => void;
  onSavePlant: (plant: Plant) => void;
  onSaveZone: (zone: Zone) => void;
  onDeleteSelection: (selection: NonNullable<MapSelection>) => void;
  selection: MapSelection;
  showDetailPanel?: boolean;
  suggestionService: PlantSuggestionService;
  tasks: Task[];
};

export function AppShell({
  children,
  activeView,
  gardenState,
  onSaveBed,
  onAddPhoto,
  onDeleteSelection,
  onSavePlant,
  onSaveZone,
  onViewChange,
  selection,
  showDetailPanel = true,
  suggestionService,
  tasks,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <Sidebar activeView={activeView} onViewChange={onViewChange} />
      <main className="workspace">
        <NotificationCenter tasks={tasks} />
        <WeatherPanel />
        {children}
      </main>
      {showDetailPanel && (
        <DetailPanel
          gardenState={gardenState}
          onAddPhoto={onAddPhoto}
          onDeleteSelection={onDeleteSelection}
          onSaveBed={onSaveBed}
          onSavePlant={onSavePlant}
          onSaveZone={onSaveZone}
          selection={selection}
          suggestionService={suggestionService}
        />
      )}
    </div>
  );
}

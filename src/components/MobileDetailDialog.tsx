import type { Bed, GardenState, Photo, Plant, Zone } from "../domain/models";
import type { MapSelection } from "../features/map/mapSelection";
import type { PlantSuggestionService } from "../ai/plantSuggestionService";
import { DetailPanel } from "./DetailPanel";

type MobileDetailDialogProps = {
  gardenState: GardenState;
  onAddPhoto: (photo: Photo) => void;
  onClose: () => void;
  onDeleteSelection: (selection: NonNullable<MapSelection>) => void;
  onSaveBed: (bed: Bed) => void;
  onSavePlant: (plant: Plant) => void;
  onSaveZone: (zone: Zone) => void;
  selection: NonNullable<MapSelection>;
  suggestionService: PlantSuggestionService;
};

export function MobileDetailDialog({
  gardenState,
  onAddPhoto,
  onClose,
  onDeleteSelection,
  onSaveBed,
  onSavePlant,
  onSaveZone,
  selection,
  suggestionService,
}: MobileDetailDialogProps) {
  return (
    <div
      aria-label="Växtinformation"
      aria-modal="true"
      className="mobile-detail-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      role="dialog"
    >
      <div className="mobile-detail-dialog">
        <div className="mobile-detail-header">
          <strong>Växtinformation</strong>
          <button className="tool-button" onClick={onClose} type="button">
            Stäng växtinformation
          </button>
        </div>
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
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import type { PlantSuggestionService } from "../../ai/plantSuggestionService";
import type { Bed, GardenState, Photo, Plant, Zone } from "../../domain/models";
import { plantStatusLabel, plantTypeLabel, tagLabel } from "../../domain/labels";
import { BedEditor } from "../beds/BedEditor";
import { PlantCard } from "../plants/PlantCard";
import { defaultPlantFilters } from "../plants/PlantFilters";
import { PlaceMatchPanel } from "../zones/PlaceMatchPanel";
import { ZoneEditor } from "../zones/ZoneEditor";
import { GardenMap } from "./GardenMap";
import type { MapSelection } from "./mapSelection";

type MapFocusOverlayProps = {
  gardenState: GardenState;
  selection: MapSelection;
  suggestionService: PlantSuggestionService;
  onAddBed: (bed: Bed) => void;
  onAddPhoto: (photo: Photo) => void;
  onAddPlant: (plant: Plant) => void;
  onAddZone: (zone: Zone) => void;
  onClose: () => void;
  onDeleteSelection: (selection: NonNullable<MapSelection>) => void;
  onSaveBed: (bed: Bed) => void;
  onSavePlant: (plant: Plant) => void;
  onSaveZone: (zone: Zone) => void;
  onSelectionChange: (selection: MapSelection) => void;
  onUpdateBed: (bed: Bed) => void;
  onUpdatePlant: (plant: Plant) => void;
  onUpdateZone: (zone: Zone) => void;
};

export function MapFocusOverlay({
  gardenState,
  selection,
  suggestionService,
  onAddBed,
  onAddPhoto,
  onAddPlant,
  onAddZone,
  onClose,
  onDeleteSelection,
  onSaveBed,
  onSavePlant,
  onSaveZone,
  onSelectionChange,
  onUpdateBed,
  onUpdatePlant,
  onUpdateZone,
}: MapFocusOverlayProps) {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setIsEditing(false);
  }, [selection]);

  return (
    <div aria-label="Kartläge" aria-modal="true" className="map-focus-overlay" role="dialog">
      <div className="map-focus-header">
        <strong>Kartläge</strong>
        <button className="tool-button" onClick={onClose} type="button">
          Stäng kartläge
        </button>
      </div>
      <div className="map-focus-layout">
        <div className="map-focus-map">
          <GardenMap
            gardenState={gardenState}
            plantFilters={defaultPlantFilters}
            visiblePlantIds={new Set(gardenState.plants.map((plant) => plant.id))}
            onAddBed={onAddBed}
            onAddPlant={onAddPlant}
            onAddZone={onAddZone}
            onUpdateBed={onUpdateBed}
            onUpdatePlant={onUpdatePlant}
            onUpdateZone={onUpdateZone}
            onSelectionChange={onSelectionChange}
            selection={selection}
          />
        </div>
        <aside className="map-focus-info" aria-label="Kartinformation">
          <MapFocusInfo
            gardenState={gardenState}
            isEditing={isEditing}
            selection={selection}
            suggestionService={suggestionService}
            onAddPhoto={onAddPhoto}
            onDeleteSelection={onDeleteSelection}
            onEdit={() => setIsEditing(true)}
            onSaveBed={onSaveBed}
            onSavePlant={onSavePlant}
            onSaveZone={onSaveZone}
          />
        </aside>
      </div>
    </div>
  );
}

type MapFocusInfoProps = {
  gardenState: GardenState;
  isEditing: boolean;
  selection: MapSelection;
  suggestionService: PlantSuggestionService;
  onAddPhoto: (photo: Photo) => void;
  onDeleteSelection: (selection: NonNullable<MapSelection>) => void;
  onEdit: () => void;
  onSaveBed: (bed: Bed) => void;
  onSavePlant: (plant: Plant) => void;
  onSaveZone: (zone: Zone) => void;
};

function MapFocusInfo({
  gardenState,
  isEditing,
  selection,
  suggestionService,
  onAddPhoto,
  onDeleteSelection,
  onEdit,
  onSaveBed,
  onSavePlant,
  onSaveZone,
}: MapFocusInfoProps) {
  if (!selection) {
    return (
      <>
        <span className="eyebrow">Info</span>
        <h2>Ingen vald</h2>
        <p className="helper-text">Tryck på en växt, rabatt eller zon i kartan.</p>
      </>
    );
  }

  if (selection.type === "plant") {
    const plant = gardenState.plants.find((item) => item.id === selection.id);
    if (!plant) return <MissingSelection />;
    return (
      <>
        <CompactPlantInfo plant={plant} />
        <PlaceMatchPanel gardenState={gardenState} selection={selection} />
        {!isEditing && <button className="tool-button primary" onClick={onEdit} type="button">Redigera</button>}
        {isEditing && (
          <PlantCard
            gardenState={gardenState}
            photos={gardenState.photos}
            plant={plant}
            suggestionService={suggestionService}
            onAddPhoto={onAddPhoto}
            onSave={onSavePlant}
          />
        )}
        <DeleteButton selection={selection} title={plant.swedishName} onDeleteSelection={onDeleteSelection} />
      </>
    );
  }

  if (selection.type === "bed") {
    const bed = gardenState.beds.find((item) => item.id === selection.id);
    if (!bed) return <MissingSelection />;
    return (
      <>
        <span className="eyebrow">Rabatt</span>
        <h2>{bed.name}</h2>
        <p className="helper-text">{bed.polygon.length} punkter i formen.</p>
        <PlaceMatchPanel gardenState={gardenState} selection={selection} />
        {!isEditing && <button className="tool-button primary" onClick={onEdit} type="button">Redigera</button>}
        {isEditing && <BedEditor bed={bed} onSave={onSaveBed} />}
        <DeleteButton selection={selection} title={bed.name} onDeleteSelection={onDeleteSelection} />
      </>
    );
  }

  const zone = gardenState.zones.find((item) => item.id === selection.id);
  if (!zone) return <MissingSelection />;
  return (
    <>
      <span className="eyebrow">Zon</span>
      <h2>{zone.name}</h2>
      <PlaceMatchPanel gardenState={gardenState} selection={selection} />
      {!isEditing && <button className="tool-button primary" onClick={onEdit} type="button">Redigera</button>}
      {isEditing && <ZoneEditor zone={zone} onSave={onSaveZone} />}
      <DeleteButton selection={selection} title={zone.name} onDeleteSelection={onDeleteSelection} />
    </>
  );
}

function CompactPlantInfo({ plant }: { plant: Plant }) {
  return (
    <>
      <span className="eyebrow">Växt</span>
      <h2>{plant.swedishName}</h2>
      <p>{plant.latinName ?? plantTypeLabel(plant.type)}</p>
      <div className="plant-chip-grid compact">
        <div className="plant-info-chip">
          <span>Status</span>
          <strong>{plantStatusLabel(plant.status)}</strong>
        </div>
        <div className="plant-info-chip">
          <span>Typ</span>
          <strong>{plantTypeLabel(plant.type)}</strong>
        </div>
      </div>
      {plant.tags.length > 0 && (
        <div aria-label="Taggar" className="map-focus-tag-list">
          {plant.tags.slice(0, 4).map((tag) => (
            <span className="map-focus-tag" key={tag}>
              {tagLabel(tag)}
            </span>
          ))}
        </div>
      )}
    </>
  );
}

function DeleteButton({
  selection,
  title,
  onDeleteSelection,
}: {
  selection: NonNullable<MapSelection>;
  title: string;
  onDeleteSelection: (selection: NonNullable<MapSelection>) => void;
}) {
  return (
    <button
      className="delete-object-button"
      onClick={() => {
        if (window.confirm(`Ta bort ${title}?`)) {
          onDeleteSelection(selection);
        }
      }}
      type="button"
    >
      Ta bort
    </button>
  );
}

function MissingSelection() {
  return (
    <>
      <span className="eyebrow">Info</span>
      <h2>Saknas</h2>
      <p className="helper-text">Det valda objektet finns inte kvar.</p>
    </>
  );
}

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GardenState } from "../../src/domain/models";
import { MapFocusOverlay } from "../../src/features/map/MapFocusOverlay";
import { UnavailablePlantSuggestionService } from "../../src/ai/unavailablePlantSuggestionService";

const gardenState: GardenState = {
  version: 1,
  map: { id: "map-1", name: "Karta", backgroundImage: "/bakgrund.png" },
  beds: [],
  zones: [],
  plants: [
    {
      id: "plant-1",
      swedishName: "Lavendel",
      latinName: "Lavandula angustifolia",
      status: "planned",
      type: "perennial",
      placement: { type: "map", position: { x: 18, y: 20 } },
      needs: {},
      tags: ["pollinator-friendly", "ground_cover"],
      careSchedule: [],
    },
  ],
  tasks: [],
  historyEvents: [],
  photos: [],
};

const baseProps = {
  gardenState,
  onAddBed: vi.fn(),
  onAddPhoto: vi.fn(),
  onAddPlant: vi.fn(),
  onAddZone: vi.fn(),
  onClose: vi.fn(),
  onDeleteSelection: vi.fn(),
  onSaveBed: vi.fn(),
  onSavePlant: vi.fn(),
  onSaveZone: vi.fn(),
  onSelectionChange: vi.fn(),
  onUpdateBed: vi.fn(),
  onUpdatePlant: vi.fn(),
  onUpdateZone: vi.fn(),
  suggestionService: new UnavailablePlantSuggestionService(),
};

describe("MapFocusOverlay", () => {
  it("shows the map in focus mode with a compact selected plant panel", () => {
    render(<MapFocusOverlay {...baseProps} selection={{ type: "plant", id: "plant-1" }} />);

    expect(screen.getByRole("dialog", { name: "Kartläge" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Stäng kartläge" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lavendel" })).toBeInTheDocument();
    expect(screen.getByText("Lavandula angustifolia")).toBeInTheDocument();
    expect(screen.getByText("Pollinatörsvänlig")).toHaveClass("map-focus-tag");
    expect(screen.getByText("Marktäckare")).toHaveClass("map-focus-tag");
    expect(screen.queryByText("ground_cover")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Redigera" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Svenskt namn")).not.toBeInTheDocument();
  });

  it("opens the full plant card only after the user asks to edit", () => {
    render(<MapFocusOverlay {...baseProps} selection={{ type: "plant", id: "plant-1" }} />);

    expect(screen.queryByLabelText("Växtöversikt")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Redigera" }));

    expect(screen.getByLabelText("Växtöversikt")).toBeInTheDocument();
  });
});

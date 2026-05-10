import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GardenState, Plant } from "../../src/domain/models";
import { PlantCard } from "../../src/features/plants/PlantCard";

const plant: Plant = {
  id: "plant-1",
  swedishName: "Lavendel",
  status: "planned",
  type: "perennial",
  placement: { type: "map", position: { x: 10, y: 10 } },
  needs: {},
  tags: [],
  careSchedule: [],
};

const gardenState: GardenState = {
  version: 1,
  map: { id: "map-1", name: "Testkarta" },
  beds: [],
  zones: [],
  plants: [plant],
  tasks: [],
  historyEvents: [],
  photos: [],
};

describe("PlantCard", () => {
  it("shows plant details first and opens editing explicitly", async () => {
    const user = userEvent.setup();

    render(
      <PlantCard
        plant={{
          ...plant,
          needs: { light: ["sun"], moisture: ["moist"] },
          floweringMonths: [6, 7],
          tags: ["pollinator-friendly"],
        }}
        gardenState={gardenState}
        suggestionService={{ suggestPlant: vi.fn() }}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByText("Sol")).toBeInTheDocument();
    expect(screen.queryByLabelText("Svenskt namn")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Redigera" }));

    expect(screen.getByLabelText("Svenskt namn")).toBeInTheDocument();
  });

  it("does not save edited fields until Save is clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <PlantCard
        plant={plant}
        gardenState={gardenState}
        suggestionService={{ suggestPlant: vi.fn() }}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Redigera" }));

    const nameInput = screen.getByLabelText("Svenskt namn");
    await user.clear(nameInput);
    await user.type(nameInput, "Stappsalvia");

    expect(onSave).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Spara" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ swedishName: "Stappsalvia" }));
  });

  it("saves care schedule rows with the main save button", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <PlantCard
        plant={plant}
        gardenState={gardenState}
        suggestionService={{ suggestPlant: vi.fn() }}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Redigera" }));
    await user.selectOptions(screen.getByLabelText("Upprepning"), "weekly");
    await user.click(screen.getByLabelText("Juni"));
    await user.click(screen.getByLabelText("Juli"));
    await user.type(screen.getByLabelText("Skötselråd"), "Vattna rejält.");
    await user.click(screen.getByRole("button", { name: "Lägg till skötselråd" }));

    expect(onSave).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Spara" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        careSchedule: [
          expect.objectContaining({
            instructions: "Vattna rejält.",
            timing: { type: "recurring", unit: "week", interval: 1, months: [6, 7] },
          }),
        ],
      }),
    );
  });

  it("saves a newly added care row even when save is clicked immediately", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <PlantCard
        plant={plant}
        gardenState={gardenState}
        suggestionService={{ suggestPlant: vi.fn() }}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Redigera" }));
    fireEvent.change(screen.getByLabelText("Skötselråd"), { target: { value: "Vattna varje vecka." } });
    fireEvent.click(screen.getByRole("button", { name: "Lägg till skötselråd" }));
    fireEvent.click(screen.getByRole("button", { name: "Spara" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        careSchedule: [
          expect.objectContaining({
            instructions: "Vattna varje vecka.",
            timing: { type: "recurring", unit: "week", interval: 1, months: [] },
          }),
        ],
      }),
    );
  });

  it("saves flowering months, tags, light and moisture settings for filtering", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <PlantCard
        plant={plant}
        gardenState={gardenState}
        suggestionService={{ suggestPlant: vi.fn() }}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Redigera" }));
    await user.click(screen.getByLabelText("Blommar i juni"));
    await user.click(screen.getByLabelText("Pollinatörsvänlig"));
    await user.click(screen.getByLabelText("Halvsol"));
    await user.click(screen.getByLabelText("Fuktig"));
    await user.click(screen.getByRole("button", { name: "Spara" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        floweringMonths: [6],
        tags: ["pollinator-friendly"],
        needs: expect.objectContaining({
          light: ["half_sun"],
          moisture: ["moist"],
        }),
      }),
    );
  });

  it("stores AI plant text as plant information without replacing personal notes", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <PlantCard
        plant={{ ...plant, notes: "Skadad gren." }}
        gardenState={gardenState}
        suggestionService={{
          suggestPlant: vi.fn().mockResolvedValue({
            swedishName: "Lavendel",
            latinName: "Lavandula angustifolia",
            type: "perennial",
            needs: { light: ["sun"], moisture: ["dry"], soilTraits: ["well_drained"] },
            floweringMonths: [7, 8],
            heightCm: 45,
            widthCm: 45,
            tags: ["pollinator-friendly"],
            plantInfo: "Trivs soligt och väldränerat.",
            notes: "AI ska inte skriva här.",
            careSchedule: [],
          }),
        }}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Redigera" }));
    await user.click(screen.getByRole("button", { name: "Föreslå växtdata" }));
    await screen.findByDisplayValue("Trivs soligt och väldränerat.");
    await user.click(screen.getByRole("button", { name: "Spara" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: "Skadad gren.",
        plantInfo: "Trivs soligt och väldränerat.",
      }),
    );
  });

  it("shows and saves harvest months only for edible plants", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    const { rerender } = render(
      <PlantCard
        plant={plant}
        gardenState={gardenState}
        suggestionService={{ suggestPlant: vi.fn() }}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Redigera" }));
    expect(screen.queryByText("Ätmognad")).not.toBeInTheDocument();

    await user.click(screen.getByLabelText("Ätbar"));
    expect(screen.getByText("Ätmognad")).toBeInTheDocument();
    await user.click(screen.getByLabelText("Ätmogen i augusti"));
    await user.click(screen.getByLabelText("Ätmogen i september"));
    await user.click(screen.getByRole("button", { name: "Spara" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ["edible"],
        harvestMonths: [8, 9],
      }),
    );

    rerender(
      <PlantCard
        plant={{ ...plant, tags: ["edible"], harvestMonths: [8, 9] }}
        gardenState={gardenState}
        suggestionService={{ suggestPlant: vi.fn() }}
        onSave={onSave}
      />,
    );

    expect(screen.getByText("aug, sep")).toBeInTheDocument();
  });

  it("applies AI edible tag and harvest months for fruiting plants", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <PlantCard
        plant={plant}
        gardenState={gardenState}
        suggestionService={{
          suggestPlant: vi.fn().mockResolvedValue({
            swedishName: "Äppelträd",
            latinName: "Malus domestica",
            type: "tree",
            needs: { light: ["sun"], moisture: ["normal"], soilTraits: ["well_drained"] },
            floweringMonths: [5],
            harvestMonths: [8, 9, 10],
            heightCm: 350,
            widthCm: 250,
            tags: ["edible"],
            plantInfo: "Ger ätbar frukt.",
            careSchedule: [],
          }),
        }}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Redigera" }));
    await user.click(screen.getByRole("button", { name: "Föreslå växtdata" }));
    await screen.findByDisplayValue("Ger ätbar frukt.");
    await user.click(screen.getByRole("button", { name: "Spara" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        tags: ["edible"],
        harvestMonths: [8, 9, 10],
      }),
    );
  });
});

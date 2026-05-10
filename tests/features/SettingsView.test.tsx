import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GardenState } from "../../src/domain/models";
import { SettingsView } from "../../src/features/settings/SettingsView";

const gardenState: GardenState = {
  version: 1,
  map: { id: "map-1", name: "Testkarta" },
  beds: [],
  zones: [],
  plants: [],
  tasks: [],
  historyEvents: [],
  photos: [],
};

describe("SettingsView", () => {
  it("updates the garden background after storing a picked image", async () => {
    const user = userEvent.setup();
    const onImportGardenState = vi.fn();

    render(
      <SettingsView
        aiSettings={{ enabled: false }}
        gardenState={gardenState}
        mediaService={{
          pickAndStoreImage: async () => ({
            reference: "appmedia://garden.jpg",
            fileName: "garden.jpg",
            url: "asset://localhost/garden.jpg",
          }),
          resolveMediaUrl: async () => "asset://localhost/garden.jpg",
        }}
        onAiSettingsChange={vi.fn()}
        onImportGardenState={onImportGardenState}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Byt kartbild" }));

    expect(onImportGardenState).toHaveBeenCalledWith({
      ...gardenState,
      map: { ...gardenState.map, backgroundImage: "appmedia://garden.jpg" },
    });
    expect(await screen.findByText("Kartbild uppdaterad.")).toBeInTheDocument();
  });
});

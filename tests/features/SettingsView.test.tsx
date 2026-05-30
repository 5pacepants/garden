import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GardenState } from "../../src/domain/models";
import { SettingsView } from "../../src/features/settings/SettingsView";

const gardenState: GardenState = {
  version: 1,
  map: { id: "map-1", name: "Testkarta" },
  mapImages: [],
  beds: [],
  zones: [],
  plants: [],
  tasks: [],
  historyEvents: [],
  photos: [],
};

describe("SettingsView", () => {
  it("uses consumer-friendly smart suggestion wording", () => {
    render(
      <SettingsView
        aiSettings={{ enabled: true }}
        gardenState={gardenState}
        onAiSettingsChange={vi.fn()}
        onImportGardenState={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "Inställningar" })).toBeInTheDocument();
    expect(screen.getByLabelText("Smarta förslag")).toBeChecked();
    expect(screen.getByText("Smarta förslag kan hjälpa till med växtinformation när funktionen är tillgänglig.")).toBeInTheDocument();
    expect(screen.queryByText(/OpenAI/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/API/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\.env\.local/i)).not.toBeInTheDocument();
  });

  it("keeps backup tools in an advanced section", () => {
    render(
      <SettingsView
        aiSettings={{ enabled: false }}
        gardenState={gardenState}
        onAiSettingsChange={vi.fn()}
        onImportGardenState={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Avancerat" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Exportera JSON" })).not.toBeInTheDocument();
  });

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
      mapImages: [
        expect.objectContaining({
          image: "appmedia://garden.jpg",
          name: "garden.jpg",
          source: "uploaded",
        }),
      ],
    });
    expect(await screen.findByText("Kartbild uppdaterad.")).toBeInTheDocument();
  });

  it("lists saved map images and lets the user apply or edit editable ones", async () => {
    const user = userEvent.setup();
    const onImportGardenState = vi.fn();
    const onEditMapImage = vi.fn();
    const savedState: GardenState = {
      ...gardenState,
      mapImages: [
        {
          id: "map-image-1",
          name: "Skissad trÃ¤dgÃ¥rd",
          image: "data:image/svg+xml,builder",
          source: "builder",
          createdAt: "2026-05-11T08:00:00.000Z",
          layout: { id: "layout-1", name: "Skissad trÃ¤dgÃ¥rd", elements: [] },
        },
      ],
    };

    render(
      <SettingsView
        aiSettings={{ enabled: false }}
        gardenState={savedState}
        onAiSettingsChange={vi.fn()}
        onEditMapImage={onEditMapImage}
        onImportGardenState={onImportGardenState}
      />,
    );

    expect(screen.getByRole("heading", { name: "Mina kartbilder" })).toBeInTheDocument();
    expect(screen.getByText("Skissad trÃ¤dgÃ¥rd")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Anv.nd Skissad/ }));
    expect(onImportGardenState).toHaveBeenCalledWith({
      ...savedState,
      map: { ...savedState.map, backgroundImage: "data:image/svg+xml,builder" },
    });

    await user.click(screen.getByRole("button", { name: /Redigera Skissad/ }));
    expect(onEditMapImage).toHaveBeenCalledWith(savedState.mapImages![0]);
  });

  it("does not show edit controls for AI-generated map images", () => {
    const savedState: GardenState = {
      ...gardenState,
      mapImages: [
        {
          id: "map-image-ai",
          name: "AI-karta",
          image: "data:image/png;base64,ai",
          source: "ai",
          createdAt: "2026-05-11T08:00:00.000Z",
          layout: { id: "old-bug-layout", name: "Gammal layout", elements: [] },
        },
      ],
    };

    render(
      <SettingsView
        aiSettings={{ enabled: false }}
        gardenState={savedState}
        onAiSettingsChange={vi.fn()}
        onImportGardenState={vi.fn()}
      />,
    );

    expect(screen.getByText("AI-karta")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Redigera AI-karta" })).not.toBeInTheDocument();
  });

  it("previews a saved map image before applying it", async () => {
    const user = userEvent.setup();
    const savedState: GardenState = {
      ...gardenState,
      mapImages: [
        {
          id: "map-image-ai",
          name: "AI-karta",
          image: "data:image/png;base64,ai",
          source: "ai",
          createdAt: "2026-05-11T08:00:00.000Z",
        },
      ],
    };

    render(
      <SettingsView
        aiSettings={{ enabled: false }}
        gardenState={savedState}
        onAiSettingsChange={vi.fn()}
        onImportGardenState={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Visa AI-karta" }));

    const preview = screen.getByRole("img", { name: "AI-karta" });
    expect(preview).toHaveAttribute("src", "data:image/png;base64,ai");
    expect(screen.getByRole("heading", { name: "AI-karta" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /St.ng visning/ }));
    expect(screen.queryByRole("img", { name: "AI-karta" })).not.toBeInTheDocument();
  });

  it("resolves stored map image references before previewing them", async () => {
    const user = userEvent.setup();
    const savedState: GardenState = {
      ...gardenState,
      mapImages: [
        {
          id: "map-image-ai",
          name: "AI-karta",
          image: "indexeddb://map-images/map-image-ai",
          source: "ai",
          createdAt: "2026-05-11T08:00:00.000Z",
        },
      ],
    };

    render(
      <SettingsView
        aiSettings={{ enabled: false }}
        gardenState={savedState}
        mediaService={{
          pickAndStoreImage: async () => null,
          resolveMediaUrl: async () => "data:image/png;base64,resolved",
        }}
        onAiSettingsChange={vi.fn()}
        onImportGardenState={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Visa AI-karta" }));

    expect(await screen.findByRole("img", { name: "AI-karta" })).toHaveAttribute("src", "data:image/png;base64,resolved");
  });
});

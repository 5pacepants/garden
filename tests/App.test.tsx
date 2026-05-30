import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import App from "../src/App";
import type { GardenState } from "../src/domain/models";

const gardenStateWithPlant: GardenState = {
  version: 1,
  map: { id: "map-1", name: "Testkarta", backgroundImage: "/bakgrund.png" },
  beds: [],
  zones: [],
  plants: [
    {
      id: "plant-1",
      swedishName: "Lavendel",
      latinName: "Lavandula angustifolia",
      status: "planned",
      type: "perennial",
      placement: { type: "map", position: { x: 24, y: 30 } },
      needs: {},
      tags: [],
      careSchedule: [],
    },
  ],
  tasks: [],
  historyEvents: [],
  photos: [],
};

afterEach(() => {
  localStorage.clear();
  delete window.matchMedia;
});

describe("App", () => {
  it("renders the garden map after loading local data", async () => {
    render(<App />);

    expect(await screen.findByText("Min trädgård")).toBeInTheDocument();
  });

  it("opens selected plant details in a dismissable mobile popup from the plant list", async () => {
    const user = userEvent.setup();
    mockMobileViewport();
    localStorage.setItem("private-garden-state", JSON.stringify(gardenStateWithPlant));

    render(<App />);

    await user.click(await screen.findByRole("button", { name: "Växter" }));
    await user.click(screen.getByRole("button", { name: /Lavendel/ }));

    const dialog = screen.getByRole("dialog", { name: "Växtinformation" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { level: 2, name: "Lavendel" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Stäng växtinformation" }));

    expect(screen.queryByRole("dialog", { name: "Växtinformation" })).not.toBeInTheDocument();
  });

  it("opens selected plant details in the same mobile popup from the regular map", async () => {
    mockMobileViewport();
    localStorage.setItem("private-garden-state", JSON.stringify(gardenStateWithPlant));

    const { container } = render(<App />);
    await screen.findByRole("heading", { name: "Testkarta" });

    const plantNode = await waitFor(() => {
      const node = container.querySelector(".plant-circle");
      expect(node).not.toBeNull();
      return node as Element;
    });
    fireEvent.click(plantNode);

    const dialog = screen.getByRole("dialog", { name: "Växtinformation" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { level: 2, name: "Lavendel" })).toBeInTheDocument();
  });
});

function mockMobileViewport() {
  window.matchMedia = ((query: string) => ({
    matches: query === "(max-width: 760px)",
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { GardenState } from "../../src/domain/models";
import { MapBuilderView } from "../../src/features/mapBuilder/MapBuilderView";

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

describe("MapBuilderView", () => {
  it("adds a house and applies the generated SVG as map background", async () => {
    const user = userEvent.setup();
    const onApplyGardenState = vi.fn();

    render(<MapBuilderView gardenState={gardenState} onApplyGardenState={onApplyGardenState} />);

    await user.click(screen.getByRole("button", { name: "Lägg till hus" }));
    expect(screen.getByRole("button", { name: "Hus" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Använd som kartbild" }));

    expect(onApplyGardenState).toHaveBeenCalledWith(
      expect.objectContaining({
        map: expect.objectContaining({
          backgroundImage: expect.stringMatching(/^data:image\/svg\+xml,/),
        }),
      }),
    );
  });
});

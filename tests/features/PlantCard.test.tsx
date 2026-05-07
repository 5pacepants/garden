import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Plant } from "../../src/domain/models";
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

describe("PlantCard", () => {
  it("does not save edited fields until Save is clicked", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <PlantCard
        plant={plant}
        suggestionService={{ suggestPlant: vi.fn() }}
        onSave={onSave}
      />,
    );

    const nameInput = screen.getByLabelText("Svenskt namn");
    await user.clear(nameInput);
    await user.type(nameInput, "Stäppsalvia");

    expect(onSave).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Spara" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ swedishName: "Stäppsalvia" }));
  });
});

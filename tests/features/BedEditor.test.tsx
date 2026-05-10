import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BedEditor } from "../../src/features/beds/BedEditor";

describe("BedEditor", () => {
  it("saves soil traits for a bed", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <BedEditor
        bed={{ id: "bed-1", name: "Rabatt", polygon: [], notes: "" }}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByLabelText("Väldränerad"));
    await user.click(screen.getByRole("button", { name: "Spara" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ soilTraits: ["well_drained"] }));
  });
});

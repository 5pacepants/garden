import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ZoneEditor } from "../../src/features/zones/ZoneEditor";

describe("ZoneEditor", () => {
  it("saves soil traits for a zone", async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <ZoneEditor
        zone={{ id: "zone-1", name: "Solzon", polygon: [] }}
        onSave={onSave}
      />,
    );

    await user.click(screen.getByLabelText("Humusrik"));
    await user.click(screen.getByRole("button", { name: "Spara" }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ soilTraits: ["humus_rich"] }));
  });
});

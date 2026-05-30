import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "../../src/components/Sidebar";

describe("Sidebar", () => {
  it("renders primary navigation and switches views", async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();

    render(<Sidebar activeView="map" onViewChange={onViewChange} />);

    expect(screen.getByRole("navigation", { name: "Huvudnavigation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Karta", current: "page" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /V.xter/ }));

    expect(onViewChange).toHaveBeenCalledWith("plants");
  });
});

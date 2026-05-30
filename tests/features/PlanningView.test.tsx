import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PlanningView } from "../../src/features/planning/PlanningView";

describe("PlanningView", () => {
  it("shows clear empty-state copy for planned garden plants", () => {
    render(<PlanningView plants={[]} onSelectPlant={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "0 planerade köp" })).toBeInTheDocument();
    expect(screen.getByText("Här ser du växter du planerat till din trädgård.")).toBeInTheDocument();
    expect(screen.queryByText(/idéer/i)).not.toBeInTheDocument();
  });
});

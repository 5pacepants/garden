import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "../src/App";

describe("App", () => {
  it("renders the garden map after loading local data", async () => {
    render(<App />);

    expect(await screen.findByText("Min trädgård")).toBeInTheDocument();
  });
});

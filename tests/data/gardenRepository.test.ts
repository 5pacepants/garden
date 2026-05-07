import { beforeEach, describe, expect, it } from "vitest";
import { createDemoGardenState } from "../../src/domain/fixtures";
import { exportGardenState, importGardenState } from "../../src/data/importExport";
import { LocalStorageGardenRepository } from "../../src/data/localStorageGardenRepository";

describe("garden repository", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads an empty house map state when no stored state exists", async () => {
    const repository = new LocalStorageGardenRepository("garden-test");

    const state = await repository.load();

    expect(state.version).toBe(1);
    expect(state.map.name).toBe("Min trädgård");
    expect(state.map.backgroundImage).toBe("/bakgrund.png");
    expect(state.plants).toHaveLength(0);
    expect(state.beds).toHaveLength(0);
    expect(state.zones).toHaveLength(0);
  });

  it("removes only known demo map objects when loading stored demo data", async () => {
    const repository = new LocalStorageGardenRepository("garden-test");
    const state = createDemoGardenState();
    state.plants.push({
      id: "plant-user",
      swedishName: "Min växt",
      status: "planned",
      type: "perennial",
      placement: { type: "map", position: { x: 12, y: 12 } },
      needs: {},
      tags: [],
      careSchedule: [],
    });

    localStorage.setItem("garden-test", repository.exportJson(state));

    const loaded = await repository.load();

    expect(loaded.map.backgroundImage).toBe("/bakgrund.png");
    expect(loaded.plants.map((plant) => plant.id)).toEqual(["plant-user"]);
    expect(loaded.beds).toHaveLength(0);
    expect(loaded.zones).toHaveLength(0);
    expect(loaded.tasks).toHaveLength(0);
    expect(loaded.historyEvents).toHaveLength(0);
  });

  it("saves and loads garden state", async () => {
    const repository = new LocalStorageGardenRepository("garden-test");
    const state = createDemoGardenState();
    state.map.name = "Uppdaterad trädgård";

    await repository.save(state);

    const loaded = await repository.load();
    expect(loaded.map.name).toBe("Uppdaterad trädgård");
  });

  it("exports state as versioned JSON", () => {
    const json = exportGardenState(createDemoGardenState());

    expect(JSON.parse(json).version).toBe(1);
  });

  it("imports valid state JSON", () => {
    const original = createDemoGardenState();
    original.map.name = "Importerad";

    const imported = importGardenState(JSON.stringify(original));

    expect(imported.map.name).toBe("Importerad");
  });

  it("rejects unsupported versions", () => {
    expect(() => importGardenState(JSON.stringify({ version: 999 }))).toThrow("Unsupported garden data version");
  });

  it("rejects invalid JSON", () => {
    expect(() => importGardenState("not json")).toThrow("Could not parse garden data");
  });
});

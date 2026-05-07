import { describe, expect, it } from "vitest";
import {
  careActionLabel,
  historyEventTypeLabel,
  lightConditionLabel,
  moistureConditionLabel,
  plantStatusLabel,
  plantTypeLabel,
  priorityLabel,
  taskStatusLabel,
} from "../../src/domain/labels";

describe("Swedish labels", () => {
  it("labels plant statuses in Swedish", () => {
    expect(plantStatusLabel("existing")).toBe("Befintlig");
    expect(plantStatusLabel("planned")).toBe("Planerad");
    expect(plantStatusLabel("wishlist")).toBe("Önskelista");
    expect(plantStatusLabel("removed")).toBe("Borttagen");
  });

  it("labels common garden values in Swedish", () => {
    expect(plantTypeLabel("perennial")).toBe("Perenner");
    expect(lightConditionLabel("full_sun")).toBe("Full sol");
    expect(moistureConditionLabel("moist")).toBe("Fuktig");
    expect(priorityLabel("high")).toBe("Hög");
    expect(careActionLabel("plant")).toBe("Plantera");
    expect(taskStatusLabel("completed")).toBe("Klar");
    expect(historyEventTypeLabel("planted")).toBe("Planterad");
  });
});

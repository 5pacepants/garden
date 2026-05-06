import type { GardenState } from "./models";

export function createDemoGardenState(): GardenState {
  return {
    version: 1,
    map: {
      id: "map_main",
      name: "Min trädgård",
    },
    zones: [
      {
        id: "zone_sunny_front",
        name: "Solig framsida",
        polygon: [
          { x: 5, y: 10 },
          { x: 65, y: 10 },
          { x: 60, y: 55 },
          { x: 10, y: 58 },
        ],
        light: "full_sun",
        moisture: "normal",
        soilTraits: ["well_drained"],
      },
      {
        id: "zone_shady_hedge",
        name: "Skugga vid häcken",
        polygon: [
          { x: 62, y: 8 },
          { x: 95, y: 8 },
          { x: 94, y: 70 },
          { x: 58, y: 58 },
        ],
        light: "part_shade",
        moisture: "moist",
        soilTraits: ["humus_rich"],
      },
    ],
    beds: [
      {
        id: "bed_front_border",
        name: "Framsida rabatt",
        polygon: [
          { x: 22, y: 30 },
          { x: 56, y: 26 },
          { x: 61, y: 54 },
          { x: 26, y: 60 },
        ],
      },
    ],
    plants: [
      {
        id: "plant_echinacea",
        swedishName: "Röd solhatt",
        latinName: "Echinacea purpurea",
        status: "existing",
        type: "perennial",
        placement: {
          type: "bed",
          bedId: "bed_front_border",
          relativePosition: { x: 0.42, y: 0.52 },
        },
        needs: {
          light: ["full_sun"],
          moisture: ["normal", "dry"],
          soilTraits: ["well_drained"],
        },
        floweringMonths: [7, 8, 9],
        size: { heightCm: 90, widthCm: 45 },
        tags: ["pollinator-friendly"],
        careSchedule: [
          {
            id: "care_echinacea_prune",
            plantId: "plant_echinacea",
            actionType: "prune",
            timing: { type: "date", month: 5, day: 1 },
            instructions: "Klipp ner fjolårets stjälkar.",
            priority: "normal",
            taskMode: "suggested",
            source: "manual",
          },
        ],
      },
      {
        id: "plant_lavender_plan",
        swedishName: "Lavendel",
        latinName: "Lavandula angustifolia",
        status: "planned",
        type: "shrub",
        placement: {
          type: "map",
          position: { x: 50, y: 44 },
        },
        needs: {
          light: ["full_sun"],
          moisture: ["dry"],
          soilTraits: ["well_drained"],
        },
        floweringMonths: [7, 8],
        size: { heightCm: 45, widthCm: 60 },
        tags: ["pollinator-friendly", "fragrant"],
        purchaseInfo: {
          priority: "high",
          price: 129,
          store: "Plantskola",
        },
        careSchedule: [
          {
            id: "care_lavender_weekly",
            plantId: "plant_lavender_plan",
            actionType: "water",
            timing: { type: "weekly", startMonth: 6, endMonth: 8, intervalWeeks: 1 },
            instructions: "Vattna vid etablering, låt torka upp mellan gångerna.",
            priority: "normal",
            taskMode: "suggested",
            source: "manual",
          },
        ],
      },
      {
        id: "plant_currant",
        swedishName: "Röda vinbär",
        latinName: "Ribes rubrum",
        status: "wishlist",
        type: "shrub",
        placement: {
          type: "map",
          position: { x: 74, y: 38 },
        },
        needs: {
          light: ["full_sun", "part_shade"],
          moisture: ["normal", "moist"],
        },
        floweringMonths: [5],
        tags: ["edible"],
        careSchedule: [
          {
            id: "care_currant_harvest",
            plantId: "plant_currant",
            actionType: "harvest",
            timing: { type: "month", month: 7 },
            instructions: "Skörda när bären är jämnt röda.",
            priority: "normal",
            taskMode: "suggested",
            source: "manual",
          },
        ],
      },
    ],
    tasks: [
      {
        id: "task_prune_echinacea",
        title: "Beskär röd solhatt",
        actionType: "prune",
        status: "open",
        dueDate: "2026-05-01",
        priority: "normal",
        plantId: "plant_echinacea",
        sourceCareRuleId: "care_echinacea_prune",
      },
      {
        id: "task_plan_lavender",
        title: "Bestäm plats för lavendel",
        actionType: "plant",
        status: "open",
        dueDate: "2026-05-10",
        priority: "high",
        plantId: "plant_lavender_plan",
      },
    ],
    historyEvents: [
      {
        id: "history_echinacea_planted",
        type: "planted",
        date: "2025-05-18",
        title: "Planterade röd solhatt",
        plantId: "plant_echinacea",
      },
      {
        id: "history_front_note",
        type: "comment",
        date: "2026-04-20",
        title: "Rabatten rensad",
        comment: "Mycket kirskål i framkant.",
        bedId: "bed_front_border",
      },
    ],
    photos: [],
  };
}

export const plantSuggestionJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "swedishName",
    "latinName",
    "type",
    "needs",
    "floweringMonths",
    "harvestMonths",
    "heightCm",
    "widthCm",
    "tags",
    "plantInfo",
    "careSchedule",
  ],
  properties: {
    swedishName: { type: "string" },
    latinName: { type: ["string", "null"] },
    type: { enum: ["perennial", "shrub", "tree", "vegetable", "herb", "bulb", "grass", "other"] },
    needs: {
      type: "object",
      additionalProperties: false,
      required: ["light", "moisture", "soilTraits"],
      properties: {
        light: { type: "array", items: { enum: ["sun", "half_sun", "part_shade", "shade"] } },
        moisture: { type: "array", items: { enum: ["dry", "normal", "moist"] } },
        soilTraits: { type: "array", items: { enum: ["clay", "sandy", "well_drained", "humus_rich"] } },
      },
    },
    floweringMonths: { type: "array", items: { type: "integer", minimum: 1, maximum: 12 } },
    harvestMonths: { type: "array", items: { type: "integer", minimum: 1, maximum: 12 } },
    heightCm: { type: ["integer", "null"], minimum: 1 },
    widthCm: { type: ["integer", "null"], minimum: 1 },
    tags: { type: "array", items: { type: "string" } },
    plantInfo: { type: ["string", "null"] },
    careSchedule: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["actionType", "timing", "instructions", "priority", "taskMode", "source"],
        properties: {
          actionType: { enum: ["water", "prune", "fertilize", "plant", "move", "divide", "harvest", "weed", "inspect", "custom"] },
          timing: {
            type: "object",
            additionalProperties: true,
          },
          instructions: { type: "string" },
          priority: { enum: ["low", "normal", "high"] },
          taskMode: { enum: ["automatic", "suggested"] },
          source: { enum: ["manual", "ai"] },
        },
      },
    },
  },
} as const;

export const plantNameSuggestionsJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["suggestions"],
  properties: {
    suggestions: { type: "array", items: { type: "string" }, maxItems: 6 },
  },
} as const;

export const plantRecommendationsJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["recommendations"],
  properties: {
    recommendations: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["swedishName", "latinName", "reason", "type", "light", "moisture", "tags"],
        properties: {
          swedishName: { type: "string" },
          latinName: { type: ["string", "null"] },
          reason: { type: "string" },
          type: { enum: ["perennial", "shrub", "tree", "vegetable", "herb", "bulb", "grass", "other"] },
          light: { type: "array", items: { enum: ["sun", "half_sun", "part_shade", "shade"] } },
          moisture: { type: "array", items: { enum: ["dry", "normal", "moist"] } },
          tags: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

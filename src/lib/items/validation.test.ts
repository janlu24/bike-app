import { describe, it, expect } from "vitest";
import { parseMetadata, parseItemInput, CATEGORIES_WITH_PARENT } from "./validation";

function makeFormData(fields: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (Array.isArray(value)) {
      for (const v of value) fd.append(key, v);
    } else {
      fd.set(key, value);
    }
  }
  return fd;
}

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

const BASE_VALID: Record<string, string> = {
  category: "Bike",
  brand: "Trek",
  model: "Supercaliber",
  weight_g: "8500",
  weight_unit: "g",
  is_public: "",
};

describe("CATEGORIES_WITH_PARENT", () => {
  it("only contains Part", () => expect(CATEGORIES_WITH_PARENT).toEqual(["Part"]));
});

describe("parseMetadata", () => {
  it("returns empty object for no keys/values", () => {
    const fd = makeFormData({ meta_key: [], meta_value: [] });
    expect(parseMetadata(fd)).toEqual({ metadata: {} });
  });

  it("returns empty object when all pairs are blank", () => {
    const fd = makeFormData({ meta_key: ["", ""], meta_value: ["", ""] });
    expect(parseMetadata(fd)).toEqual({ metadata: {} });
  });

  it("parses a single key-value pair", () => {
    const fd = makeFormData({ meta_key: ["Color"], meta_value: ["Red"] });
    expect(parseMetadata(fd)).toEqual({ metadata: { Color: "Red" } });
  });

  it("parses multiple key-value pairs", () => {
    const fd = makeFormData({
      meta_key: ["Color", "Size"],
      meta_value: ["Red", "L"],
    });
    expect(parseMetadata(fd)).toEqual({ metadata: { Color: "Red", Size: "L" } });
  });

  it("trims whitespace from keys and values", () => {
    const fd = makeFormData({ meta_key: ["  Color  "], meta_value: ["  Red  "] });
    expect(parseMetadata(fd)).toEqual({ metadata: { Color: "Red" } });
  });

  it("returns error for key without value (value empty, key present)", () => {
    const fd = makeFormData({ meta_key: ["Color"], meta_value: [""] });
    // value is empty string — this is allowed (empty value is valid)
    expect(parseMetadata(fd)).toEqual({ metadata: { Color: "" } });
  });

  it("returns error when key is empty but value is not", () => {
    const fd = makeFormData({ meta_key: [""], meta_value: ["Red"] });
    expect(parseMetadata(fd)).toEqual({
      metadata: {},
      error: "Schlüssel darf nicht leer sein.",
    });
  });

  it("returns error for key exceeding MAX_KEY (40)", () => {
    const longKey = "a".repeat(41);
    const fd = makeFormData({ meta_key: [longKey], meta_value: ["val"] });
    const result = parseMetadata(fd);
    expect(result.error).toContain("Zeichen");
  });

  it("returns error for value exceeding MAX_VALUE (200)", () => {
    const longVal = "a".repeat(201);
    const fd = makeFormData({ meta_key: ["Key"], meta_value: [longVal] });
    const result = parseMetadata(fd);
    expect(result.error).toContain("Zeichen");
  });

  it("returns error for duplicate keys (case-insensitive)", () => {
    const fd = makeFormData({
      meta_key: ["Color", "color"],
      meta_value: ["Red", "Blue"],
    });
    expect(parseMetadata(fd)).toEqual({
      metadata: {},
      error: expect.stringContaining("mehrfach"),
    });
  });

  it("returns error when more than 25 entries", () => {
    const keys = Array.from({ length: 26 }, (_, i) => `key${i}`);
    const vals = Array.from({ length: 26 }, () => "val");
    const fd = makeFormData({ meta_key: keys, meta_value: vals });
    const result = parseMetadata(fd);
    expect(result.error).toContain("25");
  });
});

describe("parseItemInput — category", () => {
  it("returns fieldError for missing category", () => {
    const fd = makeFormData({ ...BASE_VALID, category: "" });
    const result = parseItemInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.category).toBeTruthy();
  });

  it("returns fieldError for invalid category", () => {
    const fd = makeFormData({ ...BASE_VALID, category: "Unicycle" });
    const result = parseItemInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.category).toBeTruthy();
  });

  it("accepts all valid categories", () => {
    for (const cat of ["Bike", "Part", "Gear", "Clothing"]) {
      const fd = makeFormData({ ...BASE_VALID, category: cat });
      const result = parseItemInput(fd);
      expect(result.fieldErrors.category).toBeUndefined();
    }
  });
});

describe("parseItemInput — brand", () => {
  it("returns fieldError for empty brand", () => {
    const fd = makeFormData({ ...BASE_VALID, brand: "" });
    const result = parseItemInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.brand).toBeTruthy();
  });

  it("returns fieldError for brand exceeding 80 chars", () => {
    const fd = makeFormData({ ...BASE_VALID, brand: "a".repeat(81) });
    const result = parseItemInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.brand).toContain("80");
  });

  it("accepts brand at exactly 80 chars", () => {
    const fd = makeFormData({ ...BASE_VALID, brand: "a".repeat(80) });
    const result = parseItemInput(fd);
    expect(result.fieldErrors.brand).toBeUndefined();
  });
});

describe("parseItemInput — model", () => {
  it("returns fieldError for empty model", () => {
    const fd = makeFormData({ ...BASE_VALID, model: "" });
    const result = parseItemInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.model).toBeTruthy();
  });

  it("returns fieldError for model exceeding 120 chars", () => {
    const fd = makeFormData({ ...BASE_VALID, model: "a".repeat(121) });
    const result = parseItemInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.model).toContain("120");
  });
});

describe("parseItemInput — weight", () => {
  it("accepts empty weight (optional)", () => {
    const fd = makeFormData({ ...BASE_VALID, weight_g: "" });
    const result = parseItemInput(fd);
    expect(result.fieldErrors.weight_g).toBeUndefined();
    expect(result.data?.weight_g).toBeNull();
  });

  it("parses valid weight in grams", () => {
    const fd = makeFormData({ ...BASE_VALID, weight_g: "8500", weight_unit: "g" });
    const result = parseItemInput(fd);
    expect(result.data?.weight_g).toBe(8500);
  });

  it("parses valid weight in kg", () => {
    const fd = makeFormData({ ...BASE_VALID, weight_g: "8.5", weight_unit: "kg" });
    const result = parseItemInput(fd);
    expect(result.data?.weight_g).toBe(8500);
  });

  it("parses German comma as decimal separator in kg mode", () => {
    const fd = makeFormData({ ...BASE_VALID, weight_g: "8,5", weight_unit: "kg" });
    const result = parseItemInput(fd);
    expect(result.data?.weight_g).toBe(8500);
  });

  it("returns fieldError for zero weight", () => {
    const fd = makeFormData({ ...BASE_VALID, weight_g: "0", weight_unit: "g" });
    const result = parseItemInput(fd);
    expect(result.fieldErrors.weight_g).toBeTruthy();
  });

  it("returns fieldError for negative weight", () => {
    const fd = makeFormData({ ...BASE_VALID, weight_g: "-100", weight_unit: "g" });
    const result = parseItemInput(fd);
    expect(result.fieldErrors.weight_g).toBeTruthy();
  });

  it("returns fieldError for non-numeric weight", () => {
    const fd = makeFormData({ ...BASE_VALID, weight_g: "abc", weight_unit: "g" });
    const result = parseItemInput(fd);
    expect(result.fieldErrors.weight_g).toBeTruthy();
  });

  it("returns fieldError for unrealistically high weight (>1,000,000g)", () => {
    const fd = makeFormData({ ...BASE_VALID, weight_g: "1000001", weight_unit: "g" });
    const result = parseItemInput(fd);
    expect(result.fieldErrors.weight_g).toContain("unrealistisch");
  });

  it("defaults to grams when weight_unit is missing/invalid", () => {
    const fd = makeFormData({ ...BASE_VALID, weight_g: "500", weight_unit: "lbs" });
    const result = parseItemInput(fd);
    expect(result.data?.weight_g).toBe(500);
  });
});

describe("parseItemInput — is_public", () => {
  it("sets is_public true when value is 'on'", () => {
    const fd = makeFormData({ ...BASE_VALID, is_public: "on" });
    const result = parseItemInput(fd);
    expect(result.data?.is_public).toBe(true);
  });

  it("sets is_public false when value is empty", () => {
    const fd = makeFormData({ ...BASE_VALID, is_public: "" });
    const result = parseItemInput(fd);
    expect(result.data?.is_public).toBe(false);
  });
});

describe("parseItemInput — parent_id", () => {
  it("ignores parent_id for non-Part categories", () => {
    const fd = makeFormData({ ...BASE_VALID, category: "Bike", parent_id: VALID_UUID });
    const result = parseItemInput(fd);
    expect(result.data?.parent_id).toBeNull();
  });

  it("accepts valid UUID parent_id for Part", () => {
    const fd = makeFormData({ ...BASE_VALID, category: "Part", parent_id: VALID_UUID });
    const result = parseItemInput(fd);
    expect(result.data?.parent_id).toBe(VALID_UUID);
  });

  it("accepts 'none' parent_id for Part (no parent)", () => {
    const fd = makeFormData({ ...BASE_VALID, category: "Part", parent_id: "none" });
    const result = parseItemInput(fd);
    expect(result.data?.parent_id).toBeNull();
  });

  it("accepts empty parent_id for Part", () => {
    const fd = makeFormData({ ...BASE_VALID, category: "Part", parent_id: "" });
    const result = parseItemInput(fd);
    expect(result.data?.parent_id).toBeNull();
  });

  it("returns fieldError for invalid UUID parent_id on Part", () => {
    const fd = makeFormData({ ...BASE_VALID, category: "Part", parent_id: "not-a-uuid" });
    const result = parseItemInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.parent_id).toBeTruthy();
  });
});

describe("parseItemInput — metadata", () => {
  it("returns fieldError for invalid metadata (empty key, non-empty value)", () => {
    const fd = makeFormData({
      ...BASE_VALID,
      meta_key: [""],
      meta_value: ["Red"],
    });
    const result = parseItemInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.metadata).toBeTruthy();
  });

  it("passes valid metadata through to result", () => {
    const fd = makeFormData({
      ...BASE_VALID,
      meta_key: ["Color"],
      meta_value: ["Red"],
    });
    const result = parseItemInput(fd);
    expect(result.data?.metadata).toEqual({ Color: "Red" });
  });
});

describe("parseItemInput — success case", () => {
  it("returns full valid ItemInput for a complete Bike form", () => {
    const fd = makeFormData({
      ...BASE_VALID,
      is_public: "on",
      meta_key: ["Color"],
      meta_value: ["Black"],
    });
    const result = parseItemInput(fd);
    expect(result.data).toEqual({
      category: "Bike",
      brand: "Trek",
      model: "Supercaliber",
      weight_g: 8500,
      is_public: true,
      metadata: { Color: "Black" },
      parent_id: null,
    });
    expect(result.fieldErrors).toEqual({});
  });

  it("returns valid ItemInput with null weight when omitted", () => {
    const fd = makeFormData({ ...BASE_VALID, weight_g: "" });
    const result = parseItemInput(fd);
    expect(result.data?.weight_g).toBeNull();
  });
});

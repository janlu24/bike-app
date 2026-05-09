import { describe, it, expect } from "vitest";
import {
  parseGroupInput,
  parsePropagationDecisions,
  computeGroupDiff,
  isValidGroupId,
} from "./validation";

function makeFormData(entries: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) {
    if (Array.isArray(v)) {
      for (const item of v) fd.append(k, item);
    } else {
      fd.set(k, v);
    }
  }
  return fd;
}

// ---------------------------------------------------------------------------
// parseGroupInput
// ---------------------------------------------------------------------------

describe("parseGroupInput — valid", () => {
  it("accepts a minimal valid group", () => {
    const fd = makeFormData({ category: "Gear", name: "Satteltaschen", property_key: ["Volumen"] });
    const result = parseGroupInput(fd);
    expect(result.data).toEqual({ category: "Gear", name: "Satteltaschen", property_keys: ["Volumen"] });
    expect(result.fieldErrors).toEqual({});
  });

  it("accepts multiple keys", () => {
    const fd = makeFormData({
      category: "Part",
      name: "Kettenblätter",
      property_key: ["Zähne", "BCD", "Material"],
    });
    const result = parseGroupInput(fd);
    expect(result.data?.property_keys).toEqual(["Zähne", "BCD", "Material"]);
  });

  it("trims whitespace from name and keys", () => {
    const fd = makeFormData({
      category: "Clothing",
      name: "  Helme  ",
      property_key: ["  Größe  ", "  Gewicht  "],
    });
    const result = parseGroupInput(fd);
    expect(result.data?.name).toBe("Helme");
    expect(result.data?.property_keys).toEqual(["Größe", "Gewicht"]);
  });

  it("silently drops empty key entries", () => {
    const fd = makeFormData({
      category: "Gear",
      name: "Pumpen",
      property_key: ["Druck", "", "  ", "Länge"],
    });
    const result = parseGroupInput(fd);
    expect(result.data?.property_keys).toEqual(["Druck", "Länge"]);
  });

  it("accepts exactly 25 keys", () => {
    const keys = Array.from({ length: 25 }, (_, i) => `Key${i + 1}`);
    const fd = makeFormData({ category: "Bike", name: "Rahmen", property_key: keys });
    const result = parseGroupInput(fd);
    expect(result.data?.property_keys).toHaveLength(25);
  });
});

describe("parseGroupInput — category errors", () => {
  it("rejects missing category", () => {
    const fd = makeFormData({ name: "Test", property_key: ["Key"] });
    const result = parseGroupInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.category).toBeDefined();
  });

  it("rejects invalid category value", () => {
    const fd = makeFormData({ category: "Shoes", name: "Test", property_key: ["Key"] });
    const result = parseGroupInput(fd);
    expect(result.fieldErrors.category).toBeDefined();
  });
});

describe("parseGroupInput — name errors", () => {
  it("rejects empty name", () => {
    const fd = makeFormData({ category: "Gear", name: "", property_key: ["Key"] });
    const result = parseGroupInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.name).toBeDefined();
  });

  it("rejects whitespace-only name", () => {
    const fd = makeFormData({ category: "Gear", name: "   ", property_key: ["Key"] });
    const result = parseGroupInput(fd);
    expect(result.fieldErrors.name).toBeDefined();
  });

  it("rejects name longer than 80 chars", () => {
    const fd = makeFormData({ category: "Gear", name: "A".repeat(81), property_key: ["Key"] });
    const result = parseGroupInput(fd);
    expect(result.fieldErrors.name).toBeDefined();
  });

  it("accepts name of exactly 80 chars", () => {
    const fd = makeFormData({ category: "Gear", name: "A".repeat(80), property_key: ["Key"] });
    const result = parseGroupInput(fd);
    expect(result.data).not.toBeNull();
  });
});

describe("parseGroupInput — property_keys errors", () => {
  it("rejects when no keys after filtering empty", () => {
    const fd = makeFormData({ category: "Gear", name: "Test", property_key: ["", "  "] });
    const result = parseGroupInput(fd);
    expect(result.fieldErrors.property_keys).toBeDefined();
  });

  it("rejects when no property_key field at all", () => {
    const fd = makeFormData({ category: "Gear", name: "Test" });
    const result = parseGroupInput(fd);
    expect(result.fieldErrors.property_keys).toBeDefined();
  });

  it("rejects more than 25 keys", () => {
    const keys = Array.from({ length: 26 }, (_, i) => `Key${i + 1}`);
    const fd = makeFormData({ category: "Gear", name: "Test", property_key: keys });
    const result = parseGroupInput(fd);
    expect(result.fieldErrors.property_keys).toBeDefined();
  });

  it("rejects key longer than 40 chars", () => {
    const fd = makeFormData({ category: "Gear", name: "Test", property_key: ["A".repeat(41)] });
    const result = parseGroupInput(fd);
    expect(result.fieldErrors.property_keys).toBeDefined();
  });

  it("accepts key of exactly 40 chars", () => {
    const fd = makeFormData({ category: "Gear", name: "Test", property_key: ["A".repeat(40)] });
    const result = parseGroupInput(fd);
    expect(result.data).not.toBeNull();
  });

  it("rejects duplicate keys (case-insensitive)", () => {
    const fd = makeFormData({ category: "Gear", name: "Test", property_key: ["Volumen", "volumen"] });
    const result = parseGroupInput(fd);
    expect(result.fieldErrors.property_keys).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// parsePropagationDecisions
// ---------------------------------------------------------------------------

describe("parsePropagationDecisions", () => {
  it("parses delete and keep decisions", () => {
    const fd = new FormData();
    fd.set("removed_key_decision[Farbe]", "delete");
    fd.set("removed_key_decision[Gewicht]", "keep");
    const result = parsePropagationDecisions(fd);
    expect(result.removedKeysDecision).toEqual({ Farbe: "delete", Gewicht: "keep" });
  });

  it("ignores invalid decision values", () => {
    const fd = new FormData();
    fd.set("removed_key_decision[Farbe]", "invalid");
    const result = parsePropagationDecisions(fd);
    expect(result.removedKeysDecision).toEqual({});
  });

  it("returns empty object when no decisions present", () => {
    const fd = new FormData();
    fd.set("name", "Test");
    const result = parsePropagationDecisions(fd);
    expect(result.removedKeysDecision).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// computeGroupDiff
// ---------------------------------------------------------------------------

describe("computeGroupDiff", () => {
  it("detects added keys", () => {
    const diff = computeGroupDiff(["A", "B"], ["A", "B", "C"]);
    expect(diff.added).toEqual(["C"]);
    expect(diff.removed).toEqual([]);
  });

  it("detects removed keys", () => {
    const diff = computeGroupDiff(["A", "B", "C"], ["A"]);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual(["B", "C"]);
  });

  it("detects both added and removed", () => {
    const diff = computeGroupDiff(["A", "B"], ["B", "C"]);
    expect(diff.added).toEqual(["C"]);
    expect(diff.removed).toEqual(["A"]);
  });

  it("returns empty diff for identical keys", () => {
    const diff = computeGroupDiff(["A", "B"], ["A", "B"]);
    expect(diff.added).toEqual([]);
    expect(diff.removed).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// isValidGroupId
// ---------------------------------------------------------------------------

describe("isValidGroupId", () => {
  it("accepts valid UUID v4", () => {
    expect(isValidGroupId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidGroupId("")).toBe(false);
  });

  it("rejects malformed UUID", () => {
    expect(isValidGroupId("not-a-uuid")).toBe(false);
  });
});

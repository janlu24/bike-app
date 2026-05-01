import { describe, it, expect } from "vitest";
import { aggregateCounts } from "./aggregate";
import type { ItemCategory } from "@/types/supabase";

function items(...categories: ItemCategory[]) {
  return categories.map((category) => ({ category }));
}

describe("aggregateCounts", () => {
  it("returns zero totals for empty array", () => {
    const result = aggregateCounts([]);
    expect(result.total).toBe(0);
    expect(result.byCategory).toEqual({ Bike: 0, Part: 0, Gear: 0, Clothing: 0 });
  });

  it("zero-fills all four categories even when none present", () => {
    const result = aggregateCounts(items("Bike"));
    expect(result.byCategory.Part).toBe(0);
    expect(result.byCategory.Gear).toBe(0);
    expect(result.byCategory.Clothing).toBe(0);
  });

  it("counts a single Bike", () => {
    const result = aggregateCounts(items("Bike"));
    expect(result.total).toBe(1);
    expect(result.byCategory.Bike).toBe(1);
  });

  it("counts multiple items across categories", () => {
    const result = aggregateCounts(items("Bike", "Bike", "Part", "Gear", "Clothing", "Clothing"));
    expect(result.total).toBe(6);
    expect(result.byCategory.Bike).toBe(2);
    expect(result.byCategory.Part).toBe(1);
    expect(result.byCategory.Gear).toBe(1);
    expect(result.byCategory.Clothing).toBe(2);
  });

  it("total equals sum of all byCategory values", () => {
    const result = aggregateCounts(items("Bike", "Part", "Part", "Gear"));
    const sum = Object.values(result.byCategory).reduce((a, b) => a + b, 0);
    expect(result.total).toBe(sum);
  });

  it("does not mutate input array", () => {
    const input = items("Bike", "Part");
    const frozen = Object.freeze(input);
    expect(() => aggregateCounts(frozen)).not.toThrow();
  });

  it("handles 100 items of same category", () => {
    const result = aggregateCounts(Array.from({ length: 100 }, () => ({ category: "Part" as ItemCategory })));
    expect(result.total).toBe(100);
    expect(result.byCategory.Part).toBe(100);
    expect(result.byCategory.Bike).toBe(0);
  });
});

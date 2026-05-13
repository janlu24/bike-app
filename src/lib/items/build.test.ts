import { describe, it, expect } from "vitest";
import { computeBuild } from "./build";
import type { ItemRow } from "@/types/supabase";

function makeItem(id: string, parentId: string | null, weightG: number | null): ItemRow {
  return { id, parent_id: parentId, weight_g: weightG } as unknown as ItemRow;
}

const BIKE_ID = "bike-1";
const bike = (weightG: number | null) => makeItem(BIKE_ID, null, weightG);
const part = (id: string, weightG: number | null) => makeItem(id, BIKE_ID, weightG);

describe("computeBuild — no linked parts", () => {
  it("returns partCount 0 and bike weight when bike has weight", () => {
    const b = bike(5000);
    const result = computeBuild(b, [b]);
    expect(result.partCount).toBe(0);
    expect(result.totalWeight).toBe(5000);
    expect(result.hasUnknownWeight).toBe(false);
    expect(result.parts).toHaveLength(0);
  });

  it("returns hasUnknownWeight true and totalWeight 0 when bike has no weight", () => {
    const b = bike(null);
    const result = computeBuild(b, [b]);
    expect(result.partCount).toBe(0);
    expect(result.totalWeight).toBe(0);
    expect(result.hasUnknownWeight).toBe(true);
  });
});

describe("computeBuild — linked parts, all weights known", () => {
  it("sums bike weight and all part weights", () => {
    const b = bike(5000);
    const p1 = part("p1", 300);
    const p2 = part("p2", 700);
    const result = computeBuild(b, [b, p1, p2]);
    expect(result.partCount).toBe(2);
    expect(result.totalWeight).toBe(6000);
    expect(result.hasUnknownWeight).toBe(false);
  });

  it("includes only parts whose parent_id matches the bike", () => {
    const b = bike(1000);
    const p1 = part("p1", 500);
    const otherBikePart = makeItem("other-part", "other-bike", 999);
    const result = computeBuild(b, [b, p1, otherBikePart]);
    expect(result.partCount).toBe(1);
    expect(result.totalWeight).toBe(1500);
    expect(result.parts).toEqual([p1]);
  });
});

describe("computeBuild — missing weights (hasUnknownWeight)", () => {
  it("sets hasUnknownWeight when bike weight is null, sums only parts", () => {
    const b = bike(null);
    const p1 = part("p1", 400);
    const p2 = part("p2", 600);
    const result = computeBuild(b, [b, p1, p2]);
    expect(result.hasUnknownWeight).toBe(true);
    expect(result.totalWeight).toBe(1000);
    expect(result.partCount).toBe(2);
  });

  it("sets hasUnknownWeight when some parts have null weight", () => {
    const b = bike(5000);
    const p1 = part("p1", 300);
    const p2 = part("p2", null);
    const result = computeBuild(b, [b, p1, p2]);
    expect(result.hasUnknownWeight).toBe(true);
    expect(result.totalWeight).toBe(5300);
  });

  it("sets hasUnknownWeight when all parts have null weight", () => {
    const b = bike(5000);
    const p1 = part("p1", null);
    const p2 = part("p2", null);
    const result = computeBuild(b, [b, p1, p2]);
    expect(result.hasUnknownWeight).toBe(true);
    expect(result.totalWeight).toBe(5000);
  });

  it("totalWeight is 0 and hasUnknownWeight true when every weight is null", () => {
    const b = bike(null);
    const p1 = part("p1", null);
    const result = computeBuild(b, [b, p1]);
    expect(result.hasUnknownWeight).toBe(true);
    expect(result.totalWeight).toBe(0);
  });
});

describe("computeBuild — self-reference protection", () => {
  it("excludes an item whose id equals the bike id even if parent_id matches", () => {
    const b = bike(1000);
    const selfRef = makeItem(BIKE_ID, BIKE_ID, 999);
    const result = computeBuild(b, [b, selfRef]);
    expect(result.partCount).toBe(0);
    expect(result.totalWeight).toBe(1000);
  });
});

describe("computeBuild — isolation between bikes", () => {
  it("does not include parts belonging to a different bike", () => {
    const b = bike(2000);
    const b2 = makeItem("bike-2", null, 3000);
    const p1 = part("p1", 500);
    const p2 = makeItem("p2", "bike-2", 500);
    const result = computeBuild(b, [b, b2, p1, p2]);
    expect(result.partCount).toBe(1);
    expect(result.parts).toEqual([p1]);
    expect(result.totalWeight).toBe(2500);
  });
});

describe("computeBuild — output structure", () => {
  it("returns the bike reference unchanged", () => {
    const b = bike(1000);
    const result = computeBuild(b, [b]);
    expect(result.bike).toBe(b);
  });

  it("does not mutate the input array", () => {
    const b = bike(1000);
    const p1 = part("p1", 200);
    const input = Object.freeze([b, p1]) as readonly ItemRow[];
    expect(() => computeBuild(b, input)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// PROJ-14: Nested / recursive weight (PROJ-11/12 sub-items)
// ---------------------------------------------------------------------------
describe("computeBuild — nested weight (PROJ-14)", () => {
  it("includes grandchild weights in totalWeight", () => {
    const b = bike(5000);
    const p1 = part("p1", 500);
    const child = makeItem("child1", "p1", 100);
    const result = computeBuild(b, [b, p1, child]);
    expect(result.totalWeight).toBe(5600);
  });

  it("parts list only contains first-level children, not grandchildren", () => {
    const b = bike(5000);
    const p1 = part("p1", 500);
    const child = makeItem("child1", "p1", 100);
    const result = computeBuild(b, [b, p1, child]);
    expect(result.parts).toHaveLength(1);
    expect(result.parts[0].id).toBe("p1");
  });

  it("handles three levels of nesting correctly", () => {
    const b = bike(1000);
    const p1 = part("p1", 100);
    const p2 = makeItem("p2", "p1", 50);
    const p3 = makeItem("p3", "p2", 25);
    const result = computeBuild(b, [b, p1, p2, p3]);
    expect(result.totalWeight).toBe(1175);
  });

  it("does not count sub-items of foreign bikes", () => {
    const b = bike(2000);
    const other = makeItem("bike2", null, 1000);
    const foreignPart = makeItem("fp", "bike2", 500);
    const foreignChild = makeItem("fc", "fp", 100);
    const result = computeBuild(b, [b, other, foreignPart, foreignChild]);
    expect(result.parts).toHaveLength(0);
    expect(result.totalWeight).toBe(2000);
  });
});

// ---------------------------------------------------------------------------
// PROJ-14: Cycle guard
// ---------------------------------------------------------------------------
describe("computeBuild — cycle guard (PROJ-14)", () => {
  it("does not throw on circular parent_id references", () => {
    const b = bike(1000);
    const pa = makeItem("pa", BIKE_ID, 100);
    const pb = makeItem("pb", "pa", 50);
    // Circular: pb's child points back to pa
    const pc = makeItem("pc", "pb", 25);
    const pcCycle = { ...pc, parent_id: "pa" };
    const items = [b, pa, pb, pcCycle];
    expect(() => computeBuild(b, items)).not.toThrow();
  });

  it("returns finite totalWeight even with cycles", () => {
    const b = bike(1000);
    const pa = makeItem("pa", BIKE_ID, 100);
    const pb = makeItem("pb", "pa", 50);
    const pcCycle = makeItem("pa", "pb", 25); // id collision forces cycle
    const result = computeBuild(b, [b, pa, pb, pcCycle]);
    expect(Number.isFinite(result.totalWeight)).toBe(true);
  });
});

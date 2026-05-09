import { describe, it, expect } from "vitest";
import { formatDuration, formatDistance, formatElevation, formatTourDate, getDisplayDistance } from "./utils";
import type { TourRow } from "@/types/supabase";

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------
describe("formatDuration", () => {
  it("returns '–' when both are null", () => {
    expect(formatDuration(null, null)).toBe("–");
  });

  it("returns minutes only when hours is 0 or null", () => {
    expect(formatDuration(0, 45)).toBe("45 min");
    expect(formatDuration(null, 45)).toBe("45 min");
  });

  it("returns hours only when minutes is 0 or null", () => {
    expect(formatDuration(3, 0)).toBe("3 h");
    expect(formatDuration(3, null)).toBe("3 h");
  });

  it("returns 'Xh Y min' for both non-zero", () => {
    expect(formatDuration(3, 45)).toBe("3h 45 min");
  });

  it("returns only minutes when hours is null and minutes is 0", () => {
    expect(formatDuration(null, 0)).toBe("0 min");
  });
});

// ---------------------------------------------------------------------------
// formatDistance
// ---------------------------------------------------------------------------
describe("formatDistance", () => {
  it("returns '–' for null", () => {
    expect(formatDistance(null)).toBe("–");
  });

  it("formats integer km", () => {
    expect(formatDistance(100)).toBe("100 km");
  });

  it("formats decimal km (max 1 decimal place)", () => {
    expect(formatDistance(85.55)).toBe("85,6 km");
  });

  it("formats 0 km", () => {
    expect(formatDistance(0)).toBe("0 km");
  });
});

// ---------------------------------------------------------------------------
// formatElevation
// ---------------------------------------------------------------------------
describe("formatElevation", () => {
  it("returns '–' for null", () => {
    expect(formatElevation(null)).toBe("–");
  });

  it("formats elevation in meters", () => {
    expect(formatElevation(1200)).toBe("1.200 m");
  });

  it("formats 0 m", () => {
    expect(formatElevation(0)).toBe("0 m");
  });
});

// ---------------------------------------------------------------------------
// formatTourDate
// ---------------------------------------------------------------------------
describe("formatTourDate", () => {
  it("returns '–' for null", () => {
    expect(formatTourDate(null)).toBe("–");
  });

  it("formats ISO date to German locale (DD.MM.YYYY)", () => {
    expect(formatTourDate("2026-05-10")).toBe("10.05.2026");
  });
});

// ---------------------------------------------------------------------------
// getDisplayDistance
// ---------------------------------------------------------------------------
describe("getDisplayDistance", () => {
  function makeTour(overrides: Partial<Pick<TourRow, "status" | "actual_distance_km" | "planned_distance_km">>): Pick<TourRow, "status" | "actual_distance_km" | "planned_distance_km"> {
    return {
      status: "planned",
      actual_distance_km: null,
      planned_distance_km: null,
      ...overrides,
    };
  }

  it("returns planned_distance_km for 'planned' tours", () => {
    const tour = makeTour({ status: "planned", planned_distance_km: 80, actual_distance_km: 85 });
    expect(getDisplayDistance(tour)).toBe(80);
  });

  it("returns actual_distance_km for 'completed' tours with actual data", () => {
    const tour = makeTour({ status: "completed", planned_distance_km: 80, actual_distance_km: 85 });
    expect(getDisplayDistance(tour)).toBe(85);
  });

  it("falls back to planned_distance_km for 'completed' tour with no actual data", () => {
    const tour = makeTour({ status: "completed", planned_distance_km: 80, actual_distance_km: null });
    expect(getDisplayDistance(tour)).toBe(80);
  });

  it("returns null when no distance data exists", () => {
    const tour = makeTour({ status: "planned", planned_distance_km: null, actual_distance_km: null });
    expect(getDisplayDistance(tour)).toBeNull();
  });
});

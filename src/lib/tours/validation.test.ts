import { describe, it, expect } from "vitest";
import { parseTourInput, isValidTourId } from "./validation";

function makeFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    fd.set(key, value);
  }
  return fd;
}

const VALID_UUID = "123e4567-e89b-12d3-a456-426614174000";

const BASE_VALID: Record<string, string> = {
  name: "Albaufstieg 2026",
  status: "planned",
};

// ---------------------------------------------------------------------------
// isValidTourId
// ---------------------------------------------------------------------------
describe("isValidTourId", () => {
  it("accepts a valid UUID v4", () => {
    expect(isValidTourId(VALID_UUID)).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidTourId("")).toBe(false);
  });

  it("rejects a short string", () => {
    expect(isValidTourId("not-a-uuid")).toBe(false);
  });

  it("rejects SQL injection attempts", () => {
    expect(isValidTourId("'; DROP TABLE tours; --")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// parseTourInput — name
// ---------------------------------------------------------------------------
describe("parseTourInput — name", () => {
  it("returns fieldError for empty name", () => {
    const fd = makeFormData({ ...BASE_VALID, name: "" });
    const result = parseTourInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.name).toBeTruthy();
  });

  it("returns fieldError for name exceeding 100 chars", () => {
    const fd = makeFormData({ ...BASE_VALID, name: "a".repeat(101) });
    const result = parseTourInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.name).toContain("100");
  });

  it("accepts name at exactly 100 chars", () => {
    const fd = makeFormData({ ...BASE_VALID, name: "a".repeat(100) });
    const result = parseTourInput(fd);
    expect(result.fieldErrors.name).toBeUndefined();
    expect(result.data?.name).toHaveLength(100);
  });

  it("trims whitespace from name", () => {
    const fd = makeFormData({ ...BASE_VALID, name: "  Albaufstieg  " });
    const result = parseTourInput(fd);
    expect(result.data?.name).toBe("Albaufstieg");
  });
});

// ---------------------------------------------------------------------------
// parseTourInput — date
// ---------------------------------------------------------------------------
describe("parseTourInput — start_date / end_date", () => {
  it("accepts empty start_date (optional)", () => {
    const fd = makeFormData({ ...BASE_VALID, start_date: "" });
    const result = parseTourInput(fd);
    expect(result.fieldErrors.start_date).toBeUndefined();
    expect(result.data?.start_date).toBeNull();
  });

  it("accepts valid ISO start_date", () => {
    const fd = makeFormData({ ...BASE_VALID, start_date: "2026-05-10" });
    const result = parseTourInput(fd);
    expect(result.fieldErrors.start_date).toBeUndefined();
    expect(result.data?.start_date).toBe("2026-05-10");
  });

  it("returns fieldError for invalid start_date format", () => {
    const fd = makeFormData({ ...BASE_VALID, start_date: "10.05.2026" });
    const result = parseTourInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.start_date).toBeTruthy();
  });

  it("accepts empty end_date (optional)", () => {
    const fd = makeFormData({ ...BASE_VALID, end_date: "" });
    const result = parseTourInput(fd);
    expect(result.fieldErrors.end_date).toBeUndefined();
    expect(result.data?.end_date).toBeNull();
  });

  it("accepts end_date equal to start_date (same-day tour)", () => {
    const fd = makeFormData({ ...BASE_VALID, start_date: "2026-05-10", end_date: "2026-05-10" });
    const result = parseTourInput(fd);
    expect(result.fieldErrors.end_date).toBeUndefined();
    expect(result.data?.end_date).toBe("2026-05-10");
  });

  it("accepts end_date after start_date (multi-day tour)", () => {
    const fd = makeFormData({ ...BASE_VALID, start_date: "2026-05-10", end_date: "2026-05-12" });
    const result = parseTourInput(fd);
    expect(result.fieldErrors.end_date).toBeUndefined();
    expect(result.data?.end_date).toBe("2026-05-12");
  });

  it("returns fieldError when end_date is before start_date", () => {
    const fd = makeFormData({ ...BASE_VALID, start_date: "2026-05-10", end_date: "2026-05-09" });
    const result = parseTourInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.end_date).toBeTruthy();
  });

  it("accepts end_date without start_date", () => {
    const fd = makeFormData({ ...BASE_VALID, end_date: "2026-05-10" });
    const result = parseTourInput(fd);
    expect(result.fieldErrors.end_date).toBeUndefined();
    expect(result.data?.end_date).toBe("2026-05-10");
  });
});

// ---------------------------------------------------------------------------
// parseTourInput — locations
// ---------------------------------------------------------------------------
describe("parseTourInput — locations", () => {
  it("accepts empty start and destination", () => {
    const fd = makeFormData({ ...BASE_VALID });
    const result = parseTourInput(fd);
    expect(result.data?.start_location).toBeNull();
    expect(result.data?.destination).toBeNull();
  });

  it("trims and stores location values", () => {
    const fd = makeFormData({ ...BASE_VALID, start_location: "  Reutlingen  ", destination: "Albstadt" });
    const result = parseTourInput(fd);
    expect(result.data?.start_location).toBe("Reutlingen");
    expect(result.data?.destination).toBe("Albstadt");
  });

  it("returns fieldError for start_location exceeding 200 chars", () => {
    const fd = makeFormData({ ...BASE_VALID, start_location: "a".repeat(201) });
    const result = parseTourInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.start_location).toContain("200");
  });

  it("returns fieldError for destination exceeding 200 chars", () => {
    const fd = makeFormData({ ...BASE_VALID, destination: "a".repeat(201) });
    const result = parseTourInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.destination).toContain("200");
  });
});

// ---------------------------------------------------------------------------
// parseTourInput — status
// ---------------------------------------------------------------------------
describe("parseTourInput — status", () => {
  it("defaults to 'planned' when status is empty", () => {
    const fd = makeFormData({ ...BASE_VALID, status: "" });
    const result = parseTourInput(fd);
    expect(result.data?.status).toBe("planned");
  });

  it("accepts 'planned'", () => {
    const fd = makeFormData({ ...BASE_VALID, status: "planned" });
    expect(parseTourInput(fd).data?.status).toBe("planned");
  });

  it("accepts 'completed'", () => {
    const fd = makeFormData({ ...BASE_VALID, status: "completed" });
    expect(parseTourInput(fd).data?.status).toBe("completed");
  });

  it("returns fieldError for invalid status value", () => {
    const fd = makeFormData({ ...BASE_VALID, status: "unknown" });
    const result = parseTourInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.status).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// parseTourInput — numeric fields (non-negative)
// ---------------------------------------------------------------------------
describe("parseTourInput — numeric fields", () => {
  const numericFields = [
    "planned_distance_km",
    "actual_distance_km",
    "planned_elevation_up_m",
    "planned_elevation_down_m",
    "actual_elevation_up_m",
    "actual_elevation_down_m",
    "duration_hours",
    "duration_minutes",
  ] as const;

  for (const field of numericFields) {
    it(`${field}: accepts empty (optional)`, () => {
      const fd = makeFormData({ ...BASE_VALID, [field]: "" });
      const result = parseTourInput(fd);
      expect((result.fieldErrors as Record<string, string>)[field]).toBeUndefined();
      expect((result.data as Record<string, unknown> | null)?.[field]).toBeNull();
    });

    it(`${field}: returns fieldError for negative value`, () => {
      const fd = makeFormData({ ...BASE_VALID, [field]: "-1" });
      const result = parseTourInput(fd);
      expect(result.data).toBeNull();
      expect((result.fieldErrors as Record<string, string>)[field]).toBeTruthy();
    });

    it(`${field}: returns fieldError for non-numeric value`, () => {
      const fd = makeFormData({ ...BASE_VALID, [field]: "abc" });
      const result = parseTourInput(fd);
      expect(result.data).toBeNull();
      expect((result.fieldErrors as Record<string, string>)[field]).toBeTruthy();
    });
  }

  it("planned_distance_km: accepts 0", () => {
    const fd = makeFormData({ ...BASE_VALID, planned_distance_km: "0" });
    expect(parseTourInput(fd).data?.planned_distance_km).toBe(0);
  });

  it("duration_minutes: returns fieldError for 60 (out of 0-59 range)", () => {
    const fd = makeFormData({ ...BASE_VALID, duration_minutes: "60" });
    const result = parseTourInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.duration_minutes).toBeTruthy();
  });

  it("duration_minutes: accepts 59", () => {
    const fd = makeFormData({ ...BASE_VALID, duration_minutes: "59" });
    expect(parseTourInput(fd).data?.duration_minutes).toBe(59);
  });

  it("duration_hours: accepts 999", () => {
    const fd = makeFormData({ ...BASE_VALID, duration_hours: "999" });
    expect(parseTourInput(fd).data?.duration_hours).toBe(999);
  });

  it("duration_hours: returns fieldError for 1000", () => {
    const fd = makeFormData({ ...BASE_VALID, duration_hours: "1000" });
    const result = parseTourInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.duration_hours).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// parseTourInput — is_public
// ---------------------------------------------------------------------------
describe("parseTourInput — is_public", () => {
  it("defaults to false when not set", () => {
    const fd = makeFormData({ ...BASE_VALID });
    expect(parseTourInput(fd).data?.is_public).toBe(false);
  });

  it("sets true when value is 'on'", () => {
    const fd = makeFormData({ ...BASE_VALID, is_public: "on" });
    expect(parseTourInput(fd).data?.is_public).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// parseTourInput — success (full form)
// ---------------------------------------------------------------------------
describe("parseTourInput — full valid form", () => {
  it("returns complete TourInput for a fully filled form", () => {
    const fd = makeFormData({
      name: "Albaufstieg",
      start_date: "2026-06-15",
      end_date: "2026-06-17",
      start_location: "Reutlingen",
      destination: "Albstadt",
      status: "completed",
      planned_distance_km: "85.5",
      planned_elevation_up_m: "1200",
      planned_elevation_down_m: "1100",
      actual_distance_km: "87.2",
      actual_elevation_up_m: "1250",
      actual_elevation_down_m: "1150",
      duration_hours: "4",
      duration_minutes: "30",
      is_public: "on",
    });
    const result = parseTourInput(fd);
    expect(result.fieldErrors).toEqual({});
    expect(result.data).toEqual({
      name: "Albaufstieg",
      start_date: "2026-06-15",
      end_date: "2026-06-17",
      start_location: "Reutlingen",
      destination: "Albstadt",
      status: "completed",
      planned_distance_km: 85.5,
      planned_elevation_up_m: 1200,
      planned_elevation_down_m: 1100,
      actual_distance_km: 87.2,
      actual_elevation_up_m: 1250,
      actual_elevation_down_m: 1150,
      duration_hours: 4,
      duration_minutes: 30,
      is_public: true,
      preset_id: null,
    });
  });

  it("returns minimal TourInput with only name provided", () => {
    const fd = makeFormData({ name: "Minimaltour" });
    const result = parseTourInput(fd);
    expect(result.data).not.toBeNull();
    expect(result.data?.name).toBe("Minimaltour");
    expect(result.data?.start_date).toBeNull();
    expect(result.data?.end_date).toBeNull();
    expect(result.data?.planned_distance_km).toBeNull();
    expect(result.data?.is_public).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// XSS — sanitize input
// ---------------------------------------------------------------------------
describe("parseTourInput — XSS sanitization", () => {
  it("stores XSS payload as plain string (no HTML escaping needed at parse layer)", () => {
    const xss = '<script>alert("xss")</script>';
    const fd = makeFormData({ ...BASE_VALID, name: xss });
    const result = parseTourInput(fd);
    // Validation layer just stores the trimmed string; HTML escaping is React's job
    expect(result.data?.name).toBe(xss.trim());
  });

  it("empty-string XSS name triggers required-field error", () => {
    const fd = makeFormData({ ...BASE_VALID, name: "   " });
    const result = parseTourInput(fd);
    expect(result.data).toBeNull();
    expect(result.fieldErrors.name).toBeTruthy();
  });
});

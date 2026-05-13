import { describe, it, expect } from "vitest";
import {
  createPresetSchema,
  renamePresetSchema,
  presetIdSchema,
  applyPresetSchema,
} from "./preset-validation";

const VALID_UUID_A = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_B = "550e8400-e29b-41d4-b716-446655440001";

// ---------------------------------------------------------------------------
// createPresetSchema
// ---------------------------------------------------------------------------
describe("createPresetSchema — valid inputs", () => {
  it("accepts minimum valid input (name only)", () => {
    const r = createPresetSchema.safeParse({ bikeId: VALID_UUID_A, name: "Sommer-Setup" });
    expect(r.success).toBe(true);
  });

  it("accepts with optional description", () => {
    const r = createPresetSchema.safeParse({
      bikeId: VALID_UUID_A,
      name: "Event: Mallnitz 2026",
      description: "Leichtes Setup für Bergrennen",
    });
    expect(r.success).toBe(true);
  });

  it("accepts null description", () => {
    const r = createPresetSchema.safeParse({ bikeId: VALID_UUID_A, name: "X", description: null });
    expect(r.success).toBe(true);
  });

  it("accepts name at max length (50 chars)", () => {
    const r = createPresetSchema.safeParse({ bikeId: VALID_UUID_A, name: "a".repeat(50) });
    expect(r.success).toBe(true);
  });

  it("accepts description at max length (200 chars)", () => {
    const r = createPresetSchema.safeParse({
      bikeId: VALID_UUID_A,
      name: "Setup",
      description: "x".repeat(200),
    });
    expect(r.success).toBe(true);
  });
});

describe("createPresetSchema — invalid inputs", () => {
  it("rejects invalid bikeId", () => {
    const r = createPresetSchema.safeParse({ bikeId: "not-a-uuid", name: "Setup" });
    expect(r.success).toBe(false);
  });

  it("rejects empty bikeId", () => {
    const r = createPresetSchema.safeParse({ bikeId: "", name: "Setup" });
    expect(r.success).toBe(false);
  });

  it("rejects SQL injection in bikeId", () => {
    const r = createPresetSchema.safeParse({ bikeId: "'; DROP TABLE bike_presets; --", name: "X" });
    expect(r.success).toBe(false);
  });

  it("rejects empty name", () => {
    const r = createPresetSchema.safeParse({ bikeId: VALID_UUID_A, name: "" });
    expect(r.success).toBe(false);
  });

  it("rejects name exceeding 50 chars", () => {
    const r = createPresetSchema.safeParse({ bikeId: VALID_UUID_A, name: "a".repeat(51) });
    expect(r.success).toBe(false);
  });

  it("rejects description exceeding 200 chars", () => {
    const r = createPresetSchema.safeParse({
      bikeId: VALID_UUID_A,
      name: "Setup",
      description: "x".repeat(201),
    });
    expect(r.success).toBe(false);
  });

  it("rejects name that exceeds 50 chars (even if it is an XSS payload)", () => {
    // XSS sanitization happens at render (React escapes JSX). Schema only enforces length.
    const r = createPresetSchema.safeParse({
      bikeId: VALID_UUID_A,
      name: "<script>alert('xss-payload-that-is-way-too-long')</script>",
    });
    expect(r.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// renamePresetSchema
// ---------------------------------------------------------------------------
describe("renamePresetSchema — valid inputs", () => {
  it("accepts valid presetId and name", () => {
    const r = renamePresetSchema.safeParse({ presetId: VALID_UUID_A, name: "Neuer Name" });
    expect(r.success).toBe(true);
  });

  it("accepts name at exactly 50 chars", () => {
    const r = renamePresetSchema.safeParse({ presetId: VALID_UUID_A, name: "b".repeat(50) });
    expect(r.success).toBe(true);
  });
});

describe("renamePresetSchema — invalid inputs", () => {
  it("rejects invalid presetId", () => {
    const r = renamePresetSchema.safeParse({ presetId: "not-uuid", name: "Name" });
    expect(r.success).toBe(false);
  });

  it("rejects empty presetId", () => {
    const r = renamePresetSchema.safeParse({ presetId: "", name: "Name" });
    expect(r.success).toBe(false);
  });

  it("rejects empty name", () => {
    const r = renamePresetSchema.safeParse({ presetId: VALID_UUID_A, name: "" });
    expect(r.success).toBe(false);
  });

  it("rejects name over 50 chars", () => {
    const r = renamePresetSchema.safeParse({ presetId: VALID_UUID_A, name: "c".repeat(51) });
    expect(r.success).toBe(false);
  });

  it("rejects missing name field", () => {
    const r = renamePresetSchema.safeParse({ presetId: VALID_UUID_A });
    expect(r.success).toBe(false);
  });

  it("rejects path traversal in presetId", () => {
    const r = renamePresetSchema.safeParse({ presetId: "../../etc/passwd", name: "X" });
    expect(r.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// presetIdSchema
// ---------------------------------------------------------------------------
describe("presetIdSchema — valid inputs", () => {
  it("accepts a valid UUID", () => {
    const r = presetIdSchema.safeParse({ presetId: VALID_UUID_A });
    expect(r.success).toBe(true);
  });
});

describe("presetIdSchema — invalid inputs", () => {
  it("rejects empty presetId", () => {
    const r = presetIdSchema.safeParse({ presetId: "" });
    expect(r.success).toBe(false);
  });

  it("rejects SQL injection", () => {
    const r = presetIdSchema.safeParse({ presetId: "'; DROP TABLE bike_presets; --" });
    expect(r.success).toBe(false);
  });

  it("rejects XSS payload", () => {
    const r = presetIdSchema.safeParse({ presetId: "<script>alert(1)</script>" });
    expect(r.success).toBe(false);
  });

  it("rejects path traversal", () => {
    const r = presetIdSchema.safeParse({ presetId: "../../etc/passwd" });
    expect(r.success).toBe(false);
  });

  it("rejects missing field", () => {
    const r = presetIdSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyPresetSchema (same as presetIdSchema — reused pattern)
// ---------------------------------------------------------------------------
describe("applyPresetSchema — valid inputs", () => {
  it("accepts a valid UUID", () => {
    const r = applyPresetSchema.safeParse({ presetId: VALID_UUID_B });
    expect(r.success).toBe(true);
  });
});

describe("applyPresetSchema — invalid inputs", () => {
  it("rejects non-UUID string", () => {
    const r = applyPresetSchema.safeParse({ presetId: "not-a-uuid" });
    expect(r.success).toBe(false);
  });

  it("rejects SQL injection", () => {
    const r = applyPresetSchema.safeParse({ presetId: "' OR '1'='1" });
    expect(r.success).toBe(false);
  });
});

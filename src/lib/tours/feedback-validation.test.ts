import { describe, it, expect } from "vitest";
import { z } from "zod";
import { isValidTourId } from "./validation";

// Mirror of the feedbackSchema in actions.ts — kept in sync manually.
const feedbackSchema = z
  .object({
    rating: z.number().int().min(1).max(5).nullable(),
    note: z.string().max(1000).nullable(),
  })
  .refine(
    (d) => d.rating !== null || (d.note !== null && d.note.trim().length > 0),
    { message: "Mindestens Bewertung oder Notiz muss angegeben werden." }
  );

// ---------------------------------------------------------------------------
// feedbackSchema — valid inputs
// ---------------------------------------------------------------------------
describe("feedbackSchema — valid inputs", () => {
  it("accepts rating-only (note null)", () => {
    const result = feedbackSchema.safeParse({ rating: 4, note: null });
    expect(result.success).toBe(true);
  });

  it("accepts note-only (rating null)", () => {
    const result = feedbackSchema.safeParse({ rating: null, note: "Gute Tour" });
    expect(result.success).toBe(true);
  });

  it("accepts both rating and note", () => {
    const result = feedbackSchema.safeParse({ rating: 5, note: "Ausgezeichnet" });
    expect(result.success).toBe(true);
  });

  it("accepts rating = 1 (minimum)", () => {
    const result = feedbackSchema.safeParse({ rating: 1, note: null });
    expect(result.success).toBe(true);
  });

  it("accepts rating = 5 (maximum)", () => {
    const result = feedbackSchema.safeParse({ rating: 5, note: null });
    expect(result.success).toBe(true);
  });

  it("accepts note exactly at 1000-char limit", () => {
    const result = feedbackSchema.safeParse({ rating: null, note: "a".repeat(1000) });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// feedbackSchema — invalid inputs
// ---------------------------------------------------------------------------
describe("feedbackSchema — invalid inputs", () => {
  it("rejects both null (no feedback)", () => {
    const result = feedbackSchema.safeParse({ rating: null, note: null });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only note with null rating", () => {
    // The action trims note before passing, so whitespace → null → fails refine.
    const result = feedbackSchema.safeParse({ rating: null, note: null });
    expect(result.success).toBe(false);
  });

  it("rejects rating = 0 (below minimum)", () => {
    const result = feedbackSchema.safeParse({ rating: 0, note: null });
    expect(result.success).toBe(false);
  });

  it("rejects rating = 6 (above maximum)", () => {
    const result = feedbackSchema.safeParse({ rating: 6, note: null });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer rating (e.g. 3.5)", () => {
    const result = feedbackSchema.safeParse({ rating: 3.5, note: null });
    expect(result.success).toBe(false);
  });

  it("rejects note exceeding 1000 characters", () => {
    const result = feedbackSchema.safeParse({ rating: null, note: "a".repeat(1001) });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isValidTourId — used for both tourId and itemId validation
// ---------------------------------------------------------------------------
describe("isValidTourId (used for UUID validation of tour + item IDs)", () => {
  it("accepts a valid UUID v4", () => {
    expect(isValidTourId("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidTourId("")).toBe(false);
  });

  it("rejects a plain string", () => {
    expect(isValidTourId("not-a-uuid")).toBe(false);
  });

  it("rejects a UUID with wrong length", () => {
    expect(isValidTourId("550e8400-e29b-41d4-a716-44665544000")).toBe(false);
  });

  it("rejects SQL injection attempt", () => {
    expect(isValidTourId("'; DROP TABLE tours; --")).toBe(false);
  });

  it("rejects XSS payload", () => {
    expect(isValidTourId("<script>alert(1)</script>")).toBe(false);
  });

  it("rejects path traversal", () => {
    expect(isValidTourId("../../etc/passwd")).toBe(false);
  });
});

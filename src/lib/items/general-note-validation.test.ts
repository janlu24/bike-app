import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror of generalNoteSchema in src/app/(app)/garage/actions.ts
const generalNoteSchema = z.object({
  itemId: z.string().uuid(),
  note: z
    .string()
    .max(2000, "Kommentar darf maximal 2000 Zeichen lang sein.")
    .transform((v) => (v.trim() === "" ? null : v.trim()))
    .nullable(),
});

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

// ---------------------------------------------------------------------------
// generalNoteSchema — valid inputs
// ---------------------------------------------------------------------------
describe("generalNoteSchema — valid inputs", () => {
  it("accepts a note with regular text", () => {
    const result = generalNoteSchema.safeParse({
      itemId: VALID_UUID,
      note: "Knarzt bei Nässe",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.note).toBe("Knarzt bei Nässe");
  });

  it("accepts a note exactly at 2000-char limit", () => {
    const result = generalNoteSchema.safeParse({
      itemId: VALID_UUID,
      note: "a".repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it("transforms empty string to null", () => {
    const result = generalNoteSchema.safeParse({ itemId: VALID_UUID, note: "" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.note).toBeNull();
  });

  it("transforms whitespace-only string to null", () => {
    const result = generalNoteSchema.safeParse({
      itemId: VALID_UUID,
      note: "   \n\t  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.note).toBeNull();
  });

  it("trims leading and trailing whitespace from a valid note", () => {
    const result = generalNoteSchema.safeParse({
      itemId: VALID_UUID,
      note: "  Perfekte Passform  ",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.note).toBe("Perfekte Passform");
  });

  it("accepts a multiline note", () => {
    const result = generalNoteSchema.safeParse({
      itemId: VALID_UUID,
      note: "Zeile 1\nZeile 2\nZeile 3",
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// generalNoteSchema — invalid inputs
// ---------------------------------------------------------------------------
describe("generalNoteSchema — invalid inputs", () => {
  it("rejects a note exceeding 2000 characters", () => {
    const result = generalNoteSchema.safeParse({
      itemId: VALID_UUID,
      note: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Kommentar darf maximal 2000 Zeichen lang sein."
      );
    }
  });

  it("rejects an invalid UUID for itemId", () => {
    const result = generalNoteSchema.safeParse({
      itemId: "not-a-uuid",
      note: "valid note",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty string as itemId", () => {
    const result = generalNoteSchema.safeParse({ itemId: "", note: "note" });
    expect(result.success).toBe(false);
  });

  it("rejects a SQL injection payload as itemId", () => {
    const result = generalNoteSchema.safeParse({
      itemId: "'; DROP TABLE items; --",
      note: "note",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an XSS payload as itemId", () => {
    const result = generalNoteSchema.safeParse({
      itemId: "<script>alert(1)</script>",
      note: "note",
    });
    expect(result.success).toBe(false);
  });

  it("rejects path traversal in itemId", () => {
    const result = generalNoteSchema.safeParse({
      itemId: "../../etc/passwd",
      note: "note",
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Edge: boundary values
// ---------------------------------------------------------------------------
describe("generalNoteSchema — boundary values", () => {
  it("accepts exactly 1 character", () => {
    const result = generalNoteSchema.safeParse({ itemId: VALID_UUID, note: "x" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.note).toBe("x");
  });

  it("accepts exactly 1999 characters", () => {
    const result = generalNoteSchema.safeParse({
      itemId: VALID_UUID,
      note: "a".repeat(1999),
    });
    expect(result.success).toBe(true);
  });

  it("rejects exactly 2001 characters", () => {
    const result = generalNoteSchema.safeParse({
      itemId: VALID_UUID,
      note: "a".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("note with 2000 chars + trailing space is trimmed and passes", () => {
    // The raw input is 2001 chars → .max(2000) runs before .transform() → rejects
    const result = generalNoteSchema.safeParse({
      itemId: VALID_UUID,
      note: "a".repeat(2000) + " ",
    });
    expect(result.success).toBe(false);
  });
});

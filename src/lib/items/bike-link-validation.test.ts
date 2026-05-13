import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirrors the schemas in src/app/(app)/garage/actions.ts (PROJ-14)
const linkSchema = z.object({
  bikeId: z.string().uuid(),
  itemId: z.string().uuid(),
});

const unlinkSchema = z.object({ itemId: z.string().uuid() });

const VALID_UUID_A = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_B = "550e8400-e29b-41d4-b716-446655440001";

// ---------------------------------------------------------------------------
// linkSchema — valid inputs
// ---------------------------------------------------------------------------
describe("linkSchema — valid inputs", () => {
  it("accepts two valid UUIDs", () => {
    const result = linkSchema.safeParse({ bikeId: VALID_UUID_A, itemId: VALID_UUID_B });
    expect(result.success).toBe(true);
  });

  it("accepts the same UUID for both fields (server enforces distinctness via DB)", () => {
    const result = linkSchema.safeParse({ bikeId: VALID_UUID_A, itemId: VALID_UUID_A });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// linkSchema — invalid inputs
// ---------------------------------------------------------------------------
describe("linkSchema — invalid inputs", () => {
  it("rejects empty bikeId", () => {
    const result = linkSchema.safeParse({ bikeId: "", itemId: VALID_UUID_B });
    expect(result.success).toBe(false);
  });

  it("rejects empty itemId", () => {
    const result = linkSchema.safeParse({ bikeId: VALID_UUID_A, itemId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects SQL injection in bikeId", () => {
    const result = linkSchema.safeParse({
      bikeId: "'; DROP TABLE items; --",
      itemId: VALID_UUID_B,
    });
    expect(result.success).toBe(false);
  });

  it("rejects XSS payload in itemId", () => {
    const result = linkSchema.safeParse({
      bikeId: VALID_UUID_A,
      itemId: "<script>alert(1)</script>",
    });
    expect(result.success).toBe(false);
  });

  it("rejects path traversal in bikeId", () => {
    const result = linkSchema.safeParse({
      bikeId: "../../etc/passwd",
      itemId: VALID_UUID_B,
    });
    expect(result.success).toBe(false);
  });

  it("rejects plain strings that are not UUIDs", () => {
    const result = linkSchema.safeParse({ bikeId: "not-a-uuid", itemId: VALID_UUID_B });
    expect(result.success).toBe(false);
  });

  it("rejects missing itemId field", () => {
    const result = linkSchema.safeParse({ bikeId: VALID_UUID_A });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// unlinkSchema — valid inputs
// ---------------------------------------------------------------------------
describe("unlinkSchema — valid inputs", () => {
  it("accepts a valid UUID", () => {
    const result = unlinkSchema.safeParse({ itemId: VALID_UUID_A });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// unlinkSchema — invalid inputs
// ---------------------------------------------------------------------------
describe("unlinkSchema — invalid inputs", () => {
  it("rejects empty itemId", () => {
    const result = unlinkSchema.safeParse({ itemId: "" });
    expect(result.success).toBe(false);
  });

  it("rejects SQL injection in itemId", () => {
    const result = unlinkSchema.safeParse({ itemId: "'; DROP TABLE items; --" });
    expect(result.success).toBe(false);
  });

  it("rejects XSS payload in itemId", () => {
    const result = unlinkSchema.safeParse({ itemId: "<script>alert(1)</script>" });
    expect(result.success).toBe(false);
  });

  it("rejects path traversal in itemId", () => {
    const result = unlinkSchema.safeParse({ itemId: "../../etc/passwd" });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID string", () => {
    const result = unlinkSchema.safeParse({ itemId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });

  it("rejects missing itemId field", () => {
    const result = unlinkSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

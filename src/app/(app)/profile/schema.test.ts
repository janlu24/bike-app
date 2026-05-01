import { describe, it, expect } from "vitest";
import { updateProfileSchema } from "./schema";

// ---------------------------------------------------------------------------
// Helper: build a File-like object for avatar tests
// ---------------------------------------------------------------------------
function makeFile(sizeBytes: number, mimeType: string): File {
  const buffer = new Uint8Array(sizeBytes);
  return new File([buffer], "avatar.jpg", { type: mimeType });
}

// ---------------------------------------------------------------------------
// Valid inputs
// ---------------------------------------------------------------------------

describe("updateProfileSchema — valid inputs", () => {
  it("accepts a fully populated valid profile", () => {
    const result = updateProfileSchema.safeParse({
      full_name: "Jan Lustig",
      bio: "MTB + Gravel Rider",
      is_public: true,
      weight_unit: "g",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal profile with only weight_unit + is_public", () => {
    const result = updateProfileSchema.safeParse({
      weight_unit: "kg",
      is_public: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.weight_unit).toBe("kg");
      expect(result.data.is_public).toBe(false);
    }
  });

  it("accepts weight_unit 'g'", () => {
    const result = updateProfileSchema.safeParse({ weight_unit: "g", is_public: false });
    expect(result.success).toBe(true);
  });

  it("accepts weight_unit 'kg'", () => {
    const result = updateProfileSchema.safeParse({ weight_unit: "kg", is_public: false });
    expect(result.success).toBe(true);
  });

  it("is_public defaults to false when omitted", () => {
    const result = updateProfileSchema.safeParse({ weight_unit: "g" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_public).toBe(false);
    }
  });

  it("transforms empty string full_name to undefined", () => {
    const result = updateProfileSchema.safeParse({ full_name: "", weight_unit: "g", is_public: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.full_name).toBeUndefined();
    }
  });

  it("transforms empty string bio to undefined", () => {
    const result = updateProfileSchema.safeParse({ bio: "", weight_unit: "g", is_public: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bio).toBeUndefined();
    }
  });

  it("accepts full_name exactly 120 chars", () => {
    const result = updateProfileSchema.safeParse({
      full_name: "a".repeat(120),
      weight_unit: "g",
      is_public: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts bio exactly 500 chars", () => {
    const result = updateProfileSchema.safeParse({
      bio: "b".repeat(500),
      weight_unit: "g",
      is_public: false,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid JPEG avatar file under 5 MB", () => {
    const file = makeFile(1024 * 1024, "image/jpeg"); // 1 MB
    const result = updateProfileSchema.safeParse({
      full_name: "Jan",
      weight_unit: "g",
      is_public: false,
      avatar: file,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid PNG avatar file", () => {
    const file = makeFile(500_000, "image/png");
    const result = updateProfileSchema.safeParse({
      weight_unit: "g",
      is_public: false,
      avatar: file,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid WebP avatar file", () => {
    const file = makeFile(200_000, "image/webp");
    const result = updateProfileSchema.safeParse({
      weight_unit: "g",
      is_public: false,
      avatar: file,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a valid AVIF avatar file", () => {
    const file = makeFile(100_000, "image/avif");
    const result = updateProfileSchema.safeParse({
      weight_unit: "g",
      is_public: false,
      avatar: file,
    });
    expect(result.success).toBe(true);
  });

  it("accepts missing avatar (field optional)", () => {
    const result = updateProfileSchema.safeParse({
      weight_unit: "g",
      is_public: false,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.avatar).toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// full_name validation
// ---------------------------------------------------------------------------

describe("updateProfileSchema — full_name validation", () => {
  it("rejects full_name over 120 chars with German error message", () => {
    const result = updateProfileSchema.safeParse({
      full_name: "a".repeat(121),
      weight_unit: "g",
      is_public: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Höchstens 120 Zeichen erlaubt.");
    }
  });
});

// ---------------------------------------------------------------------------
// bio validation
// ---------------------------------------------------------------------------

describe("updateProfileSchema — bio validation", () => {
  it("rejects bio over 500 chars with German error message", () => {
    const result = updateProfileSchema.safeParse({
      bio: "x".repeat(501),
      weight_unit: "g",
      is_public: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Höchstens 500 Zeichen erlaubt.");
    }
  });
});

// ---------------------------------------------------------------------------
// weight_unit validation
// ---------------------------------------------------------------------------

describe("updateProfileSchema — weight_unit validation", () => {
  it("rejects invalid weight_unit value with German error message", () => {
    const result = updateProfileSchema.safeParse({
      weight_unit: "lbs",
      is_public: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Ungültige Gewichtseinheit. Erlaubt: g oder kg.");
    }
  });

  it("rejects missing weight_unit", () => {
    const result = updateProfileSchema.safeParse({
      is_public: false,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// avatar validation
// ---------------------------------------------------------------------------

describe("updateProfileSchema — avatar validation", () => {
  it("rejects avatar file over 5 MB with German error message", () => {
    const file = makeFile(5 * 1024 * 1024 + 1, "image/jpeg"); // 5 MB + 1 byte
    const result = updateProfileSchema.safeParse({
      weight_unit: "g",
      is_public: false,
      avatar: file,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Bild ist größer als 5 MB.");
    }
  });

  it("rejects avatar with invalid MIME type (gif) with German error message", () => {
    const file = makeFile(100_000, "image/gif");
    const result = updateProfileSchema.safeParse({
      weight_unit: "g",
      is_public: false,
      avatar: file,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Nur JPEG, PNG, WebP oder AVIF erlaubt.");
    }
  });

  it("rejects avatar with invalid MIME type (bmp) with German error message", () => {
    const file = makeFile(100_000, "image/bmp");
    const result = updateProfileSchema.safeParse({
      weight_unit: "g",
      is_public: false,
      avatar: file,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs).toContain("Nur JPEG, PNG, WebP oder AVIF erlaubt.");
    }
  });

  it("accepts avatar file exactly at 5 MB boundary", () => {
    const file = makeFile(5 * 1024 * 1024, "image/jpeg"); // exactly 5 MB
    const result = updateProfileSchema.safeParse({
      weight_unit: "g",
      is_public: false,
      avatar: file,
    });
    expect(result.success).toBe(true);
  });

  it("skips validation for zero-size file (empty file sentinel)", () => {
    const file = makeFile(0, "image/gif"); // zero-size, invalid MIME but should be skipped
    const result = updateProfileSchema.safeParse({
      weight_unit: "g",
      is_public: false,
      avatar: file,
    });
    // Zero-size files are skipped per superRefine guard: "if (!file || file.size === 0) return;"
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// is_public default
// ---------------------------------------------------------------------------

describe("updateProfileSchema — is_public default", () => {
  it("defaults is_public to false when not provided", () => {
    const result = updateProfileSchema.safeParse({ weight_unit: "g" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_public).toBe(false);
    }
  });

  it("preserves is_public=true when provided", () => {
    const result = updateProfileSchema.safeParse({ weight_unit: "g", is_public: true });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.is_public).toBe(true);
    }
  });
});

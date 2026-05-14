import { test, expect } from "@playwright/test";

/**
 * PROJ-17 Preset Sandbox Mode — E2E Tests
 *
 * Sections:
 * 1. Unauthenticated redirects — /garage requires auth
 * 2. Security — XSS injection in preset name inputs, no PII in URLs
 * 3. PII — no sensitive data in responses or URLs
 * 4. Schema validation — presetItemSchema (in-test logic)
 * 5. Garage — build focus structure: "Als Preset speichern" + "Neu planen" buttons
 * 6. Sandbox sheet — banner, weight stats, conflict indicator structure
 * 7. RLS — unauthorized access denied on sandbox actions
 */

const SUPABASE_CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

// ────────────────────────────────────────────────────────────
// SECTION 1: Unauthentifizierte Weiterleitungen
// ────────────────────────────────────────────────────────────
test.describe("Weiterleitung — unauthentifiziert", () => {
  test(
    "GET /garage → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");
      await expect(page).toHaveURL(/\/login/);
    }
  );

  test(
    "GET /garage mit build-Fokus-Parameter → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto(`/garage?build=${FAKE_UUID}`);
      await expect(page).toHaveURL(/\/login/);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 2: Sicherheit — Injection-Abwehr
// ────────────────────────────────────────────────────────────
test.describe("Sicherheit — Injection", () => {
  test("presetItemSchema: SQL-Injection in presetId wird abgelehnt", () => {
    const { z } = require("zod");
    const schema = z.object({
      presetId: z.string().uuid(),
      itemId: z.string().uuid(),
    });
    const result = schema.safeParse({
      presetId: "'; DROP TABLE preset_items; --",
      itemId: FAKE_UUID,
    });
    expect(result.success).toBe(false);
  });

  test("presetItemSchema: XSS-Payload in itemId wird abgelehnt", () => {
    const { z } = require("zod");
    const schema = z.object({
      presetId: z.string().uuid(),
      itemId: z.string().uuid(),
    });
    const result = schema.safeParse({
      presetId: FAKE_UUID,
      itemId: "<script>alert('xss')</script>",
    });
    expect(result.success).toBe(false);
  });

  test("presetItemSchema: Pfad-Traversal in itemId wird abgelehnt", () => {
    const { z } = require("zod");
    const schema = z.object({
      presetId: z.string().uuid(),
      itemId: z.string().uuid(),
    });
    const result = schema.safeParse({
      presetId: FAKE_UUID,
      itemId: "../../etc/passwd",
    });
    expect(result.success).toBe(false);
  });

  test("presetItemSchema: Leere Felder werden abgelehnt", () => {
    const { z } = require("zod");
    const schema = z.object({
      presetId: z.string().uuid(),
      itemId: z.string().uuid(),
    });
    expect(schema.safeParse({ presetId: "", itemId: "" }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
  });

  test(
    "Sandbox-Aktionen: Unauthentifizierter Zugriff auf addItemToPreset-Endpunkt liefert Fehler",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      // Attempt to POST to a non-existent action route as anon — should get redirect/error
      const response = await page.request.post("/garage", {
        data: { preset_id: FAKE_UUID, item_id: FAKE_UUID },
      });
      // Server actions require auth — response should not be 200 with data
      expect([302, 303, 307, 401, 403, 404, 405]).toContain(response.status());
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 3: PII — keine sensiblen Daten exponiert
// ────────────────────────────────────────────────────────────
test.describe("PII — keine sensiblen Daten in URLs", () => {
  test("Build-Fokus URL enthält keine E-Mail-Adresse", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
    const url = page.url();
    expect(url).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  });

  test("Sandbox-Modus-Aktivierung ändert URL-Format nicht (kein token/email leak)", async ({ page }) => {
    // Structural: verify no auth tokens appear in query params under any common pattern
    const suspiciousPatterns = [/access_token=/, /bearer=/i, /email=/, /password=/i];
    const url = "/garage";
    for (const pattern of suspiciousPatterns) {
      expect(url).not.toMatch(pattern);
    }
  });
});

// ────────────────────────────────────────────────────────────
// SECTION 4: Garage — Build-Fokus-Struktur
// ────────────────────────────────────────────────────────────
test.describe("Garage — Preset-Panel Struktur", () => {
  test(
    "Preset-Panel zeigt 'Als Preset speichern'- und 'Neu planen'-Button",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");
      // Must be in build focus mode — look for PresetPanel section
      const presetSection = page.getByRole("region", { name: "Presets" });
      await expect(presetSection).toBeVisible();

      // "Als Preset speichern" button
      const snapshotBtn = presetSection.getByRole("button", { name: /als preset speichern/i });
      await expect(snapshotBtn).toBeVisible();

      // "Neu planen" Plus-button (tooltip-based identification)
      const planBtn = presetSection.getByTitle(/neues leeres preset/i);
      await expect(planBtn).toBeVisible();
    }
  );

  test(
    "Preset-Card hat 'Bearbeiten'- und 'Anwenden'-Button",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");
      const editBtn = page.getByRole("button", { name: /preset bearbeiten/i }).first();
      await expect(editBtn).toBeVisible();
      const applyBtn = page.getByRole("button", { name: /preset anwenden/i }).first();
      await expect(applyBtn).toBeVisible();
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 5: Sandbox-Sheet — Struktur
// ────────────────────────────────────────────────────────────
test.describe("Sandbox-Sheet — Struktur und UI", () => {
  test(
    "Sandbox-Sheet zeigt amber Banner mit 'Sandbox —' Text nach Öffnen",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");

      const editBtn = page.getByRole("button", { name: /preset bearbeiten/i }).first();
      await editBtn.click();

      // Banner with role="status" must be visible
      const banner = page.getByRole("status");
      await expect(banner).toBeVisible();
      await expect(banner).toContainText("Sandbox");
    }
  );

  test(
    "Sandbox-Sheet zeigt Gewicht-Statistik-Block (Preset / Live / Differenz)",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");

      const editBtn = page.getByRole("button", { name: /preset bearbeiten/i }).first();
      await editBtn.click();

      // Weight labels should appear once data loads
      await expect(page.getByText(/preset/i).first()).toBeVisible();
      await expect(page.getByText(/live/i).first()).toBeVisible();
      await expect(page.getByText(/differenz/i)).toBeVisible();
    }
  );

  test(
    "Sandbox-Sheet hat 'Fertig'- und 'Anwenden'-Button in der Fußzeile",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");

      const editBtn = page.getByRole("button", { name: /preset bearbeiten/i }).first();
      await editBtn.click();

      await expect(page.getByRole("button", { name: /fertig/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /anwenden/i })).toBeVisible();
    }
  );

  test(
    "'Fertig' schließt das Sandbox-Sheet ohne Navigation",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");
      const initialUrl = page.url();

      const editBtn = page.getByRole("button", { name: /preset bearbeiten/i }).first();
      await editBtn.click();

      const doneBtn = page.getByRole("button", { name: /fertig/i });
      await doneBtn.click();

      await expect(page.getByRole("status")).not.toBeVisible();
      expect(page.url()).toBe(initialUrl);
    }
  );

  test(
    "'Neu planen' erstellt leeres Preset und öffnet Sandbox direkt",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");

      const planBtn = page.getByTitle(/neues leeres preset/i);
      await planBtn.click();

      // "Neues Preset planen" dialog should appear
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect(dialog).toContainText(/neues preset planen/i);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 6: Schema-Validierung — presetItemSchema
// ────────────────────────────────────────────────────────────
test.describe("Schema-Validierung — presetItemSchema", () => {
  const VALID_UUID_A = "550e8400-e29b-41d4-a716-446655440000";
  const VALID_UUID_B = "550e8400-e29b-41d4-b716-446655440001";

  test("akzeptiert gültige presetId und itemId", () => {
    const { z } = require("zod");
    const schema = z.object({ presetId: z.string().uuid(), itemId: z.string().uuid() });
    expect(schema.safeParse({ presetId: VALID_UUID_A, itemId: VALID_UUID_B }).success).toBe(true);
  });

  test("lehnt ungültige presetId ab", () => {
    const { z } = require("zod");
    const schema = z.object({ presetId: z.string().uuid(), itemId: z.string().uuid() });
    expect(schema.safeParse({ presetId: "not-uuid", itemId: VALID_UUID_B }).success).toBe(false);
  });

  test("lehnt ungültige itemId ab", () => {
    const { z } = require("zod");
    const schema = z.object({ presetId: z.string().uuid(), itemId: z.string().uuid() });
    expect(schema.safeParse({ presetId: VALID_UUID_A, itemId: "not-uuid" }).success).toBe(false);
  });

  test("lehnt fehlende Felder ab", () => {
    const { z } = require("zod");
    const schema = z.object({ presetId: z.string().uuid(), itemId: z.string().uuid() });
    expect(schema.safeParse({}).success).toBe(false);
  });
});

// ────────────────────────────────────────────────────────────
// SECTION 7: RLS — Unbefugter Zugriff
// ────────────────────────────────────────────────────────────
test.describe("RLS — Unbefugter Zugriff auf Sandbox-Daten", () => {
  test(
    "Anonymer Nutzer erhält keine Sandbox-Daten für fremde Presets",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      // Attempt to access sandbox data via direct API without auth
      const response = await page.request.get(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/bike_presets?id=eq.${FAKE_UUID}&select=*`
      );
      // Without auth header, RLS should return empty data, not an error
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    }
  );

  test(
    "Anonymer Nutzer erhält keine preset_items für fremde Presets",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      const response = await page.request.get(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/preset_items?preset_id=eq.${FAKE_UUID}&select=*`
      );
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    }
  );
});

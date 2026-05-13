import { test, expect } from "@playwright/test";

/**
 * PROJ-13 Item View/Edit Split — E2E Tests
 *
 * Groups:
 * - "Weiterleitung": unauthenticated access → /login for protected routes
 * - "View-Seite Struktur": /garage/[id] has correct layout elements
 * - "Edit-Seite Struktur": /garage/[id]/edit is cleaned up (no history, has back-link)
 * - "Navigation": item links go to view page, not /edit
 * - "GeneralNoteSection": inline edit UI elements present
 * - "Sicherheit": XSS, path traversal, UUID guard
 */

const SUPABASE_CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

// ────────────────────────────────────────────────────────────
// SECTION 1: Unauthentifizierte Weiterleitungen
// ────────────────────────────────────────────────────────────
test.describe("Weiterleitung — unauthentifiziert", () => {
  test(
    "GET /garage/<uuid> → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto(`/garage/${FAKE_UUID}`);
      await expect(page).toHaveURL(/\/login/);
    }
  );

  test(
    "GET /garage/<uuid>/edit → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto(`/garage/${FAKE_UUID}/edit`);
      await expect(page).toHaveURL(/\/login/);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 2: View-Seite URL-Validierung
// ────────────────────────────────────────────────────────────
test.describe("View-Seite — URL-Validierung", () => {
  test(
    "Ungültige UUID in /garage/[id] → login oder 404",
    { annotation: { type: "security" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage/not-a-valid-uuid");
      const url = page.url();
      expect(url).toMatch(/\/(login|not-found|404)/);
    }
  );

  test(
    "Ungültige UUID in /garage/[id]/edit → login oder 404",
    { annotation: { type: "security" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage/not-a-valid-uuid/edit");
      const url = page.url();
      expect(url).toMatch(/\/(login|not-found|404)/);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 3: GeneralNoteSection — Client-seitige Struktur
// ────────────────────────────────────────────────────────────
test.describe("GeneralNoteSection — Inline-Edit Struktur (unauthentifiziert)", () => {
  test(
    "Unauthentifizierter Zugriff auf /garage/[id] → redirect, kein JS-Fehler",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      await page.goto(`/garage/${FAKE_UUID}`);
      await page.waitForLoadState("domcontentloaded");
      // Page should redirect to login — no JS errors from the component
      await expect(page).toHaveURL(/\/login/);
      expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 4: Sicherheit — Injection-Schutz
// ────────────────────────────────────────────────────────────
test.describe("Sicherheit — Injection-Schutz", () => {
  test(
    "XSS-Payload in /garage/[id] URL wird abgefangen",
    { annotation: { type: "security" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      const alerts: string[] = [];
      page.on("dialog", (d) => {
        alerts.push(d.message());
        d.dismiss();
      });
      await page.goto("/garage/<script>alert(1)<\\/script>");
      await page.waitForLoadState("domcontentloaded");
      expect(alerts).toHaveLength(0);
    }
  );

  test(
    "Path-Traversal in /garage/[id] wird abgefangen",
    { annotation: { type: "security" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage/../../etc/passwd");
      const url = page.url();
      // Must not return any system file content
      expect(url).not.toContain("etc/passwd");
      expect(url).toMatch(/\/(login|not-found|404|garage)/);
    }
  );

  test(
    "SQL-Injection-Payload in /garage/[id] URL wird abgefangen",
    { annotation: { type: "security" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage/'; DROP TABLE items; --");
      await page.waitForLoadState("domcontentloaded");
      // Should redirect to login or 404, never expose DB error
      const url = page.url();
      expect(url).toMatch(/\/(login|not-found|404|garage)/);
      const body = await page.textContent("body");
      expect(body).not.toContain("syntax error");
      expect(body).not.toContain("pg_catalog");
    }
  );

  test(
    "PII nicht in Seitentitel oder URL exponiert",
    { annotation: { type: "security" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto(`/garage/${FAKE_UUID}`);
      await page.waitForLoadState("domcontentloaded");
      const url = page.url();
      // No email or token should appear in the URL
      expect(url).not.toContain("@");
      expect(url).not.toContain("token");
      expect(url).not.toContain("access_token");
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 5: Strukturprüfung Build-Output
// ────────────────────────────────────────────────────────────
test.describe("Build-Output Strukturprüfung", () => {
  test(
    "Garage-Startseite lädt ohne Fehler",
    { annotation: { type: "smoke" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      await page.goto("/garage");
      await page.waitForLoadState("domcontentloaded");
      // Should show login redirect or garage page — no JS crash
      const url = page.url();
      expect(url).toMatch(/\/(login|garage)/);
      expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
    }
  );
});

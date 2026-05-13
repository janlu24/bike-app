import { test, expect } from "@playwright/test";

/**
 * PROJ-14 Bike Versioning System (Build-Fokus Edition) — E2E Tests
 *
 * Groups:
 * - "Weiterleitung": unauthenticated access → /login
 * - "Garage Build-Fokus": URL structure for build mode
 * - "Sicherheit": XSS, path traversal, UUID guards in build URLs
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
    "GET /garage?bikeId=<uuid> → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto(`/garage?bikeId=${FAKE_UUID}`);
      await expect(page).toHaveURL(/\/login/);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 2: Build-Fokus URL-Validierung
// ────────────────────────────────────────────────────────────
test.describe("Build-Fokus — URL-Validierung", () => {
  test(
    "Ungültige bikeId in ?bikeId= → login oder garage",
    { annotation: { type: "security" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage?bikeId=not-a-valid-uuid");
      const url = page.url();
      expect(url).toMatch(/\/(login|garage)/);
    }
  );

  test(
    "XSS-Payload in ?bikeId= URL wird abgefangen",
    { annotation: { type: "security" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      const alerts: string[] = [];
      page.on("dialog", (d) => {
        alerts.push(d.message());
        d.dismiss();
      });
      await page.goto("/garage?bikeId=<script>alert(1)</script>");
      await page.waitForLoadState("domcontentloaded");
      expect(alerts).toHaveLength(0);
    }
  );

  test(
    "SQL-Injection in ?bikeId= URL wird abgefangen",
    { annotation: { type: "security" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage?bikeId='; DROP TABLE items; --");
      await page.waitForLoadState("domcontentloaded");
      const url = page.url();
      expect(url).toMatch(/\/(login|garage)/);
      const body = await page.textContent("body");
      expect(body).not.toContain("syntax error");
      expect(body).not.toContain("pg_catalog");
    }
  );

  test(
    "PII nicht in URL exponiert bei Build-Fokus",
    { annotation: { type: "security" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto(`/garage?bikeId=${FAKE_UUID}`);
      await page.waitForLoadState("domcontentloaded");
      const url = page.url();
      expect(url).not.toContain("@");
      expect(url).not.toContain("access_token");
      expect(url).not.toContain("token");
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 3: Garage-Seite — Smoke
// ────────────────────────────────────────────────────────────
test.describe("Build-Output Strukturprüfung", () => {
  test(
    "Garage-Seite lädt ohne JS-Fehler",
    { annotation: { type: "smoke" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      const errors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });
      await page.goto("/garage");
      await page.waitForLoadState("domcontentloaded");
      const url = page.url();
      expect(url).toMatch(/\/(login|garage)/);
      expect(errors.filter((e) => !e.includes("favicon"))).toHaveLength(0);
    }
  );
});

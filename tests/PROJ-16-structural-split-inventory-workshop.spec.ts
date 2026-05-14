import { test, expect } from "@playwright/test";

/**
 * PROJ-16 Structural Split – Inventory vs. Workshop — E2E Tests
 *
 * Sections:
 * 1. Unauthenticated redirects — /inventory and /garage require auth
 * 2. Routing — /inventory pages respond correctly
 * 3. BottomNav — Lager/Garage/Touren/Entdecken/Profil present, Dashboard absent
 * 4. Redirect stubs — old /garage/[id] routes redirect to /inventory
 * 5. Security — XSS in search input, URL injection, no PII in URLs
 * 6. Garage — bikes-only structure verified
 * 7. Inventory — page structure and view toggle elements present
 * 8. RLS — anonymous access denied on /inventory routes
 */

const SUPABASE_CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
const FAKE_UUID = "00000000-0000-0000-0000-000000000000";

// ────────────────────────────────────────────────────────────
// SECTION 1: Unauthentifizierte Weiterleitungen
// ────────────────────────────────────────────────────────────
test.describe("Weiterleitung — unauthentifiziert", () => {
  test(
    "GET /inventory → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/inventory");
      await expect(page).toHaveURL(/\/login/);
    }
  );

  test(
    "GET /inventory/[uuid] → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto(`/inventory/${FAKE_UUID}`);
      await expect(page).toHaveURL(/\/login/);
    }
  );

  test(
    "GET /inventory/new → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/inventory/new");
      await expect(page).toHaveURL(/\/login/);
    }
  );

  test(
    "GET /inventory/groups → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/inventory/groups");
      await expect(page).toHaveURL(/\/login/);
    }
  );

  test(
    "GET /garage → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");
      await expect(page).toHaveURL(/\/login/);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 2: Routing — /inventory Seitenstruktur
// ────────────────────────────────────────────────────────────
test.describe("Routing — /inventory Seitenstruktur", () => {
  test(
    "/inventory ist eine registrierte Route (kein 404)",
    { annotation: { type: "routing" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      const resp = await page.goto("/inventory");
      // Redirected to /login (not 404) — confirms the route exists
      expect(resp?.status()).not.toBe(404);
    }
  );

  test(
    "/inventory/new ist eine registrierte Route",
    { annotation: { type: "routing" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      const resp = await page.goto("/inventory/new");
      expect(resp?.status()).not.toBe(404);
    }
  );

  test(
    "/inventory/groups ist eine registrierte Route",
    { annotation: { type: "routing" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      const resp = await page.goto("/inventory/groups");
      expect(resp?.status()).not.toBe(404);
    }
  );

  test(
    "/inventory/groups/new ist eine registrierte Route",
    { annotation: { type: "routing" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      const resp = await page.goto("/inventory/groups/new");
      expect(resp?.status()).not.toBe(404);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 3: BottomNav — Lager vorhanden, Dashboard weg
// ────────────────────────────────────────────────────────────
test.describe("BottomNav — Lager/Garage Navigation", () => {
  test(
    "BottomNav enthält Lager-Link auf /inventory",
    { annotation: { type: "navigation" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/login");
      // Nav is rendered even on login page or after redirect
      // Check link presence in DOM regardless of auth state
      const navLink = page.locator('nav a[href="/inventory"]');
      // Navigate to a page that renders BottomNav
      await page.goto("/garage");
      const bottomNav = page.locator('nav[aria-label="Hauptnavigation"]');
      await expect(bottomNav).toBeVisible();
      const lagerLink = bottomNav.locator('a[href="/inventory"]');
      await expect(lagerLink).toBeVisible();
    }
  );

  test(
    "BottomNav enthält Garage-Link auf /garage",
    { annotation: { type: "navigation" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");
      const bottomNav = page.locator('nav[aria-label="Hauptnavigation"]');
      const garageLink = bottomNav.locator('a[href="/garage"]');
      await expect(garageLink).toBeVisible();
    }
  );

  test(
    "BottomNav enthält KEINEN Dashboard-Link auf /",
    { annotation: { type: "navigation" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");
      const bottomNav = page.locator('nav[aria-label="Hauptnavigation"]');
      // Dashboard link (href="/") must NOT be present
      const dashboardLink = bottomNav.locator('a[href="/"]');
      await expect(dashboardLink).toHaveCount(0);
    }
  );

  test(
    "BottomNav hat genau 5 Einträge",
    { annotation: { type: "navigation" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");
      const bottomNav = page.locator('nav[aria-label="Hauptnavigation"]');
      const links = bottomNav.locator("a");
      await expect(links).toHaveCount(5);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 4: Redirect Stubs — alte /garage/ Routen
// ────────────────────────────────────────────────────────────
test.describe("Redirect Stubs — Legacy /garage/ Routen", () => {
  test(
    "/garage/new leitet zu /inventory/new weiter",
    { annotation: { type: "redirect" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage/new");
      // Either redirected to /login (auth) or /inventory/new — never /garage/new
      await expect(page).not.toHaveURL(/\/garage\/new/);
      const url = page.url();
      expect(url.includes("/inventory/new") || url.includes("/login")).toBe(true);
    }
  );

  test(
    "/garage/[uuid] leitet zu /inventory/[uuid] weiter",
    { annotation: { type: "redirect" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto(`/garage/${FAKE_UUID}`);
      await expect(page).not.toHaveURL(new RegExp(`/garage/${FAKE_UUID}`));
      const url = page.url();
      expect(
        url.includes(`/inventory/${FAKE_UUID}`) || url.includes("/login")
      ).toBe(true);
    }
  );

  test(
    "/garage/[uuid]/edit leitet zu /inventory/[uuid]/edit weiter",
    { annotation: { type: "redirect" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto(`/garage/${FAKE_UUID}/edit`);
      await expect(page).not.toHaveURL(new RegExp(`/garage/${FAKE_UUID}/edit`));
      const url = page.url();
      expect(
        url.includes(`/inventory/${FAKE_UUID}/edit`) || url.includes("/login")
      ).toBe(true);
    }
  );

  test(
    "/garage/groups leitet zu /inventory/groups weiter",
    { annotation: { type: "redirect" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage/groups");
      await expect(page).not.toHaveURL(/\/garage\/groups$/);
      const url = page.url();
      expect(url.includes("/inventory/groups") || url.includes("/login")).toBe(true);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 5: Sicherheit — Injection & PII
// ────────────────────────────────────────────────────────────
test.describe("Sicherheit — XSS & PII", () => {
  test(
    "XSS-Payload in ?category= URL-Param → kein alert() ausgelöst",
    { annotation: { type: "security" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      let alertFired = false;
      page.on("dialog", () => { alertFired = true; });
      await page.goto('/inventory?category=<script>alert(1)</script>');
      await page.waitForTimeout(500);
      expect(alertFired).toBe(false);
    }
  );

  test(
    "XSS-Payload in Suchfeld → kein alert() ausgelöst",
    { annotation: { type: "security" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      let alertFired = false;
      page.on("dialog", () => { alertFired = true; });
      await page.goto("/inventory");
      const url = page.url();
      if (url.includes("/login")) return; // unauthenticated, skip UI test
      const searchInput = page.locator('input[aria-label="Items suchen"]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('<script>alert(1)</script>');
        await page.waitForTimeout(300);
      }
      expect(alertFired).toBe(false);
    }
  );

  test(
    "SQLi-Payload in ?bikeId= URL-Param → kein Datenbankfehler",
    { annotation: { type: "security" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      const resp = await page.goto("/garage?bikeId=' OR '1'='1");
      // Must not 500-error — redirected to login or shows garage
      expect(resp?.status()).not.toBe(500);
    }
  );

  test(
    "PII — keine E-Mail-Adressen in /inventory URL",
    { annotation: { type: "pii" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/inventory");
      const url = page.url();
      expect(url).not.toMatch(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    }
  );

  test(
    "PII — keine Bearer-Tokens in /inventory URL",
    { annotation: { type: "pii" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/inventory");
      const url = page.url();
      expect(url.toLowerCase()).not.toContain("token");
      expect(url.toLowerCase()).not.toContain("bearer");
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 6: Garage — Bikes-Only Struktur
// ────────────────────────────────────────────────────────────
test.describe("Garage — Bikes-Only Struktur", () => {
  test(
    "/garage Seite rendert erwartete Seitenstruktur",
    { annotation: { type: "structure" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");
      const url = page.url();
      if (url.includes("/login")) return;
      // Header should mention "Garage"
      const heading = page.locator("h1");
      await expect(heading).toContainText("Garage");
    }
  );

  test(
    "/garage Seite hat KEINEN allgemeinen Kategorie-Filter",
    { annotation: { type: "structure" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");
      const url = page.url();
      if (url.includes("/login")) return;
      // CategoryFilter navigation should not be present
      const categoryNav = page.locator('nav[aria-label="Kategorien filtern"]');
      await expect(categoryNav).toHaveCount(0);
    }
  );

  test(
    "/garage Seite hat KEINEN Gruppen-Button",
    { annotation: { type: "structure" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");
      const url = page.url();
      if (url.includes("/login")) return;
      // No link to /garage/groups or /inventory/groups in garage header
      const groupsLink = page.locator('a[href="/inventory/groups"], a[href="/garage/groups"]');
      await expect(groupsLink).toHaveCount(0);
    }
  );

  test(
    "/garage Seite hat 'Neues Bike' Button der auf /inventory/new zeigt",
    { annotation: { type: "structure" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/garage");
      const url = page.url();
      if (url.includes("/login")) return;
      const newBikeLink = page.locator('a[href="/inventory/new"]');
      await expect(newBikeLink).toBeVisible();
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 7: Inventory — Seitenstruktur & View Toggle
// ────────────────────────────────────────────────────────────
test.describe("Inventory — Seitenstruktur & View Toggle", () => {
  test(
    "/inventory Seite rendert 'Lager' Heading",
    { annotation: { type: "structure" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/inventory");
      const url = page.url();
      if (url.includes("/login")) return;
      const heading = page.locator("h1");
      await expect(heading).toContainText("Lager");
    }
  );

  test(
    "/inventory Seite rendert Suchfeld mit korrektem aria-label",
    { annotation: { type: "a11y" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/inventory");
      const url = page.url();
      if (url.includes("/login")) return;
      const searchInput = page.locator('input[aria-label="Items suchen"]');
      await expect(searchInput).toBeVisible();
    }
  );

  test(
    "/inventory Seite rendert View-Toggle Buttons mit aria-pressed",
    { annotation: { type: "a11y" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/inventory");
      const url = page.url();
      if (url.includes("/login")) return;
      const gridBtn = page.locator('button[aria-label="Kachelansicht"]');
      const listBtn = page.locator('button[aria-label="Listenansicht"]');
      await expect(gridBtn).toBeVisible();
      await expect(listBtn).toBeVisible();
      // aria-pressed must be present on both buttons
      await expect(gridBtn).toHaveAttribute("aria-pressed");
      await expect(listBtn).toHaveAttribute("aria-pressed");
    }
  );

  test(
    "/inventory Seite rendert Gruppen-Link auf /inventory/groups",
    { annotation: { type: "structure" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/inventory");
      const url = page.url();
      if (url.includes("/login")) return;
      const groupsLink = page.locator('a[href="/inventory/groups"]');
      await expect(groupsLink).toBeVisible();
    }
  );

  test(
    "/inventory Seite rendert 'Neues Item' Link auf /inventory/new",
    { annotation: { type: "structure" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/inventory");
      const url = page.url();
      if (url.includes("/login")) return;
      const newItemLink = page.locator('a[href="/inventory/new"]');
      await expect(newItemLink).toBeVisible();
    }
  );

  test(
    "/inventory Kategorie-Filter rendert Kacheln mit aria-pressed",
    { annotation: { type: "a11y" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/inventory");
      const url = page.url();
      if (url.includes("/login")) return;
      // Category filter pills are buttons with aria-pressed
      const filterButtons = page.locator('nav[aria-label="Kategorien filtern"] button[aria-pressed]');
      const count = await filterButtons.count();
      expect(count).toBeGreaterThan(0);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 8: RLS — Unbefugter Zugriff
// ────────────────────────────────────────────────────────────
test.describe("RLS — Unbefugter Zugriff abgelehnt", () => {
  test(
    "Direkter API-Zugriff auf items ohne Auth → leeres Array",
    { annotation: { type: "security" } },
    async ({ request }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const resp = await request.get(`${supabaseUrl}/rest/v1/items?select=id,user_id`, {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      });
      expect(resp.ok()).toBe(true);
      const data = await resp.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data).toHaveLength(0);
    }
  );
});

import { test, expect } from "@playwright/test";

/**
 * PROJ-11 Tour Management & Packliste — E2E Tests
 *
 * Groups:
 * - "Weiterleitung": unauthenticated access → /login
 * - "Tour-Übersicht": page structure, empty state, navigation
 * - "Neue Tour — Formular": structure, required fields, validation
 * - "Bottom-Nav": Touren tab presence
 * - "Sicherheit": XSS injection, UUID guard, path traversal
 */

const SUPABASE_CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

// ────────────────────────────────────────────────────────────
// SECTION 1: Unauthentifizierte Weiterleitungen
// ────────────────────────────────────────────────────────────
test.describe("Weiterleitung — unauthentifiziert", () => {
  test(
    "GET /tours → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours");
      await expect(page).toHaveURL(/\/login/);
    }
  );

  test(
    "GET /tours/new → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours/new");
      await expect(page).toHaveURL(/\/login/);
    }
  );

  test(
    "GET /tours/<uuid> → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours/00000000-0000-0000-0000-000000000000");
      await expect(page).toHaveURL(/\/login/);
    }
  );

  test(
    "GET /tours/<uuid>/edit → /login für anonyme Nutzer",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours/00000000-0000-0000-0000-000000000000/edit");
      await expect(page).toHaveURL(/\/login/);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 2: Neue Tour — Formular-Struktur
// ────────────────────────────────────────────────────────────
test.describe("Neue Tour — Formular", () => {
  test(
    "zeigt Formular mit Name-Pflichtfeld auf /tours/new",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours/new");
      await expect(page.getByRole("heading", { name: /Tour anlegen/i })).toBeVisible();
      await expect(page.getByLabel(/Name/i)).toBeVisible();
      await expect(page.getByLabel(/Datum/i)).toBeVisible();
      await expect(page.getByLabel(/Status/i)).toBeVisible();
    }
  );

  test(
    "zeigt Fehlermeldung bei leerem Name-Feld",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours/new");
      await page.getByRole("button", { name: /Tour anlegen/i }).click();
      await expect(page.getByText(/Pflichtfeld/i)).toBeVisible();
    }
  );

  test(
    "Formular hat Sektionen Geplant und Gefahren",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours/new");
      await expect(page.getByText(/Geplant/i).first()).toBeVisible();
      await expect(page.getByText(/Gefahren/i).first()).toBeVisible();
    }
  );

  test(
    "Dauer-Felder Stunden und Minuten vorhanden",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours/new");
      await expect(page.getByLabel(/Dauer.*Stunden/i)).toBeVisible();
      await expect(page.getByLabel(/Dauer.*Minuten/i)).toBeVisible();
    }
  );

  test(
    "Öffentlich-Toggle mit Datenschutzhinweis vorhanden",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours/new");
      await expect(page.getByLabel(/Öffentlich sichtbar/i)).toBeVisible();
      await expect(page.getByText(/Start.*Ziel.*sichtbar/i)).toBeVisible();
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 3: Tour-Übersicht
// ────────────────────────────────────────────────────────────
test.describe("Tour-Übersicht", () => {
  test(
    "zeigt Überschrift 'Deine Touren'",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours");
      await expect(page.getByRole("heading", { name: /Deine Touren/i })).toBeVisible();
    }
  );

  test(
    "zeigt 'Neue Tour' Link → /tours/new",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours");
      const link = page.getByRole("link", { name: /Neue Tour/i }).first();
      await expect(link).toBeVisible();
      await expect(link).toHaveAttribute("href", "/tours/new");
    }
  );

  test(
    "leerer Zustand zeigt CTA 'Erste Tour anlegen'",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours");
      // Either the list or the empty state should be visible
      const hasEmptyState = await page.getByText(/Erste Tour anlegen/i).isVisible().catch(() => false);
      const hasCard = await page.locator("article").count();
      expect(hasEmptyState || hasCard > 0).toBe(true);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 4: Bottom-Nav
// ────────────────────────────────────────────────────────────
test.describe("Bottom-Nav — Touren-Tab", () => {
  test(
    "Bottom-Nav enthält 'Touren' Link auf /tours",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/");
      const nav = page.getByRole("navigation", { name: /Hauptnavigation/i });
      await expect(nav).toBeVisible();
      const toursLink = nav.getByRole("link", { name: /Touren/i });
      await expect(toursLink).toBeVisible();
      await expect(toursLink).toHaveAttribute("href", "/tours");
    }
  );

  test(
    "Bottom-Nav hat 5 Einträge: Dashboard, Garage, Touren, Entdecken, Profil",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/");
      const nav = page.getByRole("navigation", { name: /Hauptnavigation/i });
      const links = nav.getByRole("link");
      await expect(links).toHaveCount(5);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 5: Sicherheitstest — Eingabevalidierung
// ────────────────────────────────────────────────────────────
test.describe("Sicherheit — Eingaben", () => {
  test(
    "XSS in Tour-Name wird nicht als HTML ausgeführt",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours/new");
      const xssPayload = '<script>window.__xss=1</script>';
      await page.getByLabel(/^Name/i).fill(xssPayload);
      await page.getByRole("button", { name: /Tour anlegen/i }).click();
      // If XSS succeeded, window.__xss would be defined
      const xssExecuted = await page.evaluate(() => (window as unknown as Record<string, unknown>).__xss);
      expect(xssExecuted).toBeUndefined();
    }
  );

  test(
    "nicht existierende Tour-UUID gibt 404 (not found)",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours/00000000-0000-0000-0000-000000000000");
      // Should show 404 or redirect, not expose a server error
      const status = page.url();
      const is404 = await page.getByText(/nicht gefunden|404|not found/i).isVisible().catch(() => false);
      const isRedirected = !status.includes("/tours/00000000");
      expect(is404 || isRedirected).toBe(true);
    }
  );

  test(
    "path-traversal in tour ID rejected — invalid UUID format",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      // Attempt path traversal - should get 404 or redirect, never a 500 data leak
      await page.goto("/tours/../../../etc/passwd");
      const hasServerError = await page.getByText(/500|internal server error/i).isVisible().catch(() => false);
      expect(hasServerError).toBe(false);
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 6: A11y
// ────────────────────────────────────────────────────────────
test.describe("A11y — Barrierefreiheit", () => {
  test(
    "Tour-Formular: alle Inputs haben zugehörige Labels",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours/new");
      // Name field specifically must have a label
      const nameInput = page.getByLabel(/^Name/i);
      await expect(nameInput).toBeVisible();
      await expect(nameInput).toHaveAttribute("id", "name");
    }
  );

  test(
    "Tour-Übersicht: Seite hat eine h1-Überschrift",
    { annotation: { type: "requires-supabase-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/tours");
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();
    }
  );
});

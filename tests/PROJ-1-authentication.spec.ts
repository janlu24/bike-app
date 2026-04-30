import { test, expect } from "@playwright/test";

/**
 * PROJ-1 Authentication — E2E Tests
 *
 * Tests sind in zwei Gruppen unterteilt:
 * - "ohne Supabase": Laufen immer (UI-Rendering, Barrierefreiheit, Open-Redirect-Check)
 * - "mit Supabase": Erfordern NEXT_PUBLIC_SUPABASE_URL in .env.local
 *   (Form-Validierungsfehler, Auth-Redirects via Proxy)
 */

const SUPABASE_CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

// ---------------------------------------------------------------------------
// UI-Rendering (kein Supabase nötig)
// ---------------------------------------------------------------------------

test.describe("Login-Seite UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("zeigt Logo, Überschrift und Formular", async ({ page }) => {
    await expect(page.getByText("Setup")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Willkommen zurück" })).toBeVisible();
    await expect(page.getByLabel("E-Mail")).toBeVisible();
    await expect(page.getByLabel("Passwort")).toBeVisible();
  });

  test("Anmelden- und Neues-Konto-Button sind sichtbar", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Anmelden" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Neues Konto" })).toBeVisible();
  });

  test("E-Mail-Feld hat korrekten Typ und autocomplete", async ({ page }) => {
    const emailInput = page.getByLabel("E-Mail");
    await expect(emailInput).toHaveAttribute("type", "email");
    await expect(emailInput).toHaveAttribute("autocomplete", "email");
  });

  test("Passwort-Feld hat korrekten Typ und autocomplete", async ({ page }) => {
    const passwordInput = page.getByLabel("Passwort");
    await expect(passwordInput).toHaveAttribute("type", "password");
    await expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
  });

  test("Seite hat keinen doppelten id-Attribut", async ({ page }) => {
    const duplicateIds = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll("[id]")).map((el) => el.id);
      return ids.filter((id, i) => ids.indexOf(id) !== i);
    });
    expect(duplicateIds).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Barrierefreiheit (kein Supabase nötig)
// ---------------------------------------------------------------------------

test.describe("Tastaturnavigation & A11y", () => {
  test("Formular ist vollständig per Tastatur bedienbar", async ({ page }) => {
    await page.goto("/login");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("E-Mail")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Passwort")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Anmelden" })).toBeFocused();
  });
});

// ---------------------------------------------------------------------------
// Security: Open Redirect (kein Supabase nötig)
// ---------------------------------------------------------------------------

test.describe("Security — Open Redirect", () => {
  test("auth/callback mit externem next-Parameter bleibt auf der Domain", async ({ page }) => {
    await page.goto("/auth/callback?next=https://evil.com");
    expect(page.url()).not.toContain("evil.com");
  });

  test("auth/callback mit protocol-relative next bleibt auf der Domain", async ({ page }) => {
    await page.goto("/auth/callback?next=//evil.com");
    expect(page.url()).not.toContain("evil.com");
  });
});

// ---------------------------------------------------------------------------
// Form-Validierung via Server Action (benötigt Supabase für Dev-Server)
// ---------------------------------------------------------------------------

test.describe("Form-Validierung", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, "Übersprungen: NEXT_PUBLIC_SUPABASE_URL nicht gesetzt");
    await page.goto("/login");
  });

  test("zeigt Fehlermeldung bei leerem Formular-Submit", async ({ page }) => {
    await page.getByRole("button", { name: "Anmelden" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("alert")).toContainText("E-Mail");
  });

  test("zeigt Fehlermeldung bei zu kurzem Passwort", async ({ page }) => {
    await page.getByLabel("E-Mail").fill("test@example.com");
    await page.getByLabel("Passwort").fill("kurz");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("alert")).toContainText("8 Zeichen");
  });

  test("zeigt Fehlermeldung bei ungültiger E-Mail", async ({ page }) => {
    await page.getByLabel("E-Mail").fill("kein-email");
    await page.getByLabel("Passwort").fill("passwort123");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("alert")).toContainText("E-Mail");
  });

  test("zeigt Fehlermeldung bei falschen Zugangsdaten", async ({ page }) => {
    await page.getByLabel("E-Mail").fill("falsch@example.com");
    await page.getByLabel("Passwort").fill("falschespasswort");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("alert")).toContainText("ungültige Zugangsdaten");
  });
});

// ---------------------------------------------------------------------------
// Auth-Redirect-Verhalten via Proxy (benötigt Supabase)
// ---------------------------------------------------------------------------

test.describe("Redirect-Verhalten", () => {
  test.beforeEach(() => {
    test.skip(!SUPABASE_CONFIGURED, "Übersprungen: NEXT_PUBLIC_SUPABASE_URL nicht gesetzt");
  });

  test("unauthentifizierter Zugriff auf /garage → /login", async ({ page }) => {
    await page.goto("/garage");
    await expect(page).toHaveURL("/login");
  });

  test("unauthentifizierter Zugriff auf /profile → /login", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL("/login");
  });

  test("unauthentifizierter Zugriff auf /onboarding → /login", async ({ page }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL("/login");
  });

  test("/explore ist ohne Login erreichbar", async ({ page }) => {
    const response = await page.goto("/explore");
    expect(page.url()).not.toContain("/login");
    expect([200, 404]).toContain(response?.status());
  });
});

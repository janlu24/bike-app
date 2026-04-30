import { test, expect } from "@playwright/test";

/**
 * PROJ-2 Onboarding & Profil-Setup — E2E Tests
 *
 * Gruppen:
 * - "ohne Supabase": UI-Rendering, A11y, Zod-Validierung (kein DB-Call nötig,
 *   da Zod vor createSupabaseServerClient() ausgeführt wird)
 * - "mit Supabase": Erfolgreiche Profilanlage, Redirect, Duplikat-Username
 */

const SUPABASE_CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

// ---------------------------------------------------------------------------
// UI-Rendering (kein Supabase nötig)
// ---------------------------------------------------------------------------

test.describe("Onboarding-Seite UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding");
  });

  test("zeigt Logo, Überschrift und Unterzeile", async ({ page }) => {
    await expect(page.getByText("Setup")).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Profil einrichten" })
    ).toBeVisible();
    await expect(
      page.getByText("Wähle einen Benutzernamen für dein Konto.")
    ).toBeVisible();
  });

  test("zeigt Username-Feld mit korrekten Attributen", async ({ page }) => {
    const input = page.getByLabel("Benutzername");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("required", "");
    await expect(input).toHaveAttribute("minlength", "3");
    await expect(input).toHaveAttribute("maxlength", "32");
    await expect(input).toHaveAttribute("autocomplete", "username");
  });

  test("zeigt Permanenz-Hinweis 'dauerhaft eindeutig' im Label und Footer", async ({
    page,
  }) => {
    await expect(page.getByText("dauerhaft eindeutig")).toHaveCount(2);
  });

  test("zeigt Anzeigename-Feld (optional)", async ({ page }) => {
    const input = page.getByLabel("Anzeigename");
    await expect(input).toBeVisible();
    await expect(input).toHaveAttribute("autocomplete", "name");
    await expect(input).toHaveAttribute("maxlength", "80");
    await expect(input).not.toHaveAttribute("required");
  });

  test("zeigt is_public Switch und Text", async ({ page }) => {
    await expect(
      page.getByText("Profil öffentlich machen")
    ).toBeVisible();
    await expect(
      page.getByRole("switch", { name: "Profil öffentlich machen" })
    ).toBeVisible();
  });

  test("Switch ist anfangs deaktiviert (not checked)", async ({ page }) => {
    const sw = page.getByRole("switch", { name: "Profil öffentlich machen" });
    await expect(sw).toHaveAttribute("aria-checked", "false");
  });

  test("Switch lässt sich umschalten", async ({ page }) => {
    const sw = page.getByRole("switch", { name: "Profil öffentlich machen" });
    await sw.click();
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await sw.click();
    await expect(sw).toHaveAttribute("aria-checked", "false");
  });

  test("zeigt Submit-Button 'Profil anlegen'", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: "Profil anlegen" })
    ).toBeVisible();
  });

  test("keine doppelten id-Attribute", async ({ page }) => {
    const duplicateIds = await page.evaluate(() => {
      const ids = Array.from(document.querySelectorAll("[id]")).map(
        (el) => el.id
      );
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
    await page.goto("/onboarding");
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Benutzername")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByLabel("Anzeigename")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("switch", { name: "Profil öffentlich machen" })
    ).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "Profil anlegen" })
    ).toBeFocused();
  });

  test("Username-Feld ist mit Hint-Text verknüpft (aria-describedby)", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    const input = page.getByLabel("Benutzername");
    const describedBy = await input.getAttribute("aria-describedby");
    expect(describedBy).toBe("username-hint");
    await expect(page.locator("#username-hint")).toBeVisible();
  });

  test("Label-Klick auf 'Profil öffentlich machen' schaltet Switch um", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    const sw = page.getByRole("switch", { name: "Profil öffentlich machen" });
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await page.getByText("Profil öffentlich machen").first().click();
    await expect(sw).toHaveAttribute("aria-checked", "true");
  });
});

// ---------------------------------------------------------------------------
// Zod-Validierung (läuft ohne Supabase — Zod-Check vor DB-Client)
// ---------------------------------------------------------------------------

test.describe("Formular-Validierung (Zod)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding");
  });

  test("leeres Formular → Fehlermeldung bei Username", async ({ page }) => {
    await page.getByRole("button", { name: "Profil anlegen" }).click();
    await expect(page.locator("#username-error")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("#username-error")).toContainText("3");
  });

  test("Username < 3 Zeichen → Fehlermeldung", async ({ page }) => {
    await page.getByLabel("Benutzername").fill("ab");
    await page.getByRole("button", { name: "Profil anlegen" }).click();
    await expect(page.locator("#username-error")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("#username-error")).toContainText("3");
  });

  test("Username mit Space → Fehlermeldung", async ({ page }) => {
    await page.getByLabel("Benutzername").fill("my user");
    await page.getByRole("button", { name: "Profil anlegen" }).click();
    await expect(page.locator("#username-error")).toBeVisible({ timeout: 8000 });
  });

  test("Username mit Sonderzeichen (@) → Fehlermeldung", async ({ page }) => {
    await page.getByLabel("Benutzername").fill("user@name");
    await page.getByRole("button", { name: "Profil anlegen" }).click();
    await expect(page.locator("#username-error")).toBeVisible({ timeout: 8000 });
  });

  test("Username mit führendem Bindestrich → Fehlermeldung", async ({
    page,
  }) => {
    await page.getByLabel("Benutzername").fill("-username");
    await page.getByRole("button", { name: "Profil anlegen" }).click();
    await expect(page.locator("#username-error")).toBeVisible({ timeout: 8000 });
  });

  test("Anzeigename > 80 Zeichen → Fehlermeldung", async ({ page }) => {
    await page.getByLabel("Benutzername").fill("validuser");
    // bypass maxLength=80 attribute to test server-side Zod validation
    await page.locator('input[name="full_name"]').evaluate(
      (el: HTMLInputElement, val) => { el.value = val; },
      "a".repeat(81)
    );
    await page.getByRole("button", { name: "Profil anlegen" }).click();
    await expect(page.locator("#full-name-error")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("#full-name-error")).toContainText("80");
  });

  test("Fehlermeldung bei Username ändert aria-describedby", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Profil anlegen" }).click();
    await expect(page.locator("#username-error")).toBeVisible({ timeout: 8000 });
    const input = page.getByLabel("Benutzername");
    const describedBy = await input.getAttribute("aria-describedby");
    expect(describedBy).toBe("username-error");
  });

  test("gültige Eingabe ohne Supabase → Sitzung-abgelaufen-Fehler (kein Crash)", async ({
    page,
  }) => {
    test.skip(SUPABASE_CONFIGURED, "Übersprungen: Supabase ist konfiguriert");
    await page.getByLabel("Benutzername").fill("validuser");
    await page.getByRole("button", { name: "Profil anlegen" }).click();
    // Ohne Supabase wirft createSupabaseServerClient() — Next.js zeigt Error-UI
    // Test prüft nur, dass die Seite nicht hängt
    await page.waitForLoadState("networkidle", { timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Security: XSS-Injection-Versuche (kein Supabase nötig für Validierung)
// ---------------------------------------------------------------------------

test.describe("Security — Injection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding");
  });

  test("XSS im Username-Feld wird durch Zod-Regex blockiert", async ({
    page,
  }) => {
    await page.getByLabel("Benutzername").fill("<script>alert(1)</script>");
    await page.getByRole("button", { name: "Profil anlegen" }).click();
    await expect(page.locator("#username-error")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("text=alert(1)")).toHaveCount(0);
  });

  test("SQL-Injection im Username wird durch Zod-Regex blockiert", async ({
    page,
  }) => {
    await page.getByLabel("Benutzername").fill("'; DROP TABLE profiles;--");
    await page.getByRole("button", { name: "Profil anlegen" }).click();
    await expect(page.locator("#username-error")).toBeVisible({ timeout: 8000 });
  });
});

// ---------------------------------------------------------------------------
// Redirect-Verhalten (benötigt Supabase)
// ---------------------------------------------------------------------------

test.describe("Redirect-Verhalten", () => {
  test.beforeEach(() => {
    test.skip(!SUPABASE_CONFIGURED, "Übersprungen: NEXT_PUBLIC_SUPABASE_URL nicht gesetzt");
  });

  test("nicht eingeloggter Nutzer auf /onboarding → /login", async ({
    page,
  }) => {
    await page.goto("/onboarding");
    await expect(page).toHaveURL("/login");
  });
});

// ---------------------------------------------------------------------------
// Profilanlage via Server Action (benötigt Supabase + eingeloggten Nutzer)
// ---------------------------------------------------------------------------

test.describe("Profilanlage (Supabase)", () => {
  test.beforeEach(() => {
    test.skip(
      !SUPABASE_CONFIGURED,
      "Übersprungen: NEXT_PUBLIC_SUPABASE_URL nicht gesetzt"
    );
  });

  test("doppelter Username → deutsches Inline-Fehler, kein Redirect", async ({
    page,
  }) => {
    // Dieser Test setzt voraus, dass ein Nutzer mit dem Username "existing" bereits existiert.
    // Muss mit einem eingeloggten Test-Account aufgerufen werden.
    await page.goto("/onboarding");
    await page.getByLabel("Benutzername").fill("existing");
    await page.getByRole("button", { name: "Profil anlegen" }).click();
    await expect(page.locator("#username-error")).toBeVisible({ timeout: 8000 });
    await expect(page.locator("#username-error")).toContainText("vergeben");
    await expect(page).toHaveURL("/onboarding");
  });
});

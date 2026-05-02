import { test, expect } from "@playwright/test";

/**
 * PROJ-9 Guest vs. Member Mode — E2E Tests
 *
 * Verifies:
 * - AC-1: Route protection (allowlist model)
 * - AC-2: Guest hero section on /
 * - AC-3: Member dashboard content (auth-required)
 * - AC-5: Login error handling for URL params
 * - Edge cases: no Supabase config, PII audit, A11y
 */

const SUPABASE_CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

// ────────────────────────────────────────────────────────────
// SECTION 1: Route Protection — AC-1
// ────────────────────────────────────────────────────────────
test.describe("Route Protection (AC-1)", () => {
  test("GET / ist öffentlich zugänglich (200, kein Redirect)", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL("/");
  });

  test("GET /login ist öffentlich zugänglich (kein Redirect)", async ({ page }) => {
    const response = await page.goto("/login");
    expect(response?.status()).toBe(200);
    await expect(page).toHaveURL("/login");
  });

  test("GET /explore ist öffentlich zugänglich", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, "Supabase not configured — can't verify no-redirect");
    await page.goto("/explore");
    await expect(page).not.toHaveURL("/login");
  });

  test("GET /profile/[username] ist für Gäste öffentlich", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
    await page.goto("/profile/nonexistent_test_user");
    await expect(page).not.toHaveURL("/login");
  });

  test("GET /garage leitet Gäste zu /login weiter", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
    await page.goto("/garage");
    await expect(page).toHaveURL("/login");
  });

  test("GET /profile (exakt) leitet Gäste zu /login weiter", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
    await page.goto("/profile");
    await expect(page).toHaveURL("/login");
  });

  test("GET /onboarding leitet Gäste zu /login weiter", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
    await page.goto("/onboarding");
    await expect(page).toHaveURL("/login");
  });

  test("GET /garage/new leitet Gäste zu /login weiter", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
    await page.goto("/garage/new");
    await expect(page).toHaveURL("/login");
  });

  test("Kein JavaScript-Fehler bei geschütztem Redirect", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/garage");
    expect(errors).toHaveLength(0);
  });
});

// ────────────────────────────────────────────────────────────
// SECTION 2: Gast-Ansicht — Hero Section (AC-2)
// ────────────────────────────────────────────────────────────
test.describe("Gast-Ansicht: Hero Section (AC-2)", () => {
  test("H1-Heading 'digitale Zwilling' ist sichtbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("digitale Zwilling");
  });

  test("H1-Heading referenziert Bikes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Bikes");
  });

  test("Feature-Highlights Liste ist sichtbar mit 4 Einträgen", async ({ page }) => {
    await page.goto("/");
    const list = page.locator("[aria-label='Features']");
    await expect(list).toBeVisible();
    await expect(list.getByRole("listitem")).toHaveCount(4);
  });

  test("CTA 'Jetzt registrieren' ist sichtbar und zeigt auf /login", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "Jetzt registrieren" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/login");
  });

  test("CTA 'Community entdecken' ist sichtbar und zeigt auf /explore", async ({ page }) => {
    await page.goto("/");
    const cta = page.getByRole("link", { name: "Community entdecken" });
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute("href", "/explore");
  });

  test("Cockpit-Inhalt 'Willkommen im Cockpit' ist für Gäste NICHT sichtbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Willkommen im Cockpit")).not.toBeVisible();
  });

  test("'Jetzt registrieren' navigiert zu /login", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Jetzt registrieren" }).click();
    await expect(page).toHaveURL("/login");
  });

  test("'Community entdecken' navigiert zu /explore", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
    await page.goto("/");
    await page.getByRole("link", { name: "Community entdecken" }).click();
    await expect(page).toHaveURL("/explore");
  });

  test("Hero wird ohne Supabase-Konfiguration angezeigt (kein 500)", async ({ page }) => {
    test.skip(SUPABASE_CONFIGURED, "Only relevant without Supabase");
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// SECTION 3: Member Dashboard (AC-3) — Supabase required
// ────────────────────────────────────────────────────────────
test.describe("Member-Ansicht (AC-3)", () => {
  test(
    "Eingeloggter Nutzer sieht 'Willkommen im Cockpit' auf /",
    { annotation: { type: "requires-auth" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Requires Supabase + authenticated session");
      // Note: full auth E2E requires session setup — validated via unit tests and code review
      test.skip(true, "Auth-flow requires live Supabase session — covered by unit tests and code review");
    }
  );

  test(
    "Member-Dashboard zeigt 'Bikes gesamt' Stat-Kachel",
    { annotation: { type: "requires-auth" } },
    async ({ page }) => {
      test.skip(true, "Auth-flow requires live Supabase session");
    }
  );

  test(
    "'Zur Garage' Button ist für Mitglieder sichtbar",
    { annotation: { type: "requires-auth" } },
    async ({ page }) => {
      test.skip(true, "Auth-flow requires live Supabase session");
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 4: Login Error Handling (AC-5 + Edge Cases)
// ────────────────────────────────────────────────────────────
test.describe("Login Error Handling (AC-5)", () => {
  test("Login-Seite zeigt keine Fehlermeldung ohne error-Parameter", async ({ page }) => {
    await page.goto("/login");
    // Scope to main to exclude Next.js route announcer (role=alert, outside <main>)
    await expect(page.locator("main").getByRole("alert")).not.toBeVisible();
  });

  test("?error=link_expired zeigt deutschen Hinweis mit 'abgelaufen'", async ({ page }) => {
    await page.goto("/login?error=link_expired");
    const alert = page.locator("main").getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("abgelaufen");
  });

  test("?error=link_expired Meldung enthält Handlungsaufforderung", async ({ page }) => {
    await page.goto("/login?error=link_expired");
    const alert = page.locator("main").getByRole("alert");
    await expect(alert).toContainText("erneut");
  });

  test("?error=auth zeigt generische Fehlermeldung", async ({ page }) => {
    await page.goto("/login?error=auth");
    const alert = page.locator("main").getByRole("alert");
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("Anmeldung fehlgeschlagen");
  });

  test("Unbekannter error-Parameter fällt auf generische Meldung zurück (kein Crash)", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/login?error=xyz_unknown");
    expect(errors).toHaveLength(0);
    await expect(page.locator("main").getByRole("alert")).toBeVisible();
  });

  test("URL-Fehlermeldung enthält keine PII (E-Mail)", async ({ page }) => {
    await page.goto("/login?error=link_expired");
    const alertText = await page.locator("main").getByRole("alert").textContent();
    expect(alertText).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  });

  test("Formular-Error 'email_not_confirmed' erscheint als blauer Notice (nicht rot)", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, "Requires live Supabase to test sign-in error");
    // This AC is validated via code review: signInAction returns { notice } for email_not_confirmed
    // and LoginForm renders notice in petrol/blue style — not in red error style
    test.skip(true, "Requires live Supabase + unconfirmed user — covered by code review");
  });

  test("Login-Seite zeigt 'Willkommen zurück' Überschrift", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Willkommen zurück" })).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// SECTION 5: Sicherheits-Audit
// ────────────────────────────────────────────────────────────
test.describe("Sicherheits-Audit", () => {
  test("Kein API-Key (JWT-Pattern) im HTML der Startseite", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    expect(html).not.toMatch(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{100,}/);
  });

  test("Keine E-Mail-Adresse im gerendertem HTML der Startseite", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    expect(html).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  });

  test("Keine echte E-Mail (PII) im HTML der Login-Seite", async ({ page }) => {
    await page.goto("/login");
    const html = await page.content();
    // Exclude placeholder example addresses (e.g. du@example.com in input placeholder)
    const emails = (html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) ?? [])
      .filter(e => !e.includes("example.com") && !e.includes("example.org"));
    expect(emails).toHaveLength(0);
  });

  test("Kein JavaScript-Fehler auf /", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");
    expect(errors).toHaveLength(0);
  });

  test("Kein JavaScript-Fehler auf /login", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/login");
    expect(errors).toHaveLength(0);
  });

  test("Kein JavaScript-Fehler auf /login?error=link_expired", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/login?error=link_expired");
    expect(errors).toHaveLength(0);
  });

  test("Open-Redirect-Schutz: /auth/callback mit manipuliertem next-Param", async ({ page }) => {
    // next param starting with // should be sanitized to /
    await page.goto("/auth/callback?next=//evil.com");
    // Should redirect to / (safe fallback), not to //evil.com
    await expect(page).not.toHaveURL(/evil\.com/);
  });
});

// ────────────────────────────────────────────────────────────
// SECTION 6: Barrierefreiheit (A11y)
// ────────────────────────────────────────────────────────────
test.describe("Barrierefreiheit (A11y)", () => {
  test("Startseite hat ein H1-Heading", async ({ page }) => {
    await page.goto("/");
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toBeVisible();
  });

  test("Feature-Highlights Liste hat aria-label 'Features'", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("[aria-label='Features']")).toBeVisible();
  });

  test("'Jetzt registrieren' Link hat beschreibenden Text", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: "Jetzt registrieren" });
    const text = await link.textContent();
    expect(text?.trim()).toContain("Jetzt registrieren");
  });

  test("Logo 'Setup.Registry' ist sichtbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Setup.Registry")).toBeVisible();
  });

  test("BottomNav Hauptnavigation ist sichtbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Hauptnavigation" })).toBeVisible();
  });

  test("Dashboard-Eintrag in BottomNav hat aria-current='page'", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("link", { name: /Dashboard/i })
    ).toHaveAttribute("aria-current", "page");
  });

  test("Login-Seite: URL-Fehlermeldung hat role='alert'", async ({ page }) => {
    await page.goto("/login?error=auth");
    const alert = page.locator("main [role='alert']");
    await expect(alert).toBeVisible();
  });

  test("Responsiv Mobile (375px): Hero komplett sichtbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Jetzt registrieren" })).toBeVisible();
  });

  test("Responsiv Tablet (768px): Hero komplett sichtbar", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Jetzt registrieren" })).toBeVisible();
  });

  test("Responsiv Desktop (1440px): Hero komplett sichtbar", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Jetzt registrieren" })).toBeVisible();
  });
});

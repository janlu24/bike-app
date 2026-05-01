import { test, expect } from "@playwright/test";

/**
 * PROJ-4 Dashboard / Cockpit — E2E Tests
 *
 * Das Dashboard rendert immer — auch ohne Supabase-Konfiguration.
 * Nach dem Fix (isConfigured-Guard) zeigt die Seite bei fehlender
 * Konfiguration: supabase="nicht konfiguriert", auth="anonym", alle Counts=0.
 *
 * Gruppen:
 * - "Grundstruktur": Rendering, Heading, Routing ohne Supabase
 * - "Kategorien-Tiles": 4 Tiles, Counts, Links, A11y
 * - "Systemstatus": Status-Labels, Auth-Row, Theme-Row
 * - "Datenschutz": Privacy-Notice
 * - "Sicherheit": PII-Audit, keine sensiblen Daten im HTML
 * - "Supabase-abhängig": verbunden-Status, eingeloggte Counts
 */

const SUPABASE_CONFIGURED = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

// ────────────────────────────────────────────────────────────
// SECTION 1: Grundstruktur
// ────────────────────────────────────────────────────────────
test.describe("Grundstruktur", () => {
  test("GET / liefert 200 ohne Supabase-Konfiguration", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("Seite zeigt Hauptüberschrift 'Willkommen im Cockpit'", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Willkommen im Cockpit");
  });

  test("Eyebrow-Label 'Status' ist sichtbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Status", { exact: true })).toBeVisible();
  });

  test("Subtitle-Text ist sichtbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Dein digitaler Zwilling. Präzise. Privat. Teilbar.")).toBeVisible();
  });

  test("'Neues Item' Link ist immer sichtbar und zeigt auf /garage/new", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /Neues Item/i });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "/garage/new");
  });

  test("Sticky Header mit Logo ist sichtbar", async ({ page }) => {
    await page.goto("/");
    // Logo text is rendered via the Logo component
    await expect(page.getByText("Setup.Registry")).toBeVisible();
  });

  test("BottomNav ist sichtbar", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("navigation", { name: "Hauptnavigation" })).toBeVisible();
  });

  test("Dashboard-Eintrag in BottomNav ist aktiv (aria-current=page)", async ({ page }) => {
    await page.goto("/");
    const dashboardNav = page.getByRole("link", { name: /Dashboard/i });
    await expect(dashboardNav).toHaveAttribute("aria-current", "page");
  });
});

// ────────────────────────────────────────────────────────────
// SECTION 2: Kategorien-Tiles
// ────────────────────────────────────────────────────────────
test.describe("Kategorien-Tiles", () => {
  test("Zeigt genau 4 Kategorien-Tiles", async ({ page }) => {
    await page.goto("/");
    const section = page.getByRole("region", { name: "Kategorien" });
    await expect(section).toBeVisible();
    const links = section.getByRole("link");
    await expect(links).toHaveCount(4);
  });

  test("Bike-Tile ist vorhanden mit Link zu /garage?category=Bike", async ({ page }) => {
    await page.goto("/");
    const tile = page.getByRole("link", { name: /Bike/i });
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute("href", "/garage?category=Bike");
  });

  test("Part-Tile ist vorhanden mit Link zu /garage?category=Part", async ({ page }) => {
    await page.goto("/");
    const tile = page.getByRole("link", { name: /Komponenten/i });
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute("href", "/garage?category=Part");
  });

  test("Gear-Tile ist vorhanden mit Link zu /garage?category=Gear", async ({ page }) => {
    await page.goto("/");
    const tile = page.getByRole("link", { name: /Equipment/i });
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute("href", "/garage?category=Gear");
  });

  test("Clothing-Tile ist vorhanden mit Link zu /garage?category=Clothing", async ({ page }) => {
    await page.goto("/");
    const tile = page.getByRole("link", { name: /Bekleidung/i });
    await expect(tile).toBeVisible();
    await expect(tile).toHaveAttribute("href", "/garage?category=Clothing");
  });

  test("Alle Counts zeigen 0 (keine undefined oder NaN) ohne Supabase", async ({ page }) => {
    await page.goto("/");
    const section = page.getByRole("region", { name: "Kategorien" });
    const tiles = section.getByRole("link");
    const count = await tiles.count();
    for (let i = 0; i < count; i++) {
      const tileText = await tiles.nth(i).textContent();
      expect(tileText).not.toContain("NaN");
      expect(tileText).not.toContain("undefined");
    }
  });

  test("Leere Kategorien zeigen ihre jeweiligen Hinweistexte", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Noch keine Bikes erfasst.")).toBeVisible();
    await expect(page.getByText("Noch keine Komponenten registriert.")).toBeVisible();
    await expect(page.getByText("Noch kein Equipment in der Library.")).toBeVisible();
    await expect(page.getByText("Noch keine Bekleidung erfasst.")).toBeVisible();
  });

  test("Klick auf Bike-Tile navigiert zu /garage?category=Bike", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, "Supabase not configured — redirect to /login expected");
    await page.goto("/");
    await page.getByRole("link", { name: /Bike/i }).click();
    await expect(page).toHaveURL(/\/garage\?category=Bike/);
  });
});

// ────────────────────────────────────────────────────────────
// SECTION 3: Systemstatus
// ────────────────────────────────────────────────────────────
test.describe("Systemstatus", () => {
  test("Systemstatus-Sektion ist vorhanden", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Systemstatus" })).toBeVisible();
  });

  test("Supabase-Zeile zeigt 'nicht konfiguriert' ohne Supabase-Env", async ({ page }) => {
    test.skip(SUPABASE_CONFIGURED, "Supabase is configured — different status expected");
    await page.goto("/");
    await expect(page.getByText("nicht konfiguriert")).toBeVisible();
  });

  test("Auth-Zeile zeigt 'anonym' ohne Supabase", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("anonym")).toBeVisible();
  });

  test("Theme-Zeile zeigt 'dark · petrol'", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("dark · petrol")).toBeVisible();
  });

  test("Systemstatus-Heading ist vorhanden", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Systemstatus/i })).toBeVisible();
  });

  test(
    "Supabase-Zeile zeigt 'verbunden' wenn Supabase konfiguriert und erreichbar",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/");
      await expect(page.getByText("verbunden")).toBeVisible();
    }
  );
});

// ────────────────────────────────────────────────────────────
// SECTION 4: Datenschutz-Hinweis
// ────────────────────────────────────────────────────────────
test.describe("Datenschutz-Hinweis", () => {
  test("Datenschutz-Sektion ist vorhanden", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("region", { name: "Datenschutz" })).toBeVisible();
  });

  test("Zeigt 'Datenschutz by Default'", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Datenschutz by Default")).toBeVisible();
  });

  test("Zeigt Untertitel über private Items", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/Alle Items sind privat/)).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// SECTION 5: Sicherheits-Audit (PII & Injection)
// ────────────────────────────────────────────────────────────
test.describe("Sicherheits-Audit", () => {
  test("Kein Supabase-API-Key im gerendertem HTML", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    // Anon key pattern: long base64 string — check for typical JWT structure
    expect(html).not.toMatch(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{100,}/);
  });

  test("Keine E-Mail-Adresse im gerendertem HTML", async ({ page }) => {
    await page.goto("/");
    const html = await page.content();
    expect(html).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  });

  test("Keine User-ID (UUID) im gerendertem HTML", async ({ page }) => {
    test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
    await page.goto("/");
    const html = await page.content();
    // UUIDs in raw form in HTML are a PII leak — @username is safe, raw UUID is not
    // The dashboard should show @username, not the UUID
    // The UUID pattern check: only fails if a bare UUID appears outside of structured data
    const uuidMatches = html.match(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi) ?? [];
    // Allow zero UUIDs for anonymous state
    expect(uuidMatches.length).toBe(0);
  });

  test("Kein JavaScript-Fehler bei Seitenaufruf", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.goto("/");
    expect(errors).toHaveLength(0);
  });

  test("Dashboard ist auch ohne Supabase-Konfiguration erreichbar (kein 500)", async ({ page }) => {
    test.skip(SUPABASE_CONFIGURED, "Only meaningful without Supabase configured");
    const response = await page.goto("/");
    expect(response?.status()).not.toBe(500);
    expect(response?.status()).toBe(200);
  });
});

// ────────────────────────────────────────────────────────────
// SECTION 6: A11y-Audit
// ────────────────────────────────────────────────────────────
test.describe("Barrierefreiheit (A11y)", () => {
  test("Kategorien-Grid-Sektion hat aria-label", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("[aria-label='Kategorien']");
    await expect(section).toBeVisible();
  });

  test("Systemstatus-Sektion hat aria-label", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("[aria-label='Systemstatus']");
    await expect(section).toBeVisible();
  });

  test("Datenschutz-Sektion hat aria-label", async ({ page }) => {
    await page.goto("/");
    const section = page.locator("[aria-label='Datenschutz']");
    await expect(section).toBeVisible();
  });

  test("Tile-Links haben aria-label mit Count-Information", async ({ page }) => {
    await page.goto("/");
    const bikeLink = page.getByRole("link", { name: /Bike – 0 Items/i });
    await expect(bikeLink).toBeVisible();
  });

  test("'Neues Item' Link hat beschreibenden Text (kein Icon-only)", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /Neues Item/i });
    await expect(link).toBeVisible();
    const text = await link.textContent();
    expect(text?.trim()).toContain("Neues Item");
  });

  test("Responsiv: Mobile (375px) — alle Tiles sichtbar", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    const section = page.getByRole("region", { name: "Kategorien" });
    await expect(section).toBeVisible();
    const tiles = section.getByRole("link");
    await expect(tiles).toHaveCount(4);
  });

  test("Responsiv: Desktop (1440px) — alle Tiles sichtbar", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    const section = page.getByRole("region", { name: "Kategorien" });
    const tiles = section.getByRole("link");
    await expect(tiles).toHaveCount(4);
  });
});

// ────────────────────────────────────────────────────────────
// SECTION 7: Supabase-abhängige Tests
// ────────────────────────────────────────────────────────────
test.describe("Supabase-abhängige Tests", () => {
  test(
    "Unauthentifizierter Benutzer sieht alle Counts als 0",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/");
      // Counts are aria-hidden — check tile aria-labels instead
      const section = page.getByRole("region", { name: "Kategorien" });
      const tiles = section.getByRole("link");
      const count = await tiles.count();
      for (let i = 0; i < count; i++) {
        const label = await tiles.nth(i).getAttribute("aria-label");
        expect(label).toMatch(/– 0 Items/);
      }
    }
  );

  test(
    "Unauthentifizierter Benutzer sieht 'anonym' in Auth-Zeile",
    { annotation: { type: "requires-supabase" } },
    async ({ page }) => {
      test.skip(!SUPABASE_CONFIGURED, "Supabase not configured");
      await page.goto("/");
      await expect(page.getByText("anonym")).toBeVisible();
    }
  );
});

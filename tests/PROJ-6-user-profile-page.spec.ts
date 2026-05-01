import { test, expect } from "@playwright/test";

// ---------------------------------------------------------------------------
// PROJ-6: User Profile Page — E2E Tests
//
// Note: Tests that require a live Supabase session (profile edit, avatar upload,
// weight_unit toggle persistence) are marked with test.skip() and an explanation.
// Only structural / routing tests that work without auth are run in CI.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// AC: /profile/[username] returns 404 for missing or private profiles
// ---------------------------------------------------------------------------

test.describe("Public profile — 404 behaviour", () => {
  // Skip: /profile/[username] is a Server Component that calls Supabase directly.
  // Without a live Supabase connection in local dev the page hangs until timeout.
  // Run manually against a deployed environment: navigate to /profile/unknown-user-xyz-12345
  // and verify the response is HTTP 404 or the Next.js not-found UI is shown.
  test.skip(
    true,
    "Requires live Supabase connection. The Server Component fetches from DB; without a live project the page hangs. Run against a deployed/staging environment."
  );

  test("navigating to a non-existent username shows a not-found page", async ({ page }) => {
    // Use a username that is virtually guaranteed not to exist
    const response = await page.goto("/profile/unknown-user-xyz-12345-qa-test");

    // Next.js notFound() triggers either a 404 HTTP status or renders the not-found UI.
    // Accept both: HTTP 404 OR the page renders without throwing a 500.
    const status = response?.status() ?? 0;
    const is404 = status === 404;
    const isNotFoundPage =
      (await page.title()).toLowerCase().includes("not found") ||
      (await page.locator("h2").first().textContent().catch(() => ""))
        .toLowerCase()
        .includes("not found") ||
      (await page.content()).toLowerCase().includes("not found") ||
      (await page.content()).toLowerCase().includes("404");

    expect(is404 || isNotFoundPage).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// AC: Own profile redirects to /login when unauthenticated
// ---------------------------------------------------------------------------

test.describe("Own profile — auth guard", () => {
  test("unauthenticated access to /profile redirects to /login", async ({ page }) => {
    // Clear cookies to ensure no session
    await page.context().clearCookies();

    const response = await page.goto("/profile");

    // Either the final URL is /login, or the page content indicates a login page
    const finalUrl = page.url();
    const redirectedToLogin = finalUrl.includes("/login");
    const loginPageContent =
      (await page.locator("input[type=email], input[name=email]").count()) > 0 ||
      (await page.content()).toLowerCase().includes("anmelden") ||
      (await page.content()).toLowerCase().includes("login");

    // A redirect (3xx) to /login, or page content is a login page
    const httpRedirect = (response?.status() ?? 0) >= 300 && (response?.status() ?? 0) < 400;

    expect(redirectedToLogin || loginPageContent || httpRedirect).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Skipped tests — require live Supabase session
// ---------------------------------------------------------------------------

test.describe("Own profile edit — SKIPPED (requires auth)", () => {
  test.skip(
    true,
    "Requires authenticated Supabase session. Run manually: log in as test user, navigate to /profile, verify all editable fields are present (full_name, bio, weight_unit, is_public, avatar)."
  );

  test("profile page shows all editable fields", async ({ page }) => {
    await page.goto("/profile");
    await expect(page.locator("input[name=full_name]")).toBeVisible();
    await expect(page.locator("textarea[name=bio]")).toBeVisible();
    await expect(page.locator("input[name=weight_unit]")).toBeVisible();
  });

  test("username is displayed as read-only (not an input)", async ({ page }) => {
    await page.goto("/profile");
    // Username shown as a <p> element, NOT an <input>
    await expect(page.locator("input[name=username]")).not.toBeVisible();
  });

  test("saving profile shows German success message", async ({ page }) => {
    await page.goto("/profile");
    await page.click("button[type=submit]");
    await expect(page.getByRole("status")).toContainText("erfolgreich gespeichert");
  });
});

test.describe("Avatar upload — SKIPPED (requires auth)", () => {
  test.skip(
    true,
    "Requires authenticated Supabase session. Run manually: log in, navigate to /profile, upload a >5MB file and verify German error is shown. Upload a valid JPEG and verify preview updates."
  );

  test("uploading file > 5 MB shows German error", async ({ page }) => {
    await page.goto("/profile");
    // Would need to programmatically set the file input with a large file
  });

  test("uploading invalid MIME type shows German error", async ({ page }) => {
    await page.goto("/profile");
    // Would need to programmatically set the file input with a .gif file
  });
});

test.describe("weight_unit toggle — SKIPPED (requires auth)", () => {
  test.skip(
    true,
    "Requires authenticated Supabase session. Run manually: log in, switch weight_unit to 'kg', save, reload and verify the toggle is still set to 'kg'."
  );

  test("weight_unit change persists after page reload", async ({ page }) => {
    await page.goto("/profile");
    await page.click("label[for='weight-unit-kg']");
    await page.click("button[type=submit]");
    await page.reload();
    await expect(page.locator("input#weight-unit-kg")).toBeChecked();
  });
});

test.describe("Private profile — SKIPPED (requires auth)", () => {
  test.skip(
    true,
    "Requires authenticated Supabase session. Run manually: set is_public=false, save, then in a separate incognito session navigate to /profile/<username> and verify 404."
  );

  test("private profile returns 404 for logged-out visitor", async ({ page }) => {
    // Would need a test user whose profile is known to be private
  });
});

test.describe("Public profile page — structural checks", () => {
  test.skip(
    true,
    "Requires a known public profile in Supabase. Run manually: create a public test user, navigate to /profile/<username> and verify the ProfileHeader, @username, and public item list are rendered."
  );

  test("public profile shows username and item list section", async ({ page }) => {
    await page.goto("/profile/testuser");
    await expect(page.locator("text=@testuser")).toBeVisible();
    await expect(page.getByRole("region", { name: "Öffentliche Items" })).toBeVisible();
  });
});

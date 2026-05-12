import { describe, it, expect } from "vitest";
import { decidePostAuthRedirect } from "./redirect";

describe("decidePostAuthRedirect", () => {
  describe("nicht eingeloggt", () => {
    const state = { isAuthenticated: false };

    it("schickt geschützte Pfade zur Login-Seite", () => {
      expect(decidePostAuthRedirect(state, "/garage")).toBe("/login");
      expect(decidePostAuthRedirect(state, "/garage/123")).toBe("/login");
      expect(decidePostAuthRedirect(state, "/profile")).toBe("/login");
      expect(decidePostAuthRedirect(state, "/onboarding")).toBe("/login");
    });

    it("lässt öffentliche Pfade durch", () => {
      expect(decidePostAuthRedirect(state, "/")).toBeNull();
      expect(decidePostAuthRedirect(state, "/explore")).toBeNull();
      expect(decidePostAuthRedirect(state, "/login")).toBeNull();
      expect(decidePostAuthRedirect(state, "/auth/callback")).toBeNull();
    });

    it("lässt öffentliche Nutzerprofile durch", () => {
      expect(decidePostAuthRedirect(state, "/profile/janlu")).toBeNull();
      expect(decidePostAuthRedirect(state, "/profile/somebody")).toBeNull();
    });
  });

  describe("eingeloggt", () => {
    const state = { isAuthenticated: true };

    it("leitet von /login zum Dashboard", () => {
      expect(decidePostAuthRedirect(state, "/login")).toBe("/");
    });

    it("lässt alle App-Routen durch", () => {
      expect(decidePostAuthRedirect(state, "/")).toBeNull();
      expect(decidePostAuthRedirect(state, "/garage")).toBeNull();
      expect(decidePostAuthRedirect(state, "/profile")).toBeNull();
      expect(decidePostAuthRedirect(state, "/profile/janlu")).toBeNull();
      expect(decidePostAuthRedirect(state, "/onboarding")).toBeNull();
      expect(decidePostAuthRedirect(state, "/auth/callback")).toBeNull();
    });
  });
});

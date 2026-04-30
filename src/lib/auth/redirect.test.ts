import { describe, it, expect } from "vitest";
import {
  decidePostAuthRedirect,
  isAuthPath,
  isProtectedPath,
} from "./redirect";

describe("decidePostAuthRedirect", () => {
  describe("nicht eingeloggt", () => {
    const state = { isAuthenticated: false, hasProfile: false };

    it("schickt geschützte Pfade zur Login-Seite", () => {
      expect(decidePostAuthRedirect(state, "/garage")).toBe("/login");
      expect(decidePostAuthRedirect(state, "/onboarding")).toBe("/login");
      expect(decidePostAuthRedirect(state, "/profile")).toBe("/login");
      expect(decidePostAuthRedirect(state, "/garage/123")).toBe("/login");
    });

    it("lässt öffentliche Pfade durch", () => {
      expect(decidePostAuthRedirect(state, "/")).toBeNull();
      expect(decidePostAuthRedirect(state, "/explore")).toBeNull();
      expect(decidePostAuthRedirect(state, "/login")).toBeNull();
      expect(decidePostAuthRedirect(state, "/auth/callback")).toBeNull();
    });
  });

  describe("eingeloggt ohne Profil", () => {
    const state = { isAuthenticated: true, hasProfile: false };

    it("leitet von beliebigen App-Routen nach /onboarding", () => {
      expect(decidePostAuthRedirect(state, "/")).toBe("/onboarding");
      expect(decidePostAuthRedirect(state, "/garage")).toBe("/onboarding");
      expect(decidePostAuthRedirect(state, "/explore")).toBe("/onboarding");
    });

    it("blockiert /onboarding nicht selbst (verhindert Redirect-Schleife)", () => {
      expect(decidePostAuthRedirect(state, "/onboarding")).toBeNull();
    });

    it("schickt von /login nach /onboarding", () => {
      expect(decidePostAuthRedirect(state, "/login")).toBe("/onboarding");
    });

    it("lässt /auth/callback unberührt (Code-Exchange muss laufen)", () => {
      expect(decidePostAuthRedirect(state, "/auth/callback")).toBeNull();
    });
  });

  describe("eingeloggt mit Profil", () => {
    const state = { isAuthenticated: true, hasProfile: true };

    it("leitet von /onboarding zum Dashboard", () => {
      expect(decidePostAuthRedirect(state, "/onboarding")).toBe("/");
    });

    it("leitet von /login zum Dashboard", () => {
      expect(decidePostAuthRedirect(state, "/login")).toBe("/");
    });

    it("lässt normale App-Routen durch", () => {
      expect(decidePostAuthRedirect(state, "/")).toBeNull();
      expect(decidePostAuthRedirect(state, "/garage")).toBeNull();
      expect(decidePostAuthRedirect(state, "/profile")).toBeNull();
    });
  });
});

describe("isProtectedPath", () => {
  it("erkennt geschützte Pfade", () => {
    expect(isProtectedPath("/onboarding")).toBe(true);
    expect(isProtectedPath("/garage")).toBe(true);
    expect(isProtectedPath("/garage/abc")).toBe(true);
    expect(isProtectedPath("/profile")).toBe(true);
    expect(isProtectedPath("/profile/username")).toBe(true);
  });

  it("erkennt ungeschützte Pfade", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/explore")).toBe(false);
    expect(isProtectedPath("/login")).toBe(false);
  });
});

describe("isAuthPath", () => {
  it("erkennt Auth-Pfade", () => {
    expect(isAuthPath("/login")).toBe(true);
    expect(isAuthPath("/auth/callback")).toBe(true);
    expect(isAuthPath("/auth/signout")).toBe(true);
  });

  it("erkennt Nicht-Auth-Pfade", () => {
    expect(isAuthPath("/")).toBe(false);
    expect(isAuthPath("/garage")).toBe(false);
    expect(isAuthPath("/explore")).toBe(false);
  });
});

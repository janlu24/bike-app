export interface AuthState {
  isAuthenticated: boolean;
  hasProfile: boolean;
}

const PROTECTED_PREFIXES = ["/onboarding", "/garage", "/profile"];
const AUTH_PREFIXES = ["/login", "/auth"];

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );
}

export function isProtectedPath(pathname: string): boolean {
  return startsWithAny(pathname, PROTECTED_PREFIXES);
}

export function isAuthPath(pathname: string): boolean {
  return startsWithAny(pathname, AUTH_PREFIXES);
}

/**
 * Liefert den Ziel-Pfad für eine Weiterleitung — oder null, wenn die Anfrage
 * durchgelassen werden soll.
 *
 * Regeln:
 *  - Nicht eingeloggt + geschützte Route   → /login
 *  - Eingeloggt ohne Profil                → /onboarding (außer auf /onboarding selbst)
 *  - Eingeloggt mit Profil + auf /onboarding oder /login → /
 */
export function decidePostAuthRedirect(
  state: AuthState,
  pathname: string
): string | null {
  if (!state.isAuthenticated) {
    return isProtectedPath(pathname) ? "/login" : null;
  }

  if (isAuthPath(pathname)) {
    if (pathname.startsWith("/auth")) return null;
    return state.hasProfile ? "/" : "/onboarding";
  }

  if (!state.hasProfile && pathname !== "/onboarding") {
    return "/onboarding";
  }

  if (state.hasProfile && pathname === "/onboarding") {
    return "/";
  }

  return null;
}

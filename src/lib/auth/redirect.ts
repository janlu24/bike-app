export interface AuthState {
  isAuthenticated: boolean;
}

const PUBLIC_EXACT = new Set(["/", "/explore", "/login"]);

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  // /auth/** and /explore/** sub-paths
  if (pathname.startsWith("/auth/") || pathname.startsWith("/explore/")) return true;
  // /profile/[username] is public; /profile (exact) is protected
  if (pathname.startsWith("/profile/") && pathname.length > "/profile/".length) return true;
  return false;
}

/**
 * Returns the redirect target, or null to let the request through.
 *
 * Rules:
 *  - Unauthenticated + non-public path → /login
 *  - Authenticated + /login             → /
 */
export function decidePostAuthRedirect(
  state: AuthState,
  pathname: string
): string | null {
  if (!state.isAuthenticated && !isPublicPath(pathname)) {
    return "/login";
  }
  if (state.isAuthenticated && pathname === "/login") {
    return "/";
  }
  return null;
}

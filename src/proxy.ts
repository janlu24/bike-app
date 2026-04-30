import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@/lib/supabase/middleware";
import { decidePostAuthRedirect, isAuthPath } from "@/lib/auth/redirect";

export async function proxy(request: NextRequest) {
  const { supabase, getResponse } = createMiddlewareClient(request);
  const pathname = request.nextUrl.pathname;

  const {
    data: { user }
  } = await supabase.auth.getUser();

  let hasProfile = false;
  if (user && !pathname.startsWith("/auth")) {
    const { data } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    hasProfile = Boolean(data);
  }

  const target = decidePostAuthRedirect(
    { isAuthenticated: Boolean(user), hasProfile },
    pathname
  );

  if (target && target !== pathname) {
    const url = request.nextUrl.clone();
    url.pathname = target;
    url.search = "";
    if (!(isAuthPath(pathname) && target === "/login")) {
      return NextResponse.redirect(url);
    }
  }

  return getResponse();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"
  ]
};

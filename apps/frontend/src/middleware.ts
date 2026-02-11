import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TOKEN_COOKIE = "assoincloud_token";

/**
 * Next.js middleware that redirects unauthenticated users to the login page.
 *
 * Strategy:
 * 1. First check if the backend has auth enabled by calling /api/auth/status
 *    (this result could be cached, but for simplicity we check the cookie).
 * 2. If the user has no token cookie and is not on the login page, redirect.
 * 3. The actual token validation happens on the backend when API calls are made.
 *    This middleware only provides a UX redirect — security is server-side.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to the login page, static assets, and API routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // Check for auth token cookie
  const token = request.cookies.get(TOKEN_COOKIE)?.value;

  if (!token) {
    // No token — but we don't know yet if auth is enabled.
    // Check the auth_disabled cookie (set by the login page when auth is off).
    const authDisabled = request.cookies.get("assoincloud_auth_disabled")?.value;
    if (authDisabled === "true") {
      return NextResponse.next();
    }

    // Redirect to login page
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

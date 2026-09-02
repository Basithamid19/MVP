import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

// Customer-only surfaces. Everything else is keyed off its path prefix.
const CUSTOMER_ONLY = ["/dashboard", "/account", "/bookings", "/requests"];

// Where each role belongs when it wanders somewhere it shouldn't. Doubles as
// the allow-list of known roles: a token carrying anything else is treated as
// unauthenticated, so an unrecognised value can never redirect-loop.
const HOME_BY_ROLE: Record<string, string> = {
  CUSTOMER: "/dashboard",
  PROVIDER: "/provider/dashboard",
  ADMIN: "/admin/dashboard",
};

function isUnder(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

// Auth.js names the session cookie `__Secure-authjs.session-token` on HTTPS and
// `authjs.session-token` on plain HTTP (dev), and getToken() derives the JWT
// decryption salt from that cookie name. It also does NOT read AUTH_SECRET from
// the environment — the secret must be passed in explicitly.
//
// A bare `getToken({ req })` therefore defaulted to the non-secure cookie name
// and no secret, matched nothing on the deployed HTTPS origin, and returned
// null — which silently disabled every role redirect below in production.
//
// Both spellings are probed; each probe carries its own matching salt because
// getToken() defaults `salt` to `cookieName`. The `.catch()` swallows the
// MissingSecret throw when AUTH_SECRET is absent (fails closed).
async function readToken(req: NextRequest) {
  const secret = process.env.AUTH_SECRET;
  const secure = await getToken({ req, secret, secureCookie: true }).catch(() => null);
  if (secure) return secure;
  return await getToken({ req, secret, secureCookie: false }).catch(() => null);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await readToken(req);
  const claimed = typeof token?.role === "string" ? token.role : undefined;
  const role = claimed && claimed in HOME_BY_ROLE ? claimed : undefined;

  // Bare "/" stays the public marketing homepage for guests and customers, but
  // a logged-in provider/admin is sent to their own console instead.
  if (pathname === "/") {
    if (role === "PROVIDER" || role === "ADMIN") {
      return NextResponse.redirect(new URL(HOME_BY_ROLE[role], req.url));
    }
    return NextResponse.next();
  }

  // Every other matched path is authenticated-only. No token — or a token that
  // decodes but carries no usable role — fails closed to the login page.
  if (!role) {
    const url = new URL("/login", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // /messages is shared surface: customers, providers and admin moderation all
  // use the same thread list, so any authenticated role passes.
  if (isUnder(pathname, "/messages")) return NextResponse.next();

  const home = HOME_BY_ROLE[role];

  // The admin console admits ADMIN only. The /api/admin gate already blocks the
  // data, but this stops the shell from rendering for non-admins.
  if (isUnder(pathname, "/admin")) {
    return role === "ADMIN" ? NextResponse.next() : NextResponse.redirect(new URL(home, req.url));
  }

  // The provider console admits PROVIDER only.
  if (isUnder(pathname, "/provider")) {
    return role === "PROVIDER" ? NextResponse.next() : NextResponse.redirect(new URL(home, req.url));
  }

  // Customer-only surfaces: providers and admins bounce to their own home.
  if (CUSTOMER_ONLY.some((prefix) => isUnder(pathname, prefix))) {
    return role === "CUSTOMER" ? NextResponse.next() : NextResponse.redirect(new URL(home, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/account/:path*",
    "/bookings/:path*",
    "/requests/:path*",
    "/messages/:path*",
    "/provider/:path*",
    "/admin/:path*",
  ],
};

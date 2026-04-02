import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const CUSTOMER_ONLY = ["/dashboard", "/account", "/bookings", "/requests"];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const role = token?.role as string | undefined;

  if (!role) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Provider hitting customer-only routes → send to provider dashboard
  if (role === "PROVIDER") {
    for (const prefix of CUSTOMER_ONLY) {
      if (pathname === prefix || pathname.startsWith(prefix + "/")) {
        return NextResponse.redirect(new URL("/provider/dashboard", req.url));
      }
    }
  }

  // Customer hitting provider routes → send to customer dashboard
  if (role === "CUSTOMER") {
    if (pathname.startsWith("/provider")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Admin hitting customer-only routes → send to admin dashboard
  if (role === "ADMIN") {
    for (const prefix of CUSTOMER_ONLY) {
      if (pathname === prefix || pathname.startsWith(prefix + "/")) {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/bookings/:path*",
    "/requests/:path*",
    "/provider/:path*",
  ],
};

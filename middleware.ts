import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const CUSTOMER_ONLY = ["/dashboard", "/account", "/bookings", "/requests"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const role = (req.auth?.user as any)?.role;

  if (!role) return NextResponse.next();

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
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/account/:path*",
    "/bookings/:path*",
    "/requests/:path*",
    "/provider/:path*",
  ],
};

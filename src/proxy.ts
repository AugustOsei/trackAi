import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!secret || !isValidSessionCookieValue(cookie, secret)) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};

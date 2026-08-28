import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isValidSessionCookieValue, SESSION_COOKIE_NAME } from "@/lib/session";

/** On Vercel `x-real-ip` is set from the connection and not client-spoofable. */
function clientIp(request: NextRequest): string {
  return (
    request.headers.get("x-real-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    ""
  );
}

export function proxy(request: NextRequest) {
  // Optional hard gate: if ADMIN_IP_ALLOWLIST is set (comma-separated IPs),
  // anything off the list gets a bare 404 — the admin routes don't exist as
  // far as the rest of the internet is concerned, login page included.
  const allowlist = process.env.ADMIN_IP_ALLOWLIST;
  if (allowlist) {
    const allowed = allowlist
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!allowed.includes(clientIp(request))) {
      return new NextResponse(null, { status: 404 });
    }
  }

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

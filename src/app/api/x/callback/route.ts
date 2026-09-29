import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { publicBaseUrl } from "@/lib/env";
import {
  exchangeXAuthorizationCode,
  fetchAuthenticatedXUser,
  saveXConnection,
} from "@/lib/x-bookmarks";

function sameValue(a: string | undefined, b: string | null) {
  if (!a || !b) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const savedState = request.cookies.get("trackai_x_oauth_state")?.value;
  const verifier = request.cookies.get("trackai_x_oauth_verifier")?.value;
  if (error) return Response.json({ error: `X authorization was declined: ${error}` }, { status: 400 });
  if (!code || !verifier || !sameValue(savedState, state)) {
    return Response.json({ error: "Invalid or expired X authorization request" }, { status: 400 });
  }

  try {
    const token = await exchangeXAuthorizationCode({
      code,
      codeVerifier: verifier,
      redirectUri: `${publicBaseUrl()}/api/x/callback`,
    });
    const user = await fetchAuthenticatedXUser(token.access_token);
    await saveXConnection({ user, token });
    const response = NextResponse.redirect(`${publicBaseUrl()}/admin?x=connected`);
    response.cookies.set("trackai_x_oauth_state", "", {
      httpOnly: true,
      secure: publicBaseUrl().startsWith("https://"),
      sameSite: "lax",
      path: "/api/x/callback",
      maxAge: 0,
    });
    response.cookies.set("trackai_x_oauth_verifier", "", {
      httpOnly: true,
      secure: publicBaseUrl().startsWith("https://"),
      sameSite: "lax",
      path: "/api/x/callback",
      maxAge: 0,
    });
    return response;
  } catch (cause) {
    console.error("[x/oauth] callback failed", cause);
    return Response.json({ error: "Unable to connect the X account" }, { status: 500 });
  }
}

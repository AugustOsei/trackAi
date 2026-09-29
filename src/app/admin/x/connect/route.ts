import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { env, publicBaseUrl } from "@/lib/env";

const OAUTH_COOKIE_AGE = 10 * 60;

export async function GET() {
  const state = randomBytes(24).toString("base64url");
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const redirectUri = `${publicBaseUrl()}/api/x/callback`;
  const authorizeUrl = new URL("https://x.com/i/oauth2/authorize");
  authorizeUrl.search = new URLSearchParams({
    response_type: "code",
    client_id: env.xClientId,
    redirect_uri: redirectUri,
    scope: "tweet.read users.read bookmark.read offline.access",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  }).toString();

  const response = NextResponse.redirect(authorizeUrl);
  const secure = redirectUri.startsWith("https://");
  response.cookies.set("trackai_x_oauth_state", state, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/api/x/callback",
    maxAge: OAUTH_COOKIE_AGE,
  });
  response.cookies.set("trackai_x_oauth_verifier", verifier, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/api/x/callback",
    maxAge: OAUTH_COOKIE_AGE,
  });
  return response;
}

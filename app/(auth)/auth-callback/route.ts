import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /auth/callback
 *
 * Handles the OAuth / magic-link redirect from Supabase.
 * Exchanges the one-time code for a session, then routes the user to:
 *   - /welcome  — if they haven't completed onboarding yet
 *   - /home     — if they have
 *
 * Query params supplied by Supabase:
 *   code   — the PKCE auth code to exchange
 *   next   — optional override redirect (e.g. from a protected page)
 *   error  — set when Supabase itself returns an error (e.g. expired link)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const oauthError = searchParams.get("error");
  const oauthErrorDescription = searchParams.get("error_description");

  // ── Hard error coming in from the provider ──────────────────────────────
  if (oauthError) {
    const message = oauthErrorDescription ?? oauthError;
    const url = new URL("/login", origin);
    url.searchParams.set("error", message);
    return NextResponse.redirect(url);
  }

  // ── No code → malformed callback ────────────────────────────────────────
  if (!code) {
    const url = new URL("/login", origin);
    url.searchParams.set("error", "Missing auth code. Please try again.");
    return NextResponse.redirect(url);
  }

  // ── Exchange code for session ────────────────────────────────────────────
  const supabase = await createClient();

  const { data: sessionData, error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError || !sessionData.session) {
    const url = new URL("/login", origin);
    url.searchParams.set(
      "error",
      exchangeError?.message ?? "Could not verify your session. Please sign in again."
    );
    return NextResponse.redirect(url);
  }

  // ── Determine where to send the user ────────────────────────────────────
  // Honour an explicit `next` param first (e.g. protected-page deep-link),
  // as long as it's a relative path (prevent open-redirect attacks).
  if (next && next.startsWith("/")) {
    return NextResponse.redirect(new URL(next, origin));
  }

  // Otherwise check whether the user has completed onboarding.
  const userId = sessionData.session.user.id;

  const { data: userRow } = await supabase
    .from("users")
    .select("onboarding_completed")
    .eq("id", userId)
    .single();

  const onboardingDone = userRow?.onboarding_completed === true;

  return NextResponse.redirect(
    new URL(onboardingDone ? "/home" : "/chat", origin)
  );
}

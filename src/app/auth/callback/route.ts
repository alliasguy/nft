import { createServerClient }         from "@supabase/ssr";
import { cookies }                     from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Handles the redirect that Supabase sends after the user clicks an
 * email link (signup confirmation, password reset, email change, etc.).
 *
 * The URL contains either:
 *   ?code=xxx  (PKCE flow — exchange for a session)
 *   ?token_hash=xxx&type=xxx  (legacy token flow)
 *
 * Configure in Supabase Dashboard → Authentication → URL Configuration:
 *   Site URL            = https://your-domain.com
 *   Redirect URLs       = https://your-domain.com/auth/callback
 *                         http://localhost:3000/auth/callback   (dev)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code       = searchParams.get("code");
  const tokenHash  = searchParams.get("token_hash");
  const type       = searchParams.get("type") ?? "";   // signup | recovery | email_change

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()            { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    },
  );

  let error: string | null = null;

  if (code) {
    /* PKCE flow */
    const { error: e } = await supabase.auth.exchangeCodeForSession(code);
    if (e) error = e.message;
  } else if (tokenHash && type) {
    /* Legacy token flow */
    const { error: e } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any });
    if (e) error = e.message;
  } else {
    error = "Missing verification parameters";
  }

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error)}`,
    );
  }

  /* Route based on the type of verification */
  if (type === "recovery") {
    /* Password reset — send to the reset form */
    return NextResponse.redirect(`${origin}/auth/reset-password`);
  }

  if (type === "email_change") {
    return NextResponse.redirect(`${origin}/dashboard/settings?email_changed=1`);
  }

  /* Default: signup confirmation → branded success page */
  return NextResponse.redirect(`${origin}/auth/verified`);
}

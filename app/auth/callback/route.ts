import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "../../../lib/supabase/server";

export async function GET(
  request: NextRequest
) {
  const requestUrl = new URL(
    request.url
  );

  const code =
    requestUrl.searchParams.get(
      "code"
    );

  const nextParameter =
    requestUrl.searchParams.get(
      "next"
    );

  const safeNext =
    nextParameter &&
    nextParameter.startsWith("/") &&
    !nextParameter.startsWith("//")
      ? nextParameter
      : "/dashboard";

  if (code) {
    const supabase =
      await createClient();

    const {
      error: exchangeError,
    } =
      await supabase.auth.exchangeCodeForSession(
        code
      );

    if (!exchangeError) {
      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser();

      if (!userError && user) {
        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error(
            "Profile role error:",
            profileError
          );
        }

        const isAdmin =
          profile?.role === "admin";

        const destination = isAdmin
          ? "/admin"
          : safeNext.startsWith(
                "/admin"
              )
            ? "/dashboard"
            : safeNext;

        return NextResponse.redirect(
          new URL(
            destination,
            requestUrl.origin
          )
        );
      }
    }

    console.error(
      "Google OAuth callback error:",
      exchangeError
    );
  }

  return NextResponse.redirect(
    new URL(
      "/login?error=google_auth_failed",
      requestUrl.origin
    )
  );
}
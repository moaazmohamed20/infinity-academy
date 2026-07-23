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
      error,
    } =
      await supabase.auth.exchangeCodeForSession(
        code
      );

    if (!error) {
      return NextResponse.redirect(
        new URL(
          safeNext,
          requestUrl.origin
        )
      );
    }

    console.error(
      "Google OAuth callback error:",
      error
    );
  }

  return NextResponse.redirect(
    new URL(
      "/login?error=google_auth_failed",
      requestUrl.origin
    )
  );
}
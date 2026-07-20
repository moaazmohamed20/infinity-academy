import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest
) {
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    request.nextUrl.origin
  ).replace(/\/+$/, "");

  const resultUrl = new URL(
    "/payment/result",
    siteUrl
  );

  // نقل بيانات Paymob لصفحة النتيجة بدون الاعتماد
  // عليها في تفعيل الاشتراك.
  request.nextUrl.searchParams.forEach(
    (value, key) => {
      resultUrl.searchParams.set(
        key,
        value
      );
    }
  );

  return NextResponse.redirect(
    resultUrl,
    303
  );
}
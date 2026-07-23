import Link from "next/link";
import { redirect } from "next/navigation";

import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ReceiptText,
  RefreshCw,
  XCircle,
} from "lucide-react";

import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded";

type PaymentRecord = {
  id: string;
  plan_key: "monthly" | "yearly";
  status: PaymentStatus;
  amount_cents: number;
  currency: string;
  special_reference: string;
  created_at: string;
  paid_at: string | null;
};

type SubscriptionRecord = {
  status: string;
  starts_at: string;
  ends_at: string;
};

type SearchParams = {
  verified?: string | string[];
  verification_error?: string | string[];
  reference?: string | string[];
  payment_success?: string | string[];
};

type PaymentResultPageProps = {
  searchParams: Promise<SearchParams>;
};

const planNames = {
  monthly: "الباقة الاحترافية الشهرية",
  yearly: "الباقة السنوية",
};

function getSearchParam(
  value: string | string[] | undefined
) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getVerificationErrorMessage(
  errorCode: string
) {
  switch (errorCode) {
    case "invalid_hmac":
      return "تعذر التحقق من توقيع عملية الدفع. لم يتم اعتماد نتيجة الدفع من رابط التحويل.";

    case "missing_hmac":
      return "بيانات التحقق الخاصة بعملية الدفع غير مكتملة.";

    case "missing_configuration":
      return "إعدادات التحقق من الدفع غير مكتملة داخل الخادم.";

    case "missing_parameters":
    case "invalid_callback_data":
      return "بيانات عملية الدفع المرسلة من Paymob غير مكتملة أو غير صحيحة.";

    case "integration_mismatch":
      return "عملية الدفع لا تخص تكامل Paymob المفعّل على الموقع.";

    case "payment_not_found":
      return "لم نعثر على عملية الدفع المطابقة داخل الموقع.";

    case "amount_mismatch":
      return "قيمة العملية القادمة من Paymob لا تطابق القيمة المسجلة داخل الموقع.";

    case "currency_mismatch":
      return "عملة عملية الدفع لا تطابق العملة المسجلة داخل الموقع.";

    case "database_update_failed":
      return "تم التحقق من رابط الدفع، لكن تعذر تحديث حالة العملية داخل قاعدة البيانات.";

    case "promo_update_failed":
      return "تمت معالجة الدفع، لكن تعذر تحديث استخدام كود الخصم.";

    case "missing_reference":
      return "مرجع عملية الدفع غير موجود في رابط التحويل.";

    case "unexpected_error":
      return "حدث خطأ غير متوقع أثناء التحقق من عملية الدفع.";

    default:
      return "تعذر التحقق من نتيجة عملية الدفع بأمان.";
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "غير محدد";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatAmount(
  amountCents: number,
  currency: string
) {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: currency || "EGP",
  }).format(amountCents / 100);
}

export default async function PaymentResultPage({
  searchParams,
}: PaymentResultPageProps) {
  const params = await searchParams;

  const verifiedParam = getSearchParam(
    params.verified
  );

  const verificationError =
    getSearchParam(
      params.verification_error
    );

  const reference = getSearchParam(
    params.reference
  ).trim();

  /*
   * عند نجاح التحقق يجب أن يصل مرجع العملية.
   * لا نسمح بعرض عملية قديمة اعتمادًا على verified=true فقط.
   */
  const verificationFailed =
    verifiedParam === "false" ||
    (
      verifiedParam === "true" &&
      !reference
    );

  const verificationSucceeded =
    verifiedParam === "true" &&
    Boolean(reference);

  const effectiveVerificationError =
    verifiedParam === "true" &&
    !reference
      ? "missing_reference"
      : verificationError;

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims
  ) {
    redirect("/login");
  }

  const claims =
    claimsData.claims as Record<
      string,
      unknown
    >;

  const userId =
    typeof claims.sub === "string"
      ? claims.sub
      : "";

  if (!userId) {
    redirect("/login");
  }

  let paymentData:
    | PaymentRecord
    | null = null;

  let paymentError:
    | { message?: string }
    | null = null;

  /*
   * لو مرجع العملية موجود، نبحث به مع user_id.
   * ده يمنع عرض آخر محاولة دفع مختلفة للمستخدم.
   */
  if (reference) {
    const {
      data,
      error,
    } = await supabase
      .from("payment_transactions")
      .select(
        `
          id,
          plan_key,
          status,
          amount_cents,
          currency,
          special_reference,
          created_at,
          paid_at
        `
      )
      .eq("user_id", userId)
      .eq(
        "special_reference",
        reference
      )
      .maybeSingle();

    paymentData =
      data as PaymentRecord | null;

    paymentError = error;
  } else if (!verificationFailed) {
    /*
     * السماح بفتح الصفحة مباشرة بدون بارامترات:
     * نعرض آخر عملية للمستخدم فقط في هذه الحالة.
     */
    const {
      data,
      error,
    } = await supabase
      .from("payment_transactions")
      .select(
        `
          id,
          plan_key,
          status,
          amount_cents,
          currency,
          special_reference,
          created_at,
          paid_at
        `
      )
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    paymentData =
      data as PaymentRecord | null;

    paymentError = error;
  }

  if (paymentError) {
    console.error(
      "Payment result loading error:",
      paymentError
    );
  }

  const payment = paymentData;

  /*
   * لو الرابط الحالي غير موثوق، لا نعرض نجاح
   * أي عملية قديمة أو مختلفة.
   */
  const isPaid =
    !verificationFailed &&
    payment?.status === "paid";

  const isPending =
    !verificationFailed &&
    payment?.status === "pending";

  const isFailed =
    verificationFailed ||
    Boolean(
      payment &&
        [
          "failed",
          "cancelled",
          "refunded",
        ].includes(payment.status)
    );

  let subscription:
    | SubscriptionRecord
    | null = null;

  if (isPaid) {
    const {
      data: subscriptionData,
      error: subscriptionError,
    } = await supabase
      .from("plan_subscriptions")
      .select(
        `
          status,
          starts_at,
          ends_at
        `
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .order("ends_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    if (subscriptionError) {
      console.error(
        "Subscription result loading error:",
        subscriptionError
      );
    }

    subscription =
      subscriptionData as SubscriptionRecord | null;
  }

  const verificationErrorMessage =
    getVerificationErrorMessage(
      effectiveVerificationError
    );

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      {isPending && (
        <meta
          httpEquiv="refresh"
          content="4"
        />
      )}

      <Navbar />

      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-[130px]" />

        <div className="relative mx-auto max-w-3xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-300">
              <ReceiptText size={17} />
              نتيجة عملية الدفع
            </span>

            <h1 className="mt-6 text-4xl font-black md:text-5xl">
              متابعة حالة الاشتراك
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-8 text-zinc-400">
              يتم تأكيد العملية بأمان من خلال
              Paymob وتحديث اشتراكك داخل المنصة.
            </p>
          </div>

          {verificationFailed ? (
            <div className="mt-12 overflow-hidden rounded-3xl border border-red-500/20 bg-white/[0.04]">
              <div className="border-b border-red-500/20 bg-red-500/[0.07] px-7 py-8 text-center">
                <XCircle
                  size={64}
                  className="mx-auto text-red-400"
                />

                <h2 className="mt-5 text-3xl font-black text-red-300">
                  تعذر التحقق من عملية الدفع
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-8 text-red-100/60">
                  {verificationErrorMessage}
                </p>
              </div>

              <div className="p-7 md:p-9">
                <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/[0.05] p-5">
                  <p className="font-bold text-yellow-300">
                    لم يتم عرض عملية أخرى بالخطأ
                  </p>

                  <p className="mt-2 leading-7 text-zinc-400">
                    الصفحة لا تعتبر الدفع ناجحًا
                    إلا بعد التحقق من الرابط
                    والعثور على نفس مرجع العملية
                    داخل حسابك.
                  </p>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-black transition hover:brightness-110"
                  >
                    إعادة محاولة الدفع
                    <ArrowRight size={19} />
                  </Link>

                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold transition hover:border-purple-500/40"
                  >
                    الذهاب إلى لوحة التحكم
                  </Link>
                </div>
              </div>
            </div>
          ) : !payment || paymentError ? (
            <div className="mt-12 rounded-3xl border border-yellow-500/20 bg-yellow-500/[0.05] p-8 text-center">
              <Clock3
                size={58}
                className="mx-auto text-yellow-400"
              />

              <h2 className="mt-6 text-3xl font-black">
                لم نجد عملية الدفع المطلوبة
              </h2>

              <p className="mt-4 leading-8 text-zinc-400">
                ارجع إلى صفحة الأسعار وابدأ
                عملية الاشتراك مرة أخرى.
              </p>

              <Link
                href="/pricing"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black"
              >
                العودة إلى الأسعار
                <ArrowRight size={19} />
              </Link>
            </div>
          ) : (
            <div className="mt-12 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
              {isPaid && (
                <div className="border-b border-emerald-500/20 bg-emerald-500/10 px-7 py-8 text-center">
                  <CheckCircle2
                    size={64}
                    className="mx-auto text-emerald-400"
                  />

                  <h2 className="mt-5 text-3xl font-black text-emerald-300">
                    تم الدفع وتفعيل الاشتراك
                  </h2>

                  <p className="mt-3 text-emerald-200/70">
                    يمكنك الآن الاستفادة من
                    محتوى المنصة.
                  </p>

                  {verificationSucceeded && (
                    <p className="mt-3 text-sm font-bold text-emerald-300/70">
                      تم التحقق من رابط Paymob
                      وربطه بنفس العملية بنجاح.
                    </p>
                  )}
                </div>
              )}

              {isPending && (
                <div className="border-b border-yellow-500/20 bg-yellow-500/[0.07] px-7 py-8 text-center">
                  <RefreshCw
                    size={60}
                    className="mx-auto animate-spin text-yellow-400"
                  />

                  <h2 className="mt-5 text-3xl font-black text-yellow-300">
                    جاري تأكيد عملية الدفع
                  </h2>

                  <p className="mt-3 leading-7 text-yellow-100/60">
                    انتظر قليلًا، سيتم تحديث
                    الصفحة تلقائيًا.
                  </p>
                </div>
              )}

              {isFailed && (
                <div className="border-b border-red-500/20 bg-red-500/[0.07] px-7 py-8 text-center">
                  <XCircle
                    size={64}
                    className="mx-auto text-red-400"
                  />

                  <h2 className="mt-5 text-3xl font-black text-red-300">
                    لم تكتمل عملية الدفع
                  </h2>

                  <p className="mt-3 leading-7 text-red-100/60">
                    لم يتم تفعيل الاشتراك ويمكنك
                    إعادة المحاولة.
                  </p>
                </div>
              )}

              <div className="p-7 md:p-9">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="text-sm text-zinc-500">
                      الباقة
                    </p>

                    <p className="mt-2 font-black">
                      {
                        planNames[
                          payment.plan_key
                        ]
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="text-sm text-zinc-500">
                      المبلغ
                    </p>

                    <p
                      dir="ltr"
                      className="mt-2 text-right font-black"
                    >
                      {formatAmount(
                        payment.amount_cents,
                        payment.currency
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="text-sm text-zinc-500">
                      رقم العملية
                    </p>

                    <p
                      dir="ltr"
                      className="mt-2 break-all text-right font-mono text-sm font-bold text-purple-300"
                    >
                      {
                        payment.special_reference
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                    <p className="text-sm text-zinc-500">
                      تاريخ إنشاء العملية
                    </p>

                    <p className="mt-2 font-bold">
                      {formatDate(
                        payment.created_at
                      )}
                    </p>
                  </div>

                  {isPaid &&
                    subscription && (
                      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] p-5 sm:col-span-2">
                        <p className="text-sm text-emerald-400">
                          الاشتراك فعال حتى
                        </p>

                        <p className="mt-2 text-xl font-black text-emerald-300">
                          {formatDate(
                            subscription.ends_at
                          )}
                        </p>
                      </div>
                    )}
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-black transition hover:brightness-110"
                  >
                    الذهاب إلى لوحة التحكم
                    <ArrowRight size={19} />
                  </Link>

                  <Link
                    href="/pricing"
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-bold transition hover:border-purple-500/40"
                  >
                    العودة إلى الأسعار
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
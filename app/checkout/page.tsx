import Link from "next/link";
import { redirect } from "next/navigation";

import {
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import CheckoutForm from "../../components/checkout/CheckoutForm";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

type PlanKey = "monthly" | "yearly";

type CheckoutPageProps = {
  searchParams: Promise<{
    plan?: string | string[];
  }>;
};

type PlanRow = {
  id: string;
  plan_key: string;
  name: string;
  price_cents: number;
  currency: string;
  period_label: string;
  description: string;
  features: string[] | null;
  sort_order: number;
};

function isPlanKey(
  value: string
): value is PlanKey {
  return (
    value === "monthly" ||
    value === "yearly"
  );
}

function formatPrice(
  priceCents: number
) {
  return new Intl.NumberFormat(
    "ar-EG",
    {
      maximumFractionDigits: 2,
    }
  ).format(priceCents / 100);
}

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams;

  const planParam = Array.isArray(
    params.plan
  )
    ? params.plan[0]
    : params.plan;

  const supabase =
    await createClient();

  const {
    data,
    error,
  } = await supabase
    .from("subscription_plans")
    .select(
      `
        id,
        plan_key,
        name,
        price_cents,
        currency,
        period_label,
        description,
        features,
        sort_order
      `
    )
    .in("plan_key", [
      "monthly",
      "yearly",
    ])
    .eq("is_published", true)
    .eq("paymob_enabled", true)
    .order("sort_order", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Checkout plans load error:",
      error
    );

    redirect("/pricing");
  }

  const availablePlans =
    ((data || []) as PlanRow[]).filter(
      (plan) =>
        isPlanKey(plan.plan_key) &&
        Number.isInteger(
          Number(plan.price_cents)
        ) &&
        Number(plan.price_cents) > 0
    );

  if (availablePlans.length === 0) {
    redirect("/pricing");
  }

  const requestedPlanKey =
    planParam &&
    isPlanKey(planParam)
      ? planParam
      : "monthly";

  const requestedPlan =
    availablePlans.find(
      (plan) =>
        plan.plan_key ===
        requestedPlanKey
    );

  const selectedPlan =
    requestedPlan ||
    availablePlans[0];

  const selectedPlanKey =
    selectedPlan.plan_key as PlanKey;

  const selectedPrice =
    formatPrice(
      Number(
        selectedPlan.price_cents
      )
    );

  const currencyLabel =
    selectedPlan.currency === "EGP"
      ? "جنيه"
      : selectedPlan.currency;

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-[130px]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-300">
              <Sparkles size={16} />
              إتمام الاشتراك
            </span>

            <h1 className="mt-6 text-4xl font-black md:text-5xl">
              اختر باقتك وأكمل
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                {" "}
                عملية الدفع
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl leading-8 text-zinc-400">
              اشترك في Infinity Academy
              واحصل على وصول كامل إلى
              المحتوى التعليمي والشهادات
              والمسارات المتخصصة.
            </p>
          </div>

          {availablePlans.length > 1 && (
            <div className="mt-12 flex justify-center">
              <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-2">
                {availablePlans.map(
                  (plan) => {
                    const planKey =
                      plan.plan_key as PlanKey;

                    return (
                      <Link
                        key={plan.id}
                        href={`/checkout?plan=${planKey}`}
                        className={`rounded-xl px-6 py-3 text-sm font-bold transition ${
                          selectedPlanKey ===
                          planKey
                            ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                            : "text-zinc-400 hover:text-white"
                        }`}
                      >
                        {planKey ===
                        "monthly"
                          ? "اشتراك شهري"
                          : "اشتراك سنوي"}
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
          )}

          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_420px]">
            <CheckoutForm
              plan={selectedPlanKey}
            />

            <aside className="h-fit rounded-3xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-white/[0.03] p-7">
              <p className="text-sm font-bold text-purple-300">
                ملخص الطلب
              </p>

              <h2 className="mt-3 text-2xl font-black">
                {selectedPlan.name}
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                {selectedPlan.description}
              </p>

              <div className="mt-7 flex items-end justify-between border-b border-white/10 pb-7">
                <span className="text-zinc-400">
                  قيمة الاشتراك
                </span>

                <div className="text-left">
                  <span className="text-4xl font-black">
                    {selectedPrice}
                  </span>

                  <span className="mr-2 text-sm text-zinc-400">
                    {currencyLabel}
                  </span>

                  <p className="mt-1 text-xs text-zinc-500">
                    {
                      selectedPlan.period_label
                    }
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-4">
                {(
                  selectedPlan.features ||
                  []
                ).map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-sm text-zinc-300"
                  >
                    <CheckCircle2
                      size={19}
                      className="shrink-0 text-green-400"
                    />

                    <span>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">
                    الإجمالي قبل الخصم
                  </span>

                  <span className="text-xl font-black">
                    {selectedPrice}{" "}
                    {currencyLabel}
                  </span>
                </div>

                <p className="mt-3 text-xs leading-6 text-zinc-500">
                  عند استخدام كود خصم
                  صحيح، سيتم إرسال السعر
                  النهائي المخفّض إلى
                  Paymob.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
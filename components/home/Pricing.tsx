import {
  Check,
  Crown,
  Sparkles,
  Zap,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import Button from "../ui/Button";
import GlassCard from "../ui/GlassCard";
import SectionTitle from "../ui/SectionTitle";
import { createClient } from "../../lib/supabase/server";

type PlanRow = {
  id: string;
  plan_key: string;
  name: string;
  price_cents: number;
  currency: string;
  period_label: string;
  description: string;
  icon_key: string;
  features: string[] | null;
  button_text: string;
  button_href: string;
  is_featured: boolean;
  sort_order: number;
};

const iconMap: Record<
  string,
  LucideIcon
> = {
  Sparkles,
  Zap,
  Crown,
};

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

export default async function Pricing() {
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
        icon_key,
        features,
        button_text,
        button_href,
        is_featured,
        sort_order
      `
    )
    .eq("is_published", true)
    .order("sort_order", {
      ascending: true,
    });

  const plans =
    (data || []) as PlanRow[];

  return (
    <section className="relative overflow-hidden bg-[#0d0d14] px-6 py-24 text-white">
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-purple-600/10 blur-[120px]" />

      <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        <SectionTitle
          badge="اختر الباقة المناسبة"
          title="استثمر في"
          highlightedText="مستقبلك اليوم"
          description="اختر الباقة المناسبة واستمتع بمئات الكورسات في مختلف المجالات."
          align="center"
        />

        {error ? (
          <GlassCard
            hover={false}
            className="mx-auto mt-16 max-w-2xl border-red-500/20 bg-red-500/5 p-8 text-center"
          >
            <p className="font-bold text-red-300">
              تعذر تحميل باقات
              الاشتراك حاليًا.
            </p>
          </GlassCard>
        ) : plans.length === 0 ? (
          <GlassCard
            hover={false}
            className="mx-auto mt-16 max-w-2xl p-10 text-center"
          >
            <Sparkles
              size={40}
              className="mx-auto text-purple-400"
            />

            <h3 className="mt-5 text-2xl font-black">
              لا توجد باقات متاحة
              حاليًا
            </h3>
          </GlassCard>
        ) : (
          <div
            className={`mt-16 grid items-stretch gap-8 ${
              plans.length === 1
                ? "mx-auto max-w-md"
                : plans.length === 2
                  ? "mx-auto max-w-4xl md:grid-cols-2"
                  : "lg:grid-cols-3"
            }`}
          >
            {plans.map((plan) => {
              const Icon =
                iconMap[
                  plan.icon_key
                ] || Sparkles;

              const currencyLabel =
                plan.currency === "EGP"
                  ? "جنيه"
                  : plan.currency;

              return (
                <GlassCard
                  key={plan.id}
                  as="article"
                  className={`relative flex h-full flex-col p-8 ${
                    plan.is_featured
                      ? "border-purple-500 bg-gradient-to-b from-purple-500/15 to-white/[0.04] shadow-2xl shadow-purple-950/40 hover:border-purple-400"
                      : "hover:border-purple-500/40"
                  }`}
                >
                  {plan.is_featured && (
                    <span className="absolute -top-4 right-1/2 translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm font-bold shadow-lg shadow-purple-950/40">
                      الأكثر طلبًا
                    </span>
                  )}

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
                    <Icon size={27} />
                  </div>

                  <h3 className="mt-6 text-2xl font-black">
                    {plan.name}
                  </h3>

                  <p className="mt-3 min-h-14 text-sm leading-7 text-zinc-400">
                    {plan.description}
                  </p>

                  <div className="mt-7 flex items-end gap-2">
                    <span className="text-5xl font-black">
                      {formatPrice(
                        plan.price_cents
                      )}
                    </span>

                    <span className="mb-1 text-zinc-400">
                      {currencyLabel} /{" "}
                      {plan.period_label}
                    </span>
                  </div>

                  <div className="mt-8 flex-1 space-y-4 border-t border-white/10 pt-7">
                    {(plan.features || []).map(
                      (feature) => (
                        <div
                          key={feature}
                          className="flex items-center gap-3 text-sm text-zinc-300"
                        >
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                            <Check
                              size={15}
                            />
                          </span>

                          <span>
                            {feature}
                          </span>
                        </div>
                      )
                    )}
                  </div>

                  <Button
                    href={plan.button_href}
                    variant={
                      plan.is_featured
                        ? "primary"
                        : "secondary"
                    }
                    className="mt-9 w-full py-4"
                  >
                    {plan.button_text}
                  </Button>
                </GlassCard>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  ArrowRight,
  Crown,
  Eye,
  EyeOff,
  Pencil,
  Sparkles,
  Star,
  WalletCards,
  Zap,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";

import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import GlassCard from "../../../components/ui/GlassCard";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

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
  duration_months: number | null;
  is_featured: boolean;
  paymob_enabled: boolean;
  sort_order: number;
  is_published: boolean;
};

const iconMap: Record<string, LucideIcon> = {
  Sparkles,
  Zap,
  Crown,
};

async function requireAdmin() {
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

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {
    redirect("/dashboard");
  }

  return supabase;
}

async function togglePlanPublished(
  formData: FormData
) {
  "use server";

  const id = String(
    formData.get("id") || ""
  );

  const currentValue =
    String(
      formData.get("currentValue") ||
        "false"
    ) === "true";

  if (!id) {
    return;
  }

  const supabase =
    await requireAdmin();

  await supabase
    .from("subscription_plans")
    .update({
      is_published: !currentValue,
    })
    .eq("id", id);

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
}

async function makePlanFeatured(
  formData: FormData
) {
  "use server";

  const id = String(
    formData.get("id") || ""
  );

  if (!id) {
    return;
  }

  const supabase =
    await requireAdmin();

  await supabase
    .from("subscription_plans")
    .update({
      is_featured: false,
    })
    .neq("id", id);

  await supabase
    .from("subscription_plans")
    .update({
      is_featured: true,
    })
    .eq("id", id);

  revalidatePath("/admin/plans");
  revalidatePath("/pricing");
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

export default async function PlansAdminPage() {
  const supabase =
    await requireAdmin();

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
        duration_months,
        is_featured,
        paymob_enabled,
        sort_order,
        is_published
      `
    )
    .order("sort_order", {
      ascending: true,
    });

  const plans =
    (data || []) as PlanRow[];

  const publishedCount =
    plans.filter(
      (plan) => plan.is_published
    ).length;

  const paidCount =
    plans.filter(
      (plan) =>
        plan.price_cents > 0 &&
        plan.paymob_enabled
    ).length;

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="border-b border-white/10 px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-purple-400"
          >
            <ArrowRight size={18} />
            الرجوع إلى لوحة الإدارة
          </Link>

          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-purple-400">
                إدارة الأسعار
              </p>

              <h1 className="mt-2 text-3xl font-black md:text-5xl">
                باقات الاشتراك
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
                تعديل أسعار الباقات
                ومميزاتها والتحكم في
                ظهورها داخل المنصة.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <GlassCard
                hover={false}
                className="p-4 text-center"
              >
                <p className="text-2xl font-black">
                  {plans.length}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  إجمالي الباقات
                </p>
              </GlassCard>

              <GlassCard
                hover={false}
                className="p-4 text-center"
              >
                <p className="text-2xl font-black text-emerald-400">
                  {publishedCount}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  باقات ظاهرة
                </p>
              </GlassCard>

              <GlassCard
                hover={false}
                className="p-4 text-center"
              >
                <p className="text-2xl font-black text-purple-400">
                  {paidCount}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  باقات مدفوعة
                </p>
              </GlassCard>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-7xl">
          {error ? (
            <GlassCard
              hover={false}
              className="border-red-500/20 bg-red-500/5 p-6"
            >
              <p className="font-bold text-red-300">
                تعذر تحميل الباقات.
              </p>
            </GlassCard>
          ) : plans.length === 0 ? (
            <GlassCard
              hover={false}
              className="p-10 text-center"
            >
              <WalletCards
                size={42}
                className="mx-auto text-zinc-600"
              />

              <h2 className="mt-5 text-2xl font-black">
                لا توجد باقات
              </h2>
            </GlassCard>
          ) : (
            <div className="grid gap-6 lg:grid-cols-3">
              {plans.map((plan) => {
                const Icon =
                  iconMap[plan.icon_key] ||
                  Sparkles;

                return (
                  <GlassCard
                    key={plan.id}
                    as="article"
                    className={`relative flex h-full flex-col p-7 ${
                      plan.is_featured
                        ? "border-purple-500 bg-purple-500/[0.08]"
                        : ""
                    }`}
                  >
                    {plan.is_featured && (
                      <span className="absolute -top-3 right-6 rounded-full bg-purple-600 px-4 py-1.5 text-xs font-black">
                        الأكثر طلبًا
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                        <Icon size={27} />
                      </div>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          plan.is_published
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {plan.is_published
                          ? "ظاهرة"
                          : "مخفية"}
                      </span>
                    </div>

                    <h2 className="mt-6 text-2xl font-black">
                      {plan.name}
                    </h2>

                    <p className="mt-3 min-h-14 text-sm leading-7 text-zinc-400">
                      {plan.description}
                    </p>

                    <div className="mt-6 flex items-end gap-2">
                      <span className="text-4xl font-black">
                        {formatPrice(
                          plan.price_cents
                        )}
                      </span>

                      <span className="mb-1 text-sm text-zinc-400">
                        جنيه /{" "}
                        {plan.period_label}
                      </span>
                    </div>

                    <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">
                          مفتاح الباقة
                        </span>
                        <span className="font-mono text-zinc-300">
                          {plan.plan_key}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">
                          مدة الاشتراك
                        </span>
                        <span className="font-bold">
                          {plan.duration_months
                            ? `${plan.duration_months} شهر`
                            : "بدون مدة"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">
                          الدفع الإلكتروني
                        </span>
                        <span
                          className={
                            plan.paymob_enabled
                              ? "font-bold text-emerald-400"
                              : "font-bold text-zinc-500"
                          }
                        >
                          {plan.paymob_enabled
                            ? "مفعّل"
                            : "غير مفعّل"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500">
                          عدد المميزات
                        </span>
                        <span className="font-bold">
                          {plan.features?.length ||
                            0}
                        </span>
                      </div>
                    </div>

                    <div className="mt-7 grid gap-3">
                      <Link
                        href={`/admin/plans/${plan.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 font-black transition hover:brightness-110"
                      >
                        <Pencil size={18} />
                        تعديل الباقة والسعر
                      </Link>

                      <form
                        action={
                          togglePlanPublished
                        }
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={plan.id}
                        />

                        <input
                          type="hidden"
                          name="currentValue"
                          value={String(
                            plan.is_published
                          )}
                        />

                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-zinc-300 transition hover:border-purple-500/40 hover:text-white"
                        >
                          {plan.is_published ? (
                            <>
                              <EyeOff
                                size={18}
                              />
                              إخفاء الباقة
                            </>
                          ) : (
                            <>
                              <Eye
                                size={18}
                              />
                              إظهار الباقة
                            </>
                          )}
                        </button>
                      </form>

                      {!plan.is_featured && (
                        <form
                          action={
                            makePlanFeatured
                          }
                        >
                          <input
                            type="hidden"
                            name="id"
                            value={plan.id}
                          />

                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-3 font-bold text-amber-300 transition hover:bg-amber-500/10"
                          >
                            <Star size={18} />
                            اجعلها الأكثر طلبًا
                          </button>
                        </form>
                      )}
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
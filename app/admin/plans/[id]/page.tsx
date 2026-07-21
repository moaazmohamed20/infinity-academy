import Link from "next/link";
import {
  redirect,
} from "next/navigation";
import {
  revalidatePath,
} from "next/cache";

import {
  ArrowRight,
  CheckCircle2,
  Crown,
  Save,
  Sparkles,
  Zap,
} from "lucide-react";

import Navbar from "../../../../components/layout/Navbar";
import Footer from "../../../../components/layout/Footer";
import GlassCard from "../../../../components/ui/GlassCard";
import { createClient } from "../../../../lib/supabase/server";

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
  button_text: string;
  button_href: string;
  duration_months: number | null;
  is_featured: boolean;
  paymob_enabled: boolean;
  sort_order: number;
  is_published: boolean;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

async function requireAdmin() {
  const supabase =
    await createClient();

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

async function updatePlan(
  planId: string,
  formData: FormData
) {
  "use server";

  const supabase =
    await requireAdmin();

  const name = String(
    formData.get("name") || ""
  ).trim();

  const priceValue = Number(
    formData.get("price") || 0
  );

  const periodLabel = String(
    formData.get("period_label") || ""
  ).trim();

  const description = String(
    formData.get("description") || ""
  ).trim();

  const iconKey = String(
    formData.get("icon_key") ||
      "Sparkles"
  );

  const buttonText = String(
    formData.get("button_text") || ""
  ).trim();

  const buttonHref = String(
    formData.get("button_href") || ""
  ).trim();

  const durationValue = String(
    formData.get("duration_months") ||
      ""
  ).trim();

  const sortOrderValue = Number(
    formData.get("sort_order") || 0
  );

  const featuresText = String(
    formData.get("features") || ""
  );

  const features = featuresText
    .split("\n")
    .map((feature) => feature.trim())
    .filter(Boolean);

  const isFeatured =
    formData.get("is_featured") ===
    "on";

  const isPublished =
    formData.get("is_published") ===
    "on";

  const priceCents = Math.round(
    priceValue * 100
  );

  const durationMonths =
    durationValue === ""
      ? null
      : Number(durationValue);

  const sortOrder = Math.round(
    sortOrderValue
  );

  const paymobEnabled =
    priceCents > 0 &&
    formData.get(
      "paymob_enabled"
    ) === "on";

  if (name.length < 2) {
    redirect(
      `/admin/plans/${planId}?error=${encodeURIComponent(
        "اكتب اسمًا صحيحًا للباقة."
      )}`
    );
  }

  if (
    !Number.isFinite(priceValue) ||
    priceValue < 0
  ) {
    redirect(
      `/admin/plans/${planId}?error=${encodeURIComponent(
        "اكتب سعرًا صحيحًا."
      )}`
    );
  }

  if (!periodLabel) {
    redirect(
      `/admin/plans/${planId}?error=${encodeURIComponent(
        "اكتب مدة أو فترة الباقة."
      )}`
    );
  }

  if (!description) {
    redirect(
      `/admin/plans/${planId}?error=${encodeURIComponent(
        "اكتب وصف الباقة."
      )}`
    );
  }

  if (!buttonText) {
    redirect(
      `/admin/plans/${planId}?error=${encodeURIComponent(
        "اكتب نص زر الباقة."
      )}`
    );
  }

  if (
    !buttonHref.startsWith("/")
  ) {
    redirect(
      `/admin/plans/${planId}?error=${encodeURIComponent(
        "رابط الزر يجب أن يبدأ بعلامة /"
      )}`
    );
  }

  if (
    durationMonths !== null &&
    (
      !Number.isInteger(
        durationMonths
      ) ||
      durationMonths <= 0
    )
  ) {
    redirect(
      `/admin/plans/${planId}?error=${encodeURIComponent(
        "مدة الاشتراك يجب أن تكون عدد شهور صحيحًا."
      )}`
    );
  }

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    redirect(
      `/admin/plans/${planId}?error=${encodeURIComponent(
        "ترتيب الباقة غير صحيح."
      )}`
    );
  }

  if (isFeatured) {
    const {
      error: featuredResetError,
    } = await supabase
      .from("subscription_plans")
      .update({
        is_featured: false,
      })
      .neq("id", planId);

    if (featuredResetError) {
      redirect(
        `/admin/plans/${planId}?error=${encodeURIComponent(
          "تعذر تحديث الباقة الأكثر طلبًا."
        )}`
      );
    }
  }

  const {
    error: updateError,
  } = await supabase
    .from("subscription_plans")
    .update({
      name,
      price_cents: priceCents,
      period_label: periodLabel,
      description,
      icon_key: iconKey,
      features,
      button_text: buttonText,
      button_href: buttonHref,
      duration_months:
        durationMonths,
      is_featured: isFeatured,
      paymob_enabled:
        paymobEnabled,
      sort_order: sortOrder,
      is_published: isPublished,
    })
    .eq("id", planId);

  if (updateError) {
    console.error(
      "Plan update error:",
      updateError
    );

    redirect(
      `/admin/plans/${planId}?error=${encodeURIComponent(
        "تعذر حفظ تعديلات الباقة."
      )}`
    );
  }

  revalidatePath("/");
  revalidatePath("/pricing");
  revalidatePath("/checkout");
  revalidatePath("/admin/plans");
  revalidatePath(
    `/admin/plans/${planId}`
  );

  redirect(
    `/admin/plans/${planId}?success=1`
  );
}

export default async function EditPlanPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;

  const query =
    await searchParams;

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
        button_text,
        button_href,
        duration_months,
        is_featured,
        paymob_enabled,
        sort_order,
        is_published
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    redirect("/admin/plans");
  }

  const plan =
    data as PlanRow;

  const saveAction =
    updatePlan.bind(null, plan.id);

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="border-b border-white/10 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/admin/plans"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-purple-400"
          >
            <ArrowRight size={18} />
            الرجوع إلى الباقات
          </Link>

          <div className="mt-8">
            <p className="text-sm font-bold text-purple-400">
              تعديل الباقة
            </p>

            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              {plan.name}
            </h1>

            <p className="mt-4 text-zinc-400">
              غيّر السعر والمميزات
              والإعدادات من هنا بدون
              تعديل البرمجة.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          {query.success === "1" && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-300">
              <CheckCircle2
                size={22}
              />

              <p className="font-bold">
                تم حفظ تعديلات الباقة
                بنجاح.
              </p>
            </div>
          )}

          {query.error && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 font-bold text-red-300">
              {query.error}
            </div>
          )}

          <form action={saveAction}>
            <GlassCard
              hover={false}
              className="p-6 md:p-9"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="plan_key"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    مفتاح الباقة
                  </label>

                  <input
                    id="plan_key"
                    value={plan.plan_key}
                    disabled
                    className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-zinc-500 outline-none"
                  />

                  <p className="mt-2 text-xs text-zinc-600">
                    لا يتم تغييره لأنه
                    مرتبط بنظام الدفع.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    اسم الباقة
                  </label>

                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    defaultValue={
                      plan.name
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-purple-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="price"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    السعر بالجنيه
                  </label>

                  <input
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    defaultValue={
                      plan.price_cents /
                      100
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-purple-500"
                  />

                  <p className="mt-2 text-xs text-zinc-600">
                    مثال: 299 أو 2499
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="period_label"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    فترة الباقة
                  </label>

                  <input
                    id="period_label"
                    name="period_label"
                    type="text"
                    required
                    defaultValue={
                      plan.period_label
                    }
                    placeholder="شهريًا"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-purple-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="duration_months"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    مدة الاشتراك بالشهور
                  </label>

                  <input
                    id="duration_months"
                    name="duration_months"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={
                      plan.duration_months ??
                      ""
                    }
                    placeholder="اتركها فارغة للمجانية"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-purple-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sort_order"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    ترتيب الظهور
                  </label>

                  <input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    min="0"
                    step="1"
                    required
                    defaultValue={
                      plan.sort_order
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-purple-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="icon_key"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    أيقونة الباقة
                  </label>

                  <select
                    id="icon_key"
                    name="icon_key"
                    defaultValue={
                      plan.icon_key
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111118] px-4 py-3 outline-none transition focus:border-purple-500"
                  >
                    <option value="Sparkles">
                      النجوم
                    </option>

                    <option value="Zap">
                      البرق
                    </option>

                    <option value="Crown">
                      التاج
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="button_text"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    نص زر الاشتراك
                  </label>

                  <input
                    id="button_text"
                    name="button_text"
                    type="text"
                    required
                    defaultValue={
                      plan.button_text
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="button_href"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    رابط زر الاشتراك
                  </label>

                  <input
                    id="button_href"
                    name="button_href"
                    type="text"
                    required
                    defaultValue={
                      plan.button_href
                    }
                    dir="ltr"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left outline-none transition focus:border-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    وصف الباقة
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    defaultValue={
                      plan.description
                    }
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 leading-7 outline-none transition focus:border-purple-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="features"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    مميزات الباقة
                  </label>

                  <textarea
                    id="features"
                    name="features"
                    rows={8}
                    defaultValue={
                      plan.features?.join(
                        "\n"
                      ) || ""
                    }
                    placeholder={
                      "اكتب كل ميزة في سطر منفصل"
                    }
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 leading-8 outline-none transition focus:border-purple-500"
                  />

                  <p className="mt-2 text-xs text-zinc-600">
                    اكتب كل ميزة في سطر
                    مستقل.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 border-t border-white/10 pt-7 md:grid-cols-3">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <input
                    name="is_published"
                    type="checkbox"
                    defaultChecked={
                      plan.is_published
                    }
                    className="h-5 w-5 accent-purple-600"
                  />

                  <span className="font-bold">
                    الباقة ظاهرة
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <input
                    name="paymob_enabled"
                    type="checkbox"
                    defaultChecked={
                      plan.paymob_enabled
                    }
                    className="h-5 w-5 accent-purple-600"
                  />

                  <span className="font-bold">
                    الدفع الإلكتروني مفعّل
                  </span>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <input
                    name="is_featured"
                    type="checkbox"
                    defaultChecked={
                      plan.is_featured
                    }
                    className="h-5 w-5 accent-purple-600"
                  />

                  <span className="font-bold">
                    الأكثر طلبًا
                  </span>
                </label>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black transition hover:brightness-110"
                >
                  <Save size={20} />
                  حفظ تعديلات الباقة
                </button>

                <Link
                  href="/pricing"
                  target="_blank"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-4 font-bold text-zinc-300 transition hover:border-purple-500/40 hover:text-white"
                >
                  {plan.icon_key ===
                  "Crown" ? (
                    <Crown size={19} />
                  ) : plan.icon_key ===
                    "Zap" ? (
                    <Zap size={19} />
                  ) : (
                    <Sparkles
                      size={19}
                    />
                  )}

                  معاينة صفحة الأسعار
                </Link>
              </div>
            </GlassCard>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  );
}
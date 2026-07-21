import Link from "next/link";
import {
  redirect,
} from "next/navigation";
import {
  revalidatePath,
} from "next/cache";

import {
  ArrowRight,
  CalendarDays,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  TicketPercent,
  Trash2,
  Users,
} from "lucide-react";

import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import GlassCard from "../../../components/ui/GlassCard";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type PromoCodeRow = {
  id: string;
  code: string;
  description: string | null;
  discount_type:
    | "percentage"
    | "fixed";
  discount_value: number;
  applicable_plan_keys:
    | string[]
    | null;
  minimum_amount_cents: number;
  maximum_discount_cents:
    | number
    | null;
  starts_at: string | null;
  expires_at: string | null;
  max_total_uses: number | null;
  max_uses_per_user: number;
  current_uses: number;
  is_active: boolean;
  created_at: string;
};

type PageProps = {
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

async function togglePromoCode(
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

  const {
    error,
  } = await supabase
    .from("promo_codes")
    .update({
      is_active: !currentValue,
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/admin/promo-codes?error=${encodeURIComponent(
        "تعذر تحديث حالة كود الخصم."
      )}`
    );
  }

  revalidatePath(
    "/admin/promo-codes"
  );

  redirect(
    "/admin/promo-codes?success=status"
  );
}

async function deletePromoCode(
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

  const {
    error,
  } = await supabase
    .from("promo_codes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(
      "Promo code delete error:",
      error
    );

    redirect(
      `/admin/promo-codes?error=${encodeURIComponent(
        "لا يمكن حذف الكود لأنه مرتبط بعمليات دفع. يمكنك إيقافه بدلًا من حذفه."
      )}`
    );
  }

  revalidatePath(
    "/admin/promo-codes"
  );

  redirect(
    "/admin/promo-codes?success=deleted"
  );
}

function formatMoney(
  amountCents: number
) {
  return new Intl.NumberFormat(
    "ar-EG",
    {
      maximumFractionDigits: 2,
    }
  ).format(amountCents / 100);
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "غير محدد";
  }

  const date = new Date(value);

  if (
    Number.isNaN(date.getTime())
  ) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat(
    "ar-EG",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

function getDiscountText(
  promoCode: PromoCodeRow
) {
  if (
    promoCode.discount_type ===
    "percentage"
  ) {
    return `${promoCode.discount_value}%`;
  }

  return `${formatMoney(
    promoCode.discount_value
  )} جنيه`;
}

function getPlanText(
  planKeys: string[] | null
) {
  const keys = planKeys || [];

  const labels = keys.map(
    (planKey) => {
      if (planKey === "monthly") {
        return "الشهرية";
      }

      if (planKey === "yearly") {
        return "السنوية";
      }

      return planKey;
    }
  );

  return labels.length > 0
    ? labels.join("، ")
    : "لا توجد باقات";
}

export default async function PromoCodesPage({
  searchParams,
}: PageProps) {
  const query =
    await searchParams;

  const supabase =
    await requireAdmin();

  const {
    data,
    error,
  } = await supabase
    .from("promo_codes")
    .select(
      `
        id,
        code,
        description,
        discount_type,
        discount_value,
        applicable_plan_keys,
        minimum_amount_cents,
        maximum_discount_cents,
        starts_at,
        expires_at,
        max_total_uses,
        max_uses_per_user,
        current_uses,
        is_active,
        created_at
      `
    )
    .order("created_at", {
      ascending: false,
    });

  const promoCodes =
    (data || []) as PromoCodeRow[];

  const activeCount =
    promoCodes.filter(
      (promoCode) =>
        promoCode.is_active
    ).length;

  const totalUses =
    promoCodes.reduce(
      (total, promoCode) =>
        total +
        Number(
          promoCode.current_uses || 0
        ),
      0
    );

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

          <div className="mt-8 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold text-purple-400">
                إدارة الخصومات
              </p>

              <h1 className="mt-2 text-3xl font-black md:text-5xl">
                أكواد الخصم
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
                أنشئ أكواد خصم وحدد
                قيمتها ومدتها والباقات
                المتاحة لها بدون تعديل
                البرمجة.
              </p>
            </div>

            <Link
              href="/admin/promo-codes/new"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-black transition hover:brightness-110"
            >
              <Plus size={20} />
              إضافة كود خصم
            </Link>
          </div>

          <div className="mt-9 grid max-w-xl grid-cols-3 gap-3">
            <GlassCard
              hover={false}
              className="p-4 text-center"
            >
              <p className="text-2xl font-black">
                {promoCodes.length}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                إجمالي الأكواد
              </p>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-4 text-center"
            >
              <p className="text-2xl font-black text-emerald-400">
                {activeCount}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                أكواد مفعّلة
              </p>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-4 text-center"
            >
              <p className="text-2xl font-black text-purple-400">
                {totalUses}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                مرات الاستخدام
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-7xl">
          {query.success ===
            "deleted" && (
            <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 font-bold text-emerald-300">
              تم حذف كود الخصم بنجاح.
            </div>
          )}

          {query.success ===
            "status" && (
            <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 font-bold text-emerald-300">
              تم تحديث حالة كود الخصم.
            </div>
          )}

          {query.error && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 font-bold text-red-300">
              {query.error}
            </div>
          )}

          {error ? (
            <GlassCard
              hover={false}
              className="border-red-500/20 bg-red-500/5 p-8 text-center"
            >
              <p className="font-bold text-red-300">
                تعذر تحميل أكواد الخصم.
              </p>
            </GlassCard>
          ) : promoCodes.length === 0 ? (
            <GlassCard
              hover={false}
              className="p-12 text-center"
            >
              <TicketPercent
                size={46}
                className="mx-auto text-purple-400"
              />

              <h2 className="mt-5 text-2xl font-black">
                لا توجد أكواد خصم
              </h2>

              <p className="mt-3 text-zinc-400">
                أنشئ أول كود خصم من لوحة
                الإدارة.
              </p>

              <Link
                href="/admin/promo-codes/new"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-black transition hover:bg-purple-500"
              >
                <Plus size={19} />
                إضافة أول كود
              </Link>
            </GlassCard>
          ) : (
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {promoCodes.map(
                (promoCode) => (
                  <GlassCard
                    key={promoCode.id}
                    as="article"
                    className="flex h-full flex-col p-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                        <TicketPercent
                          size={27}
                        />
                      </span>

                      <span
                        className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                          promoCode.is_active
                            ? "bg-emerald-500/10 text-emerald-300"
                            : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {promoCode.is_active
                          ? "مفعّل"
                          : "متوقف"}
                      </span>
                    </div>

                    <div className="mt-6">
                      <p
                        dir="ltr"
                        className="font-mono text-2xl font-black tracking-wider text-purple-300"
                      >
                        {promoCode.code}
                      </p>

                      <p className="mt-3 min-h-12 text-sm leading-6 text-zinc-400">
                        {promoCode.description ||
                          "لا يوجد وصف للكود."}
                      </p>
                    </div>

                    <div className="mt-6 rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] p-5">
                      <p className="text-sm text-zinc-400">
                        قيمة الخصم
                      </p>

                      <p className="mt-2 text-3xl font-black text-purple-300">
                        {getDiscountText(
                          promoCode
                        )}
                      </p>

                      {promoCode.maximum_discount_cents !==
                        null &&
                        promoCode.discount_type ===
                          "percentage" && (
                          <p className="mt-2 text-xs text-zinc-500">
                            بحد أقصى{" "}
                            {formatMoney(
                              promoCode.maximum_discount_cents
                            )}{" "}
                            جنيه
                          </p>
                        )}
                    </div>

                    <div className="mt-6 flex-1 space-y-4 border-t border-white/10 pt-6 text-sm">
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-zinc-500">
                          الباقات
                        </span>

                        <span className="text-left font-bold">
                          {getPlanText(
                            promoCode.applicable_plan_keys
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-zinc-500">
                          <CalendarDays
                            size={16}
                          />
                          البداية
                        </span>

                        <span className="font-bold">
                          {formatDate(
                            promoCode.starts_at
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-zinc-500">
                          <CalendarDays
                            size={16}
                          />
                          النهاية
                        </span>

                        <span className="font-bold">
                          {formatDate(
                            promoCode.expires_at
                          )}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-2 text-zinc-500">
                          <Users size={16} />
                          الاستخدام
                        </span>

                        <span className="font-bold">
                          {promoCode.current_uses}
                          {" / "}
                          {promoCode.max_total_uses ??
                            "غير محدود"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-zinc-500">
                          لكل طالب
                        </span>

                        <span className="font-bold">
                          {
                            promoCode.max_uses_per_user
                          }{" "}
                          مرة
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-zinc-500">
                          الحد الأدنى
                        </span>

                        <span className="font-bold">
                          {formatMoney(
                            promoCode.minimum_amount_cents
                          )}{" "}
                          جنيه
                        </span>
                      </div>
                    </div>

                    <div className="mt-7 grid gap-3">
                      <Link
                        href={`/admin/promo-codes/${promoCode.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 font-black transition hover:brightness-110"
                      >
                        <Pencil size={18} />
                        تعديل الكود
                      </Link>

                      <form
                        action={
                          togglePromoCode
                        }
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={
                            promoCode.id
                          }
                        />

                        <input
                          type="hidden"
                          name="currentValue"
                          value={String(
                            promoCode.is_active
                          )}
                        />

                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-zinc-300 transition hover:border-purple-500/40 hover:text-white"
                        >
                          {promoCode.is_active ? (
                            <>
                              <EyeOff
                                size={18}
                              />
                              إيقاف الكود
                            </>
                          ) : (
                            <>
                              <Eye
                                size={18}
                              />
                              تفعيل الكود
                            </>
                          )}
                        </button>
                      </form>

                      <form
                        action={
                          deletePromoCode
                        }
                      >
                        <input
                          type="hidden"
                          name="id"
                          value={
                            promoCode.id
                          }
                        />

                        <button
                          type="submit"
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.05] px-5 py-3 font-bold text-red-300 transition hover:bg-red-500/10"
                        >
                          <Trash2
                            size={18}
                          />
                          حذف الكود
                        </button>
                      </form>
                    </div>
                  </GlassCard>
                )
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
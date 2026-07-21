import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  ArrowRight,
  CalendarDays,
  Percent,
  Save,
  TicketPercent,
  WalletCards,
} from "lucide-react";

import Navbar from "../../../../components/layout/Navbar";
import Footer from "../../../../components/layout/Footer";
import GlassCard from "../../../../components/ui/GlassCard";
import { createClient } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
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

  return {
    supabase,
    userId,
  };
}

function redirectWithError(
  message: string
): never {
  redirect(
    `/admin/promo-codes/new?error=${encodeURIComponent(
      message
    )}`
  );
}

function getDateStart(
  value: string
) {
  if (!value) {
    return null;
  }

  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return date.toISOString();
}

function getDateEnd(
  value: string
) {
  if (!value) {
    return null;
  }

  const date = new Date(
    `${value}T23:59:59.999Z`
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return date.toISOString();
}

async function createPromoCode(
  formData: FormData
) {
  "use server";

  const {
    supabase,
    userId,
  } = await requireAdmin();

  const code = String(
    formData.get("code") || ""
  )
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");

  const description = String(
    formData.get("description") || ""
  ).trim();

  const discountTypeValue =
    String(
      formData.get(
        "discount_type"
      ) || ""
    );

  const discountType:
    | "percentage"
    | "fixed"
    | null =
    discountTypeValue ===
    "percentage"
      ? "percentage"
      : discountTypeValue ===
          "fixed"
        ? "fixed"
        : null;

  const discountInput = Number(
    formData.get(
      "discount_value"
    ) || 0
  );

  const minimumAmountInput =
    Number(
      formData.get(
        "minimum_amount"
      ) || 0
    );

  const maximumDiscountRaw =
    String(
      formData.get(
        "maximum_discount"
      ) || ""
    ).trim();

  const maxTotalUsesRaw =
    String(
      formData.get(
        "max_total_uses"
      ) || ""
    ).trim();

  const maxUsesPerUser =
    Number(
      formData.get(
        "max_uses_per_user"
      ) || 1
    );

  const startsAtRaw = String(
    formData.get("starts_at") ||
      ""
  ).trim();

  const expiresAtRaw = String(
    formData.get("expires_at") ||
      ""
  ).trim();

  const applicablePlanKeys =
    formData
      .getAll(
        "applicable_plan_keys"
      )
      .map((value) =>
        String(value)
      )
      .filter(
        (value) =>
          value === "monthly" ||
          value === "yearly"
      );

  const isActive =
    formData.get("is_active") ===
    "on";

  if (
    !/^[A-Z0-9_-]{3,30}$/.test(
      code
    )
  ) {
    redirectWithError(
      "كود الخصم يجب أن يكون من 3 إلى 30 حرفًا، ويحتوي على حروف إنجليزية أو أرقام فقط."
    );
  }

  if (!discountType) {
    redirectWithError(
      "اختر نوع الخصم."
    );
  }

  if (
    !Number.isFinite(
      discountInput
    ) ||
    discountInput <= 0
  ) {
    redirectWithError(
      "اكتب قيمة خصم صحيحة."
    );
  }

  if (
    discountType ===
      "percentage" &&
    (
      !Number.isInteger(
        discountInput
      ) ||
      discountInput > 100
    )
  ) {
    redirectWithError(
      "نسبة الخصم يجب أن تكون عددًا صحيحًا من 1 إلى 100."
    );
  }

  if (
    !Number.isFinite(
      minimumAmountInput
    ) ||
    minimumAmountInput < 0
  ) {
    redirectWithError(
      "الحد الأدنى للطلب غير صحيح."
    );
  }

  if (
    applicablePlanKeys.length ===
    0
  ) {
    redirectWithError(
      "اختر باقة واحدة على الأقل."
    );
  }

  if (
    !Number.isInteger(
      maxUsesPerUser
    ) ||
    maxUsesPerUser <= 0
  ) {
    redirectWithError(
      "عدد مرات الاستخدام لكل طالب غير صحيح."
    );
  }

  const maxTotalUses =
    maxTotalUsesRaw === ""
      ? null
      : Number(maxTotalUsesRaw);

  if (
    maxTotalUses !== null &&
    (
      !Number.isInteger(
        maxTotalUses
      ) ||
      maxTotalUses <= 0
    )
  ) {
    redirectWithError(
      "الحد الإجمالي للاستخدام يجب أن يكون عددًا صحيحًا."
    );
  }

  const maximumDiscountInput =
    maximumDiscountRaw === ""
      ? null
      : Number(
          maximumDiscountRaw
        );

  if (
    maximumDiscountInput !==
      null &&
    (
      !Number.isFinite(
        maximumDiscountInput
      ) ||
      maximumDiscountInput <= 0
    )
  ) {
    redirectWithError(
      "الحد الأقصى للخصم غير صحيح."
    );
  }

  const startsAt =
    getDateStart(startsAtRaw);

  const expiresAt =
    getDateEnd(expiresAtRaw);

  if (
    startsAtRaw &&
    !startsAt
  ) {
    redirectWithError(
      "تاريخ بداية الكود غير صحيح."
    );
  }

  if (
    expiresAtRaw &&
    !expiresAt
  ) {
    redirectWithError(
      "تاريخ انتهاء الكود غير صحيح."
    );
  }

  if (
    startsAt &&
    expiresAt &&
    new Date(expiresAt).getTime() <=
      new Date(startsAt).getTime()
  ) {
    redirectWithError(
      "تاريخ انتهاء الكود يجب أن يكون بعد تاريخ البداية."
    );
  }

  const discountValue =
    discountType === "fixed"
      ? Math.round(
          discountInput * 100
        )
      : Math.round(
          discountInput
        );

  const minimumAmountCents =
    Math.round(
      minimumAmountInput * 100
    );

  const maximumDiscountCents =
    discountType ===
      "percentage" &&
    maximumDiscountInput !== null
      ? Math.round(
          maximumDiscountInput *
            100
        )
      : null;

  const {
    error,
  } = await supabase
    .from("promo_codes")
    .insert({
      code,
      description:
        description || null,

      discount_type:
        discountType,

      discount_value:
        discountValue,

      applicable_plan_keys:
        applicablePlanKeys,

      minimum_amount_cents:
        minimumAmountCents,

      maximum_discount_cents:
        maximumDiscountCents,

      starts_at: startsAt,

      expires_at: expiresAt,

      max_total_uses:
        maxTotalUses,

      max_uses_per_user:
        maxUsesPerUser,

      is_active: isActive,

      created_by: userId,
    });

  if (error) {
    console.error(
      "Promo code creation error:",
      error
    );

    if (error.code === "23505") {
      redirectWithError(
        "كود الخصم موجود بالفعل. استخدم كودًا مختلفًا."
      );
    }

    redirectWithError(
      "تعذر إنشاء كود الخصم."
    );
  }

  revalidatePath(
    "/admin/promo-codes"
  );

  redirect(
    "/admin/promo-codes?success=created"
  );
}

export default async function NewPromoCodePage({
  searchParams,
}: PageProps) {
  const query =
    await searchParams;

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="border-b border-white/10 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/admin/promo-codes"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-purple-400"
          >
            <ArrowRight size={18} />
            الرجوع إلى أكواد الخصم
          </Link>

          <div className="mt-8">
            <p className="text-sm font-bold text-purple-400">
              إنشاء خصم جديد
            </p>

            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              إضافة كود خصم
            </h1>

            <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
              حدد قيمة الخصم والباقات
              ومدة الصلاحية وعدد مرات
              الاستخدام.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          {query.error && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 font-bold text-red-300">
              {query.error}
            </div>
          )}

          <form action={createPromoCode}>
            <GlassCard
              hover={false}
              className="p-6 md:p-9"
            >
              <div className="flex items-center gap-4 border-b border-white/10 pb-7">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                  <TicketPercent
                    size={28}
                  />
                </span>

                <div>
                  <h2 className="text-2xl font-black">
                    بيانات الكود
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    اكتب إعدادات كود
                    الخصم الجديد.
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="code"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    كود الخصم
                  </label>

                  <input
                    id="code"
                    name="code"
                    type="text"
                    required
                    minLength={3}
                    maxLength={30}
                    dir="ltr"
                    placeholder="WELCOME20"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left font-mono font-bold uppercase tracking-wider outline-none transition focus:border-purple-500"
                  />

                  <p className="mt-2 text-xs text-zinc-600">
                    حروف إنجليزية وأرقام
                    فقط، بدون مسافات.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="discount_type"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    نوع الخصم
                  </label>

                  <select
                    id="discount_type"
                    name="discount_type"
                    required
                    defaultValue="percentage"
                    className="w-full rounded-xl border border-white/10 bg-[#111118] px-4 py-3 outline-none transition focus:border-purple-500"
                  >
                    <option value="percentage">
                      نسبة مئوية
                    </option>

                    <option value="fixed">
                      مبلغ ثابت بالجنيه
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="discount_value"
                    className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300"
                  >
                    <Percent
                      size={17}
                      className="text-purple-400"
                    />
                    قيمة الخصم
                  </label>

                  <input
                    id="discount_value"
                    name="discount_value"
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="20"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-purple-500"
                  />

                  <p className="mt-2 text-xs leading-6 text-zinc-600">
                    عند اختيار النسبة:
                    اكتب 20 لخصم 20٪.
                    وعند اختيار مبلغ ثابت:
                    اكتب المبلغ بالجنيه.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="minimum_amount"
                    className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300"
                  >
                    <WalletCards
                      size={17}
                      className="text-purple-400"
                    />
                    الحد الأدنى للطلب
                  </label>

                  <input
                    id="minimum_amount"
                    name="minimum_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-purple-500"
                  />

                  <p className="mt-2 text-xs text-zinc-600">
                    اكتب القيمة بالجنيه،
                    أو صفر بدون حد أدنى.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="maximum_discount"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    الحد الأقصى للخصم
                  </label>

                  <input
                    id="maximum_discount"
                    name="maximum_discount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="اختياري"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-purple-500"
                  />

                  <p className="mt-2 text-xs leading-6 text-zinc-600">
                    يُستخدم مع الخصم
                    بالنسبة المئوية، والقيمة
                    بالجنيه.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="max_total_uses"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    إجمالي مرات الاستخدام
                  </label>

                  <input
                    id="max_total_uses"
                    name="max_total_uses"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="اتركه فارغًا لعدد غير محدود"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-purple-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="max_uses_per_user"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    مرات الاستخدام لكل طالب
                  </label>

                  <input
                    id="max_uses_per_user"
                    name="max_uses_per_user"
                    type="number"
                    min="1"
                    step="1"
                    required
                    defaultValue="1"
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 outline-none transition focus:border-purple-500"
                  />
                </div>

                <div>
                  <p className="mb-3 text-sm font-bold text-zinc-300">
                    الباقات المتاحة
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <input
                        name="applicable_plan_keys"
                        value="monthly"
                        type="checkbox"
                        defaultChecked
                        className="h-5 w-5 accent-purple-600"
                      />

                      <span className="font-bold">
                        الباقة الشهرية
                      </span>
                    </label>

                    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                      <input
                        name="applicable_plan_keys"
                        value="yearly"
                        type="checkbox"
                        defaultChecked
                        className="h-5 w-5 accent-purple-600"
                      />

                      <span className="font-bold">
                        الباقة السنوية
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="starts_at"
                    className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300"
                  >
                    <CalendarDays
                      size={17}
                      className="text-purple-400"
                    />
                    تاريخ البداية
                  </label>

                  <input
                    id="starts_at"
                    name="starts_at"
                    type="date"
                    className="w-full rounded-xl border border-white/10 bg-[#111118] px-4 py-3 outline-none transition focus:border-purple-500"
                  />

                  <p className="mt-2 text-xs text-zinc-600">
                    اتركه فارغًا ليبدأ
                    فورًا.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="expires_at"
                    className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300"
                  >
                    <CalendarDays
                      size={17}
                      className="text-purple-400"
                    />
                    تاريخ الانتهاء
                  </label>

                  <input
                    id="expires_at"
                    name="expires_at"
                    type="date"
                    className="w-full rounded-xl border border-white/10 bg-[#111118] px-4 py-3 outline-none transition focus:border-purple-500"
                  />

                  <p className="mt-2 text-xs text-zinc-600">
                    اتركه فارغًا بدون
                    تاريخ انتهاء.
                  </p>
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-bold text-zinc-300"
                  >
                    وصف الكود
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    placeholder="مثال: خصم ترحيبي للطلاب الجدد"
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/30 px-4 py-3 leading-7 outline-none transition focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="mt-8 border-t border-white/10 pt-7">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-4">
                  <input
                    name="is_active"
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 accent-purple-600"
                  />

                  <div>
                    <p className="font-bold">
                      تفعيل كود الخصم
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      يمكن إيقافه لاحقًا
                      من صفحة إدارة الأكواد.
                    </p>
                  </div>
                </label>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black transition hover:brightness-110"
                >
                  <Save size={20} />
                  إنشاء كود الخصم
                </button>

                <Link
                  href="/admin/promo-codes"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-7 py-4 font-bold text-zinc-300 transition hover:border-purple-500/40 hover:text-white"
                >
                  إلغاء
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
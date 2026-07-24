import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Crown,
  Mail,
  RotateCcw,
  Search,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GlassCard from "@/components/ui/GlassCard";
import { createClient } from "@/lib/supabase/server";

import {
  demoteAdmin,
  promoteToAdmin,
} from "./actions";
import SubmitButton from "./SubmitButton";

type PageProps = {
  searchParams: Promise<{
    q?: string | string[];
    success?: string | string[];
    error?: string | string[];
  }>;
};

type AccountRecord = {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  joined_at: string;
};

type AccountRpcRow = {
  user_id: unknown;
  full_name: unknown;
  email: unknown;
  role: unknown;
  joined_at: unknown;
};

function getSingleParameter(
  value: string | string[] | undefined
) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function getInitial(name: string) {
  const trimmedName = name.trim();

  return trimmedName
    ? trimmedName.charAt(0)
    : "م";
}

const successMessages: Record<string, string> = {
  promoted:
    "تم منح الحساب صلاحية الأدمن بنجاح.",
  demoted:
    "تم إلغاء صلاحية الأدمن وإعادة الحساب إلى طالب.",
};

const errorMessages: Record<string, string> = {
  invalid_user:
    "معرّف الحساب غير صحيح.",
  user_not_found:
    "لم يتم العثور على الحساب المطلوب.",
  already_admin:
    "هذا الحساب يمتلك صلاحية الأدمن بالفعل.",
  cannot_demote_owner:
    "لا يمكن إلغاء صلاحية مالك المنصة.",
  last_admin:
    "لا يمكن إزالة صلاحية آخر أدمن في المنصة.",
  not_admin:
    "الحساب المحدد ليس أدمن.",
  count_failed:
    "تعذر التحقق من عدد الأدمنز.",
  promote_failed:
    "تعذر منح الحساب صلاحية الأدمن.",
  demote_failed:
    "تعذر إلغاء صلاحية الأدمن.",
};

export default async function AdminAdminsPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams =
    await searchParams;

  const searchQuery = getSingleParameter(
    resolvedSearchParams.q
  )
    .trim()
    .toLowerCase();

  const successCode = getSingleParameter(
    resolvedSearchParams.success
  );

  const errorCode = getSingleParameter(
    resolvedSearchParams.error
  );

  const successMessage =
    successMessages[successCode] ?? "";

  const errorMessage =
    errorMessages[errorCode] ?? "";

  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const claims = claimsData?.claims as
    | Record<string, unknown>
    | undefined;

  const currentUserId =
    typeof claims?.sub === "string"
      ? claims.sub
      : "";

  if (claimsError || !currentUserId) {
    redirect("/login");
  }

  const {
    data: currentProfile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select(
      "full_name, role, is_owner"
    )
    .eq("id", currentUserId)
    .maybeSingle();

  if (
    profileError ||
    !currentProfile ||
    currentProfile.role !== "admin" ||
    currentProfile.is_owner !== true
  ) {
    redirect("/admin");
  }

  const {
    data: accountsData,
    error: accountsError,
  } = await supabase.rpc(
    "get_admin_students"
  );

  if (accountsError) {
    console.error(
      "تعذر تحميل حسابات المنصة:",
      accountsError
    );
  }

  const accountRows =
    (accountsData ?? []) as AccountRpcRow[];

  const accounts: AccountRecord[] =
    accountsError
      ? []
      : accountRows.map((account) => ({
          user_id: String(
            account.user_id ?? ""
          ),

          full_name: String(
            account.full_name || "مستخدم"
          ),

          email: String(
            account.email || ""
          ),

          role: String(
            account.role || "student"
          ),

          joined_at: String(
            account.joined_at || ""
          ),
        }));

  const filteredAccounts =
    accounts.filter((account) => {
      if (!searchQuery) {
        return true;
      }

      const searchableText =
        `${account.full_name} ${account.email}`.toLowerCase();

      return searchableText.includes(
        searchQuery
      );
    });

  const adminAccounts =
    filteredAccounts.filter(
      (account) =>
        account.role === "admin"
    );

  const studentAccounts =
    filteredAccounts.filter(
      (account) =>
        account.role !== "admin"
    );

  const totalAdmins = accounts.filter(
    (account) =>
      account.role === "admin"
  ).length;

  const totalStudents = accounts.filter(
    (account) =>
      account.role !== "admin"
  ).length;

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-16">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-purple-400"
          >
            <ArrowRight size={17} />
            العودة إلى لوحة الإدارة
          </Link>

          <div className="mt-7 flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
              <ShieldCheck size={31} />
            </div>

            <div>
              <p className="text-sm font-bold text-purple-400">
                صلاحيات مالك المنصة
              </p>

              <h1 className="mt-2 text-3xl font-black md:text-5xl">
                إدارة الأدمنز
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                هذه الصفحة متاحة لمالك
                المنصة فقط، ويمكنك من خلالها
                منح صلاحية الإدارة أو إلغاؤها
                من الأدمنز الحاليين.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
          <GlassCard
            hover={false}
            className="p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-zinc-400">
                  إجمالي الأدمنز
                </p>

                <p className="mt-3 text-4xl font-black text-purple-400">
                  {totalAdmins}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Crown size={23} />
              </div>
            </div>
          </GlassCard>

          <GlassCard
            hover={false}
            className="p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-zinc-400">
                  حسابات الطلاب
                </p>

                <p className="mt-3 text-4xl font-black text-blue-400">
                  {totalStudents}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <UsersRound size={23} />
              </div>
            </div>
          </GlassCard>

          <GlassCard
            hover={false}
            className="p-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-zinc-400">
                  مالك المنصة
                </p>

                <p className="mt-3 text-xl font-black">
                  {currentProfile.full_name ||
                    "مالك المنصة"}
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Crown size={23} />
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="px-6 pb-8">
        <div className="mx-auto max-w-7xl">
          {successMessage && (
            <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 font-bold text-emerald-300">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 font-bold text-red-300">
              {errorMessage}
            </div>
          )}

          <GlassCard
            hover={false}
            className="p-6"
          >
            <form className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
              <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                <Search
                  size={19}
                  className="shrink-0 text-zinc-600"
                />

                <input
                  name="q"
                  type="search"
                  defaultValue={searchQuery}
                  placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                  className="w-full bg-transparent px-3 py-4 outline-none placeholder:text-zinc-700"
                />
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-black transition hover:brightness-110"
              >
                <Search size={18} />
                بحث
              </button>

              <Link
                href="/admin/admins"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-zinc-300 transition hover:border-purple-500/40 hover:bg-purple-500/10"
              >
                <RotateCcw size={18} />
                مسح
              </Link>
            </form>
          </GlassCard>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold text-purple-400">
            الأدمنز الحاليون
          </p>

          <h2 className="mt-2 text-3xl font-black">
            حسابات الإدارة
          </h2>

          <div className="mt-7 space-y-4">
            {adminAccounts.length > 0 ? (
              adminAccounts.map((account) => {
                const isOwnerAccount =
                  account.user_id ===
                  currentUserId;

                return (
                  <GlassCard
                    key={account.user_id}
                    hover={false}
                    className="p-6"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-xl font-black">
                          {getInitial(
                            account.full_name
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="truncate text-xl font-black">
                              {account.full_name}
                            </h3>

                            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-300">
                              أدمن
                            </span>

                            {isOwnerAccount && (
                              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300">
                                مالك المنصة
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:gap-5">
                            <span className="flex items-center gap-2">
                              <Mail size={15} />

                              {account.email ||
                                "لا يوجد بريد"}
                            </span>

                            <span className="flex items-center gap-2">
                              <CalendarDays
                                size={15}
                              />

                              انضم في{" "}
                              {formatDate(
                                account.joined_at
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isOwnerAccount ? (
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-5 py-3 text-sm font-bold text-amber-300">
                          حساب المالك محمي
                        </div>
                      ) : (
                        <form
                          action={demoteAdmin}
                        >
                          <input
                            type="hidden"
                            name="userId"
                            value={
                              account.user_id
                            }
                          />

                          <SubmitButton
                            actionType="demote"
                          />
                        </form>
                      )}
                    </div>
                  </GlassCard>
                );
              })
            ) : (
              <GlassCard
                hover={false}
                className="px-6 py-12 text-center text-zinc-400"
              >
                لا توجد حسابات أدمن مطابقة
                للبحث.
              </GlassCard>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold text-blue-400">
            إضافة أدمن
          </p>

          <h2 className="mt-2 text-3xl font-black">
            الحسابات المتاحة
          </h2>

          <p className="mt-3 text-zinc-500">
            يجب أن يمتلك الشخص حسابًا مسجلًا
            في الموقع قبل منحه صلاحية الأدمن.
          </p>

          <div className="mt-7 space-y-4">
            {studentAccounts.length > 0 ? (
              studentAccounts.map(
                (account) => (
                  <GlassCard
                    key={account.user_id}
                    hover={false}
                    className="p-6"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl font-black">
                          {getInitial(
                            account.full_name
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-xl font-black">
                            {account.full_name}
                          </h3>

                          <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:gap-5">
                            <span className="flex items-center gap-2">
                              <Mail size={15} />

                              {account.email ||
                                "لا يوجد بريد"}
                            </span>

                            <span className="flex items-center gap-2">
                              <CalendarDays
                                size={15}
                              />

                              انضم في{" "}
                              {formatDate(
                                account.joined_at
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <form
                        action={promoteToAdmin}
                      >
                        <input
                          type="hidden"
                          name="userId"
                          value={
                            account.user_id
                          }
                        />

                        <SubmitButton
                          actionType="promote"
                        />
                      </form>
                    </div>
                  </GlassCard>
                )
              )
            ) : (
              <GlassCard
                hover={false}
                className="px-6 py-12 text-center text-zinc-400"
              >
                لا توجد حسابات متاحة مطابقة
                للبحث.
              </GlassCard>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
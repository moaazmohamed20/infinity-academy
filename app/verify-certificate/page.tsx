import Link from "next/link";
import {
  AlertCircle,
  Award,
  BadgeCheck,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Fingerprint,
  GraduationCap,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import GlassCard from "../../components/ui/GlassCard";
import { createClient } from "../../lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    code?: string | string[];
  }>;
};

type CertificateRecord = {
  certificate_number: string;
  verification_code: string;
  student_name: string;
  course_title: string;
  instructor_name: string;
  course_category: string;
  completion_date: string;
  course_duration: string;
  lessons_count: number;
  course_slug: string;
};

function getSearchValue(
  value: string | string[] | undefined
) {
  if (Array.isArray(value)) {
    return value[0]?.trim() ?? "";
  }

  return value?.trim() ?? "";
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function VerifyCertificatePage({
  searchParams,
}: PageProps) {
  const params = await searchParams;

  const searchCode = getSearchValue(
    params.code
  ).toUpperCase();

  let certificate: CertificateRecord | null =
    null;

  let hasSearchError = false;

  if (searchCode) {
    const supabase = await createClient();

    const { data, error } =
      await supabase.rpc(
        "verify_certificate",
        {
          search_code: searchCode,
        }
      );

    if (error) {
      console.error(
        "تعذر التحقق من الشهادة:",
        error
      );

      hasSearchError = true;
    } else if (
      Array.isArray(data) &&
      data.length > 0
    ) {
      const row = data[0] as Record<
        string,
        unknown
      >;

      certificate = {
        certificate_number: String(
          row.certificate_number ?? ""
        ),

        verification_code: String(
          row.verification_code ?? ""
        ),

        student_name: String(
          row.student_name ?? ""
        ),

        course_title: String(
          row.course_title ?? ""
        ),

        instructor_name: String(
          row.instructor_name ?? ""
        ),

        course_category: String(
          row.course_category ?? ""
        ),

        completion_date: String(
          row.completion_date ?? ""
        ),

        course_duration: String(
          row.course_duration ?? ""
        ),

        lessons_count: Number(
          row.lessons_count ?? 0
        ),

        course_slug: String(
          row.course_slug ?? ""
        ),
      };
    }
  }

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-16">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-5xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
            <ShieldCheck size={32} />
          </div>

          <p className="mt-6 text-sm font-bold text-purple-400">
            خدمة التحقق من الشهادات
          </p>

          <h1 className="mt-3 text-3xl font-black md:text-5xl">
            التحقق من صحة الشهادة
          </h1>

          <p className="mx-auto mt-4 max-w-2xl leading-8 text-zinc-400">
            أدخل رقم الشهادة أو رمز التحقق
            الموجود أسفل الشهادة للتأكد من
            اعتمادها داخل Infinity Academy.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-4xl">
          <GlassCard
            hover={false}
            className="p-6 md:p-8"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Search size={23} />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  ابحث عن الشهادة
                </h2>

                <p className="mt-1 text-sm leading-7 text-zinc-400">
                  يمكنك استخدام أي من الرقمين
                  المكتوبين أسفل الشهادة.
                </p>
              </div>
            </div>

            <form
              action="/verify-certificate"
              method="get"
              className="mt-7"
            >
              <label
                htmlFor="certificate-code"
                className="mb-3 block text-sm font-bold text-zinc-300"
              >
                رقم الشهادة أو رمز التحقق
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-1 items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500">
                  <Fingerprint
                    size={20}
                    className="shrink-0 text-zinc-500"
                  />

                  <input
                    id="certificate-code"
                    name="code"
                    type="text"
                    required
                    defaultValue={searchCode}
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="مثال: IA-6690059B06F2"
                    className="w-full bg-transparent px-4 py-4 text-left font-mono uppercase text-white outline-none placeholder:text-zinc-600"
                    dir="ltr"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black text-white shadow-lg shadow-purple-950/30 transition hover:brightness-110"
                >
                  <Search size={19} />
                  تحقق الآن
                </button>
              </div>
            </form>
          </GlassCard>

          {hasSearchError && (
            <GlassCard
              hover={false}
              className="mt-8 border-red-500/20 bg-red-500/[0.05] px-6 py-12 text-center"
            >
              <AlertCircle
                size={46}
                className="mx-auto text-red-400"
              />

              <h2 className="mt-5 text-2xl font-black text-red-300">
                تعذر التحقق من الشهادة
              </h2>

              <p className="mt-3 leading-7 text-zinc-400">
                حدث خطأ أثناء الاتصال بقاعدة
                البيانات. حاول مرة أخرى.
              </p>
            </GlassCard>
          )}

          {searchCode &&
            !hasSearchError &&
            !certificate && (
              <GlassCard
                hover={false}
                className="mt-8 border-red-500/20 bg-red-500/[0.05] px-6 py-12 text-center"
              >
                <AlertCircle
                  size={46}
                  className="mx-auto text-red-400"
                />

                <h2 className="mt-5 text-2xl font-black">
                  الشهادة غير موجودة
                </h2>

                <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-400">
                  لم نعثر على شهادة مكتملة بهذا
                  الرقم. راجع الأحرف والأرقام ثم
                  أعد المحاولة.
                </p>

                <div
                  dir="ltr"
                  className="mx-auto mt-6 w-fit rounded-xl border border-red-500/20 bg-black/20 px-5 py-3 font-mono text-sm text-red-300"
                >
                  {searchCode}
                </div>
              </GlassCard>
            )}

          {certificate && (
            <div className="mt-8 space-y-6">
              <GlassCard
                hover={false}
                className="overflow-hidden border-emerald-500/30 p-0"
              >
                <div className="border-b border-emerald-500/20 bg-emerald-500/10 px-6 py-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                        <CheckCircle2
                          size={25}
                        />
                      </div>

                      <div>
                        <p className="text-sm font-bold text-emerald-300">
                          نتيجة التحقق
                        </p>

                        <h2 className="mt-1 text-2xl font-black">
                          شهادة صحيحة ومعتمدة
                        </h2>
                      </div>
                    </div>

                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
                      <BadgeCheck size={17} />
                      تم التحقق
                    </span>
                  </div>
                </div>

                <div className="p-6 md:p-8">
                  <div className="flex flex-col items-center border-b border-white/10 pb-8 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
                      <Award size={38} />
                    </div>

                    <p className="mt-6 text-sm font-bold text-purple-400">
                      شهادة إتمام كورس
                    </p>

                    <h3 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
                      {
                        certificate.course_title
                      }
                    </h3>

                    <span className="mt-4 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-300">
                      {
                        certificate.course_category
                      }
                    </span>
                  </div>

                  <div className="mt-8 grid gap-5 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-center gap-3 text-zinc-500">
                        <UserRound size={18} />
                        <span className="text-sm">
                          اسم الطالب
                        </span>
                      </div>

                      <p className="mt-3 text-xl font-black">
                        {
                          certificate.student_name
                        }
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-center gap-3 text-zinc-500">
                        <GraduationCap
                          size={18}
                        />

                        <span className="text-sm">
                          مقدم الكورس
                        </span>
                      </div>

                      <p className="mt-3 text-xl font-black">
                        {
                          certificate.instructor_name
                        }
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-center gap-3 text-zinc-500">
                        <CalendarDays
                          size={18}
                        />

                        <span className="text-sm">
                          تاريخ الإتمام
                        </span>
                      </div>

                      <p className="mt-3 font-black">
                        {formatDate(
                          certificate.completion_date
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-center gap-3 text-zinc-500">
                        <BookOpen size={18} />

                        <span className="text-sm">
                          عدد الدروس
                        </span>
                      </div>

                      <p className="mt-3 font-black">
                        {
                          certificate.lessons_count
                        }{" "}
                        درس
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-center gap-3 text-zinc-500">
                        <Clock3 size={18} />

                        <span className="text-sm">
                          مدة الكورس
                        </span>
                      </div>

                      <p className="mt-3 font-black">
                        {
                          certificate.course_duration
                        }
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="flex items-center gap-3 text-zinc-500">
                        <ShieldCheck
                          size={18}
                        />

                        <span className="text-sm">
                          حالة الشهادة
                        </span>
                      </div>

                      <p className="mt-3 font-black text-emerald-400">
                        معتمدة من Infinity
                        Academy
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.05] p-5">
                      <p className="text-sm text-zinc-500">
                        رقم الشهادة
                      </p>

                      <p
                        dir="ltr"
                        className="mt-3 break-all text-left font-mono font-bold text-purple-300"
                      >
                        {
                          certificate.certificate_number
                        }
                      </p>
                    </div>

                    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.05] p-5">
                      <p className="text-sm text-zinc-500">
                        رمز التحقق
                      </p>

                      <p
                        dir="ltr"
                        className="mt-3 break-all text-left font-mono font-bold text-blue-300"
                      >
                        {
                          certificate.verification_code
                        }
                      </p>
                    </div>
                  </div>

                  {certificate.course_slug && (
                    <Link
                      href={`/courses/${certificate.course_slug}`}
                      className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-black transition hover:brightness-110"
                    >
                      <BookOpen size={19} />
                      عرض صفحة الكورس
                    </Link>
                  )}
                </div>
              </GlassCard>
            </div>
          )}

          {!searchCode && (
            <GlassCard
              hover={false}
              className="mt-8 px-6 py-12 text-center"
            >
              <Fingerprint
                size={48}
                className="mx-auto text-purple-400"
              />

              <h2 className="mt-5 text-2xl font-black">
                أين يوجد رمز التحقق؟
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-8 text-zinc-400">
                ستجد رقم الشهادة ورمز التحقق
                مكتوبين في الجزء السفلي من شهادة
                الإتمام.
              </p>

              <Link
                href="/courses"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-4 font-bold transition hover:border-purple-500/40 hover:bg-purple-500/10"
              >
                <BookOpen size={18} />
                استكشف الكورسات
              </Link>
            </GlassCard>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
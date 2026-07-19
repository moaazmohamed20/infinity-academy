import Link from "next/link";
import {
  Award,
  BookOpen,
  CalendarDays,
  Clock3,
  Fingerprint,
  GraduationCap,
  Printer,
  QrCode,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  notFound,
  redirect,
} from "next/navigation";

import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import CertificateQRCode from "../../../components/certificates/CertificateQRCode";
import GlassCard from "../../../components/ui/GlassCard";
import { createClient } from "../../../lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type EnrollmentRow = {
  id: unknown;
  user_id: unknown;
  course_id: unknown;
  status: unknown;
  progress: unknown;
  enrolled_at: unknown;
  completed_at: unknown;
};

type CourseRow = {
  id: unknown;
  slug: unknown;
  title: unknown;
  instructor: unknown;
  category: unknown;
  description: unknown;
  duration: unknown;
  lessons_count: unknown;
};

type ProfileRow = {
  full_name: unknown;
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat(
    "ar-EG",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function getCertificateNumber(
  enrollmentId: string
) {
  return `IA-${enrollmentId
    .replaceAll("-", "")
    .slice(0, 12)
    .toUpperCase()}`;
}

function getVerificationCode(
  enrollmentId: string,
  userId: string
) {
  const enrollmentPart =
    enrollmentId
      .replaceAll("-", "")
      .slice(-8);

  const userPart = userId
    .replaceAll("-", "")
    .slice(0, 8);

  return `${enrollmentPart}-${userPart}`.toUpperCase();
}

export default async function CertificateDetailsPage({
  params,
}: PageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

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

  const email =
    typeof claims.email === "string"
      ? claims.email
      : "";

  if (!userId) {
    redirect("/login");
  }

  const {
    data: enrollmentData,
    error: enrollmentError,
  } = await supabase
    .from("enrollments")
    .select(
      `
        id,
        user_id,
        course_id,
        status,
        progress,
        enrolled_at,
        completed_at
      `
    )
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "completed")
    .maybeSingle();

  if (
    enrollmentError ||
    !enrollmentData
  ) {
    notFound();
  }

  const enrollment =
    enrollmentData as EnrollmentRow;

  const enrollmentId = String(
    enrollment.id
  );

  const courseId = String(
    enrollment.course_id
  );

  const completedAt = String(
    enrollment.completed_at ||
      enrollment.enrolled_at
  );

  const [
    courseResult,
    profileResult,
  ] = await Promise.all([
    supabase
      .from("courses")
      .select(
        `
          id,
          slug,
          title,
          instructor,
          category,
          description,
          duration,
          lessons_count
        `
      )
      .eq("id", courseId)
      .maybeSingle(),

    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  if (
    courseResult.error ||
    !courseResult.data
  ) {
    notFound();
  }

  const course =
    courseResult.data as CourseRow;

  const profile =
    profileResult.data as
      | ProfileRow
      | null;

  const userMetadata =
    typeof claims.user_metadata ===
      "object" &&
    claims.user_metadata !== null
      ? (claims.user_metadata as Record<
          string,
          unknown
        >)
      : {};

  const profileName =
    typeof profile?.full_name ===
      "string"
      ? profile.full_name.trim()
      : "";

  const metadataName =
    typeof userMetadata.full_name ===
      "string"
      ? userMetadata.full_name.trim()
      : "";

  const studentName =
    profileName ||
    metadataName ||
    (email
      ? email.split("@")[0]
      : "طالب Infinity Academy");

  const courseTitle = String(
    course.title
  );

  const instructor = String(
    course.instructor
  );

  const category = String(
    course.category
  );

  const description =
    typeof course.description ===
      "string"
      ? course.description
      : "";

  const slug = String(course.slug);

  const duration = String(
    course.duration
  );

  const lessonsCount = Number(
    course.lessons_count
  );

  const certificateNumber =
    getCertificateNumber(
      enrollmentId
    );

  const verificationCode =
    getVerificationCode(
      enrollmentId,
      userId
    );

  return (
    <main className="min-h-screen bg-[#09090B] text-white print:min-h-0 print:bg-white">
      <div className="print:hidden">
        <Navbar />
      </div>

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-14 print:hidden">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/certificates"
            className="text-sm font-bold text-zinc-400 transition hover:text-purple-400"
          >
            العودة إلى شهاداتي
          </Link>

          <div className="mt-7 flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
              <Award size={32} />
            </div>

            <div>
              <p className="text-sm font-bold text-purple-400">
                شهادة إتمام معتمدة
              </p>

              <h1 className="mt-2 text-3xl font-black md:text-5xl">
                {courseTitle}
              </h1>

              <p className="mt-3 text-zinc-400">
                شهادة خاصة بالطالب{" "}
                {studentName}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12 print:m-0 print:p-0">
        <div className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[1fr_300px] print:block print:max-w-none">
          <div
            id="certificate"
            className="relative min-h-[700px] overflow-hidden rounded-[32px] border border-purple-500/30 bg-[#111114] shadow-2xl shadow-purple-950/30 print:mx-auto print:h-[240mm] print:min-h-0 print:w-[190mm] print:break-inside-avoid print:overflow-hidden print:rounded-none print:border-4 print:border-black print:bg-white print:text-black print:shadow-none print:[zoom:0.88]"
          >
            <div className="absolute inset-0 opacity-30 print:opacity-10">
              <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-purple-600/30 blur-[120px]" />

              <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px]" />
            </div>

            <div className="absolute inset-5 rounded-[25px] border border-purple-400/20 print:border-black/30" />

            <div className="absolute right-10 top-10 text-purple-400/20 print:text-black/10">
              <Sparkles size={90} />
            </div>

            <div className="absolute bottom-10 left-10 text-purple-400/20 print:text-black/10">
              <GraduationCap size={100} />
            </div>

            <div className="relative flex min-h-[700px] flex-col items-center justify-center px-8 py-16 text-center print:h-[240mm] print:min-h-0 print:px-8 print:py-7">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-purple-400/30 bg-purple-500/10 text-purple-300 print:border-black print:bg-transparent print:text-black">
                <Award size={48} />
              </div>

              <p className="mt-7 text-sm font-black tracking-[0.35em] text-purple-400 print:text-black">
                INFINITY ACADEMY
              </p>

              <h2 className="mt-4 text-4xl font-black md:text-6xl">
                شهادة إتمام
              </h2>

              <p className="mt-5 text-lg leading-8 text-zinc-400 print:text-zinc-700">
                تشهد منصة Infinity Academy
                بأن الطالب
              </p>

              <h3 className="mt-4 bg-gradient-to-l from-purple-300 via-white to-blue-300 bg-clip-text text-4xl font-black text-transparent md:text-6xl print:bg-none print:text-black">
                {studentName}
              </h3>

              <p className="mt-5 max-w-3xl text-lg leading-9 text-zinc-400 print:text-zinc-700">
                قد أتم بنجاح جميع متطلبات
                الكورس التدريبي
              </p>

              <h4 className="mt-3 max-w-4xl text-3xl font-black leading-tight md:text-5xl">
                {courseTitle}
              </h4>

              <p className="mt-4 rounded-full border border-purple-500/30 bg-purple-500/10 px-5 py-2 font-bold text-purple-300 print:border-black print:bg-transparent print:text-black">
                {category}
              </p>

              <div className="mt-8 grid w-full max-w-4xl gap-5 border-y border-white/10 py-5 sm:grid-cols-3 print:border-black/30">
                <div>
                  <p className="text-sm text-zinc-500 print:text-zinc-600">
                    تاريخ الإتمام
                  </p>

                  <p className="mt-2 font-black">
                    {formatDate(
                      completedAt
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500 print:text-zinc-600">
                    عدد الدروس
                  </p>

                  <p className="mt-2 font-black">
                    {lessonsCount} درس
                  </p>
                </div>

                <div>
                  <p className="text-sm text-zinc-500 print:text-zinc-600">
                    مدة الكورس
                  </p>

                  <p className="mt-2 font-black">
                    {duration}
                  </p>
                </div>
              </div>

              <div className="mt-7 flex w-full max-w-4xl flex-col gap-7 sm:flex-row sm:items-end sm:justify-between print:flex-row">
                <div className="text-center">
                  <div className="mx-auto h-px w-44 bg-white/20 print:bg-black" />

                  <p className="mt-3 font-black">
                    {instructor}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    مقدم الكورس
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <CertificateQRCode
                    verificationCode={
                      verificationCode
                    }
                    size={72}
                    showLabel={false}
                    className="print:scale-90"
                  />

                  <p className="mt-2 font-black">
                    امسح للتحقق
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    شهادة معتمدة
                  </p>
                </div>

                <div className="text-center">
                  <div className="mx-auto h-px w-44 bg-white/20 print:bg-black" />

                  <p className="mt-3 font-black">
                    إدارة المنصة
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    التوقيع المعتمد
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-xs text-zinc-500 print:text-zinc-700">
                <span className="flex items-center gap-2">
                  <Fingerprint size={15} />
                  رقم الشهادة:{" "}
                  {certificateNumber}
                </span>

                <span className="flex items-center gap-2">
                  <ShieldCheck size={15} />
                  رمز التحقق:{" "}
                  {verificationCode}
                </span>
              </div>
            </div>
          </div>

          <aside className="space-y-6 print:hidden">
            <GlassCard
              hover={false}
              className="p-6"
            >
              <h2 className="text-xl font-black">
                بيانات الشهادة
              </h2>

              <div className="mt-6 space-y-5 text-sm">
                <div className="flex items-start gap-3">
                  <CalendarDays
                    size={18}
                    className="mt-1 shrink-0 text-purple-400"
                  />

                  <div>
                    <p className="text-zinc-500">
                      تاريخ الإصدار
                    </p>

                    <p className="mt-1 font-bold">
                      {formatDate(
                        completedAt
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BookOpen
                    size={18}
                    className="mt-1 shrink-0 text-purple-400"
                  />

                  <div>
                    <p className="text-zinc-500">
                      عدد الدروس
                    </p>

                    <p className="mt-1 font-bold">
                      {lessonsCount} درس
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock3
                    size={18}
                    className="mt-1 shrink-0 text-purple-400"
                  />

                  <div>
                    <p className="text-zinc-500">
                      مدة المحتوى
                    </p>

                    <p className="mt-1 font-bold">
                      {duration}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <ShieldCheck
                    size={18}
                    className="mt-1 shrink-0 text-emerald-400"
                  />

                  <div>
                    <p className="text-zinc-500">
                      حالة الشهادة
                    </p>

                    <p className="mt-1 font-bold text-emerald-400">
                      معتمدة
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <QrCode size={21} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                التحقق السريع
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                امسح رمز QR بكاميرا الهاتف
                لفتح صفحة التحقق مباشرة.
              </p>

              <CertificateQRCode
                verificationCode={
                  verificationCode
                }
                size={150}
                className="mt-6"
              />
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Printer size={21} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                طباعة الشهادة
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                اضغط من لوحة المفاتيح على:
              </p>

              <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-center text-xl font-black text-purple-300">
                Ctrl + P
              </div>

              <p className="mt-3 text-xs leading-6 text-zinc-600">
                ثم اختر الطباعة أو الحفظ بصيغة
                PDF من نافذة المتصفح.
              </p>
            </GlassCard>

            <Link
              href={`/courses/${slug}`}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-4 font-black transition hover:border-purple-500/40 hover:bg-purple-500/10"
            >
              <BookOpen size={18} />
              عرض صفحة الكورس
            </Link>

            <Link
              href="/certificates"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-black transition hover:brightness-110"
            >
              <Award size={18} />
              العودة إلى شهاداتي
            </Link>
          </aside>
        </div>

        {description && (
          <GlassCard
            hover={false}
            className="mx-auto mt-8 max-w-7xl p-7 print:hidden"
          >
            <h2 className="text-xl font-black">
              عن الكورس
            </h2>

            <p className="mt-4 leading-8 text-zinc-400">
              {description}
            </p>
          </GlassCard>
        )}
      </section>

      <div className="print:hidden">
        <Footer />
      </div>
    </main>
  );
}
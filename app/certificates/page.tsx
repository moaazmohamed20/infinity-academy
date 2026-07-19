import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  BookOpen,
  CalendarDays,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Trophy,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import { createClient } from "../../lib/supabase/server";

type EnrollmentRow = {
  id: unknown;
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
  image: unknown;
  duration: unknown;
  lessons_count: unknown;
};

type CompletedCourse = {
  enrollmentId: string;
  courseId: string;
  slug: string;
  title: string;
  instructor: string;
  category: string;
  image: string;
  duration: string;
  lessonsCount: number;
  completedAt: string;
  certificateNumber: string;
};

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

function getDurationHours(duration: string) {
  const hours = Number.parseInt(duration, 10);

  return Number.isNaN(hours) ? 0 : hours;
}

function getCertificateNumber(
  enrollmentId: string
) {
  return `IA-${enrollmentId
    .replaceAll("-", "")
    .slice(0, 10)
    .toUpperCase()}`;
}

export default async function CertificatesPage() {
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

  const email =
    typeof claims.email === "string"
      ? claims.email
      : "";

  const userMetadata =
    typeof claims.user_metadata ===
      "object" &&
    claims.user_metadata !== null
      ? (claims.user_metadata as Record<
          string,
          unknown
        >)
      : {};

  const metadataName =
    typeof userMetadata.full_name ===
      "string"
      ? userMetadata.full_name.trim()
      : "";

  const [
    profileResult,
    enrollmentsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .maybeSingle(),

    supabase
      .from("enrollments")
      .select(
        `
          id,
          course_id,
          status,
          progress,
          enrolled_at,
          completed_at
        `
      )
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", {
        ascending: false,
      }),
  ]);

  const profileName =
    typeof profileResult.data?.full_name ===
      "string"
      ? profileResult.data.full_name.trim()
      : "";

  const displayName =
    profileName ||
    metadataName ||
    (email
      ? email.split("@")[0]
      : "طالب Infinity Academy");

  const enrollmentRows =
    (enrollmentsResult.data ??
      []) as EnrollmentRow[];

  const completedEnrollments =
    enrollmentsResult.error
      ? []
      : enrollmentRows.map(
          (enrollment) => ({
            id: String(enrollment.id),
            courseId: String(
              enrollment.course_id
            ),

            completedAt: String(
              enrollment.completed_at ||
                enrollment.enrolled_at
            ),
          })
        );

  const courseIds =
    completedEnrollments.map(
      (enrollment) =>
        enrollment.courseId
    );

  let courseRows: CourseRow[] = [];
  let coursesError = false;

  if (courseIds.length > 0) {
    const result = await supabase
      .from("courses")
      .select(
        `
          id,
          slug,
          title,
          instructor,
          category,
          image,
          duration,
          lessons_count
        `
      )
      .in("id", courseIds);

    if (result.error) {
      coursesError = true;
    } else {
      courseRows =
        (result.data ??
          []) as CourseRow[];
    }
  }

  const courseMap = new Map(
    courseRows.map((course) => [
      String(course.id),
      course,
    ])
  );

  const completedCourses: CompletedCourse[] =
    completedEnrollments.flatMap(
      (enrollment) => {
        const course = courseMap.get(
          enrollment.courseId
        );

        if (!course) {
          return [];
        }

        return [
          {
            enrollmentId:
              enrollment.id,

            courseId:
              enrollment.courseId,

            slug: String(
              course.slug
            ),

            title: String(
              course.title
            ),

            instructor: String(
              course.instructor
            ),

            category: String(
              course.category
            ),

            image: String(
              course.image
            ),

            duration: String(
              course.duration
            ),

            lessonsCount: Number(
              course.lessons_count
            ),

            completedAt:
              enrollment.completedAt,

            certificateNumber:
              getCertificateNumber(
                enrollment.id
              ),
          },
        ];
      }
    );

  const totalLessons =
    completedCourses.reduce(
      (total, course) =>
        total + course.lessonsCount,
      0
    );

  const totalHours =
    completedCourses.reduce(
      (total, course) =>
        total +
        getDurationHours(
          course.duration
        ),
      0
    );

  const hasError =
    Boolean(enrollmentsResult.error) ||
    coursesError;

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-16">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
              <Award size={32} />
            </div>

            <div>
              <p className="text-sm font-bold text-purple-400">
                إنجازاتك التعليمية
              </p>

              <h1 className="mt-2 text-3xl font-black md:text-5xl">
                شهاداتي
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                شهادات إتمام الكورسات الخاصة
                بالطالب {displayName}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-3">
            <GlassCard
              hover={false}
              className="p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-400">
                    الشهادات المكتسبة
                  </p>

                  <p className="mt-3 text-4xl font-black">
                    {
                      completedCourses.length
                    }
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    شهادة إتمام
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <Trophy size={23} />
                </div>
              </div>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-400">
                    الدروس المكتملة
                  </p>

                  <p className="mt-3 text-4xl font-black">
                    {totalLessons}
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    درس داخل الكورسات
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                  <BookOpen size={23} />
                </div>
              </div>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-400">
                    ساعات التعلم
                  </p>

                  <p className="mt-3 text-4xl font-black">
                    {totalHours}
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    ساعة تعليمية
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Clock3 size={23} />
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div>
            <p className="text-sm font-bold text-purple-400">
              شهادات الإتمام
            </p>

            <h2 className="mt-2 text-3xl font-black">
              الشهادات المتاحة
            </h2>

            <p className="mt-3 text-zinc-400">
              تظهر الشهادة تلقائيًا بعد إكمال
              جميع دروس الكورس.
            </p>
          </div>

          {hasError ? (
            <GlassCard
              hover={false}
              className="mt-8 border-red-500/20 bg-red-500/[0.05] px-6 py-16 text-center"
            >
              <h3 className="text-2xl font-black text-red-300">
                تعذر تحميل الشهادات
              </h3>

              <p className="mt-3 text-zinc-400">
                حدث خطأ أثناء قراءة بيانات
                الكورسات المكتملة.
              </p>
            </GlassCard>
          ) : completedCourses.length >
            0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {completedCourses.map(
                (course) => (
                  <GlassCard
                    key={
                      course.enrollmentId
                    }
                    as="article"
                    className="group overflow-hidden p-0"
                  >
                    <div className="relative h-52 overflow-hidden">
                      <Image
                        src={course.image}
                        alt={course.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                      <span className="absolute right-4 top-4 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 backdrop-blur-xl">
                        مكتمل
                      </span>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                          <GraduationCap
                            size={22}
                          />
                        </div>

                        <div>
                          <p className="text-xs font-bold text-purple-400">
                            شهادة إتمام
                          </p>

                          <p className="mt-1 text-xs text-zinc-600">
                            {
                              course.certificateNumber
                            }
                          </p>
                        </div>
                      </div>

                      <h3 className="mt-5 min-h-14 text-xl font-black leading-7">
                        {course.title}
                      </h3>

                      <p className="mt-2 text-sm text-zinc-500">
                        {course.instructor}
                      </p>

                      <div className="mt-5 space-y-3 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-zinc-500">
                            تاريخ الإتمام
                          </span>

                          <span className="flex items-center gap-2 font-bold text-zinc-300">
                            <CalendarDays
                              size={15}
                            />

                            {formatDate(
                              course.completedAt
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <span className="text-zinc-500">
                            حالة الشهادة
                          </span>

                          <span className="flex items-center gap-2 font-bold text-emerald-400">
                            <ShieldCheck
                              size={15}
                            />

                            معتمدة
                          </span>
                        </div>
                      </div>

                      <Button
                        href={`/certificates/${course.enrollmentId}`}
                        className="mt-6 w-full"
                      >
                        <Award size={18} />
                        عرض الشهادة
                      </Button>
                    </div>
                  </GlassCard>
                )
              )}
            </div>
          ) : (
            <GlassCard
              hover={false}
              className="mt-8 px-6 py-16 text-center"
            >
              <Award
                size={50}
                className="mx-auto text-purple-400"
              />

              <h3 className="mt-5 text-2xl font-black">
                لا توجد شهادات حتى الآن
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-400">
                أكمل جميع دروس أحد الكورسات
                للحصول على شهادة الإتمام.
              </p>

              <Link
                href="/courses"
                className="mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black transition hover:brightness-110"
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
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  PlayCircle,
  Star,
  Trophy,
  UserRound,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import { createClient } from "../../lib/supabase/server";

type EnrollmentRecord = {
  course_id: string;
  progress: number;
  status: "active" | "completed";
  enrolled_at: string;
  completed_at: string | null;
};

type CourseRecord = {
  id: string;
  slug: string;
  title: string;
  instructor: string;
  category: string;
  image: string;
  rating: number;
  duration: string;
  lessons_count: number;
};

type EnrolledCourse = CourseRecord &
  EnrollmentRecord & {
    completedLessons: number;
    lastLesson: string;
  };

type LessonRecord = {
  id: string;
  course_id: string;
};

type LessonProgressRecord = {
  lesson_id: string;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

function calculateProgress(
  completedLessons: number,
  totalLessons: number
) {
  if (
    completedLessons <= 0 ||
    totalLessons <= 0
  ) {
    return 0;
  }

  if (completedLessons >= totalLessons) {
    return 100;
  }

  return Math.max(
    1,
    Math.round(
      (completedLessons / totalLessons) *
        100
    )
  );
}

export default async function DashboardPage() {
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

  const email =
    typeof claims.email === "string"
      ? claims.email
      : "";

  const [
    { data: profile },
    {
      data: enrollmentData,
      error: enrollmentError,
    },
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
          course_id,
          progress,
          status,
          enrolled_at,
          completed_at
        `
      )
      .eq("user_id", userId)
      .order("enrolled_at", {
        ascending: false,
      }),
  ]);

  const profileName =
    typeof profile?.full_name ===
      "string"
      ? profile.full_name.trim()
      : "";

  const displayName =
    profileName ||
    metadataName ||
    (email
      ? email.split("@")[0]
      : "طالب Infinity Academy");

  const enrollments: EnrollmentRecord[] =
    enrollmentError
      ? []
      : (enrollmentData ?? []).map(
          (enrollment) => ({
            course_id: String(
              enrollment.course_id
            ),

            progress: Number(
              enrollment.progress
            ),

            status:
              enrollment.status ===
              "completed"
                ? "completed"
                : "active",

            enrolled_at: String(
              enrollment.enrolled_at
            ),

            completed_at:
              enrollment.completed_at
                ? String(
                    enrollment.completed_at
                  )
                : null,
          })
        );

  const courseIds = Array.from(
    new Set(
      enrollments.map(
        (enrollment) =>
          enrollment.course_id
      )
    )
  );

  let courseRecords: CourseRecord[] = [];
  let lessonRecords: LessonRecord[] = [];

  let coursesError = Boolean(
    enrollmentError
  );

  if (courseIds.length > 0) {
    const [
      {
        data: coursesData,
        error: courseError,
      },
      {
        data: lessonsData,
        error: lessonsError,
      },
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
            image,
            rating,
            duration,
            lessons_count
          `
        )
        .in("id", courseIds),

      supabase
        .from("lessons")
        .select(
          `
            id,
            course_id
          `
        )
        .in("course_id", courseIds)
        .eq("is_published", true),
    ]);

    if (courseError || lessonsError) {
      coursesError = true;
    } else {
      courseRecords = (
        coursesData ?? []
      ).map((course) => ({
        id: String(course.id),
        slug: String(course.slug),
        title: String(course.title),

        instructor: String(
          course.instructor
        ),

        category: String(
          course.category
        ),

        image: String(course.image),
        rating: Number(course.rating),

        duration: String(
          course.duration
        ),

        lessons_count: Number(
          course.lessons_count
        ),
      }));

      lessonRecords = (
        lessonsData ?? []
      ).map((lesson) => ({
        id: String(lesson.id),

        course_id: String(
          lesson.course_id
        ),
      }));
    }
  }

  const lessonIds = lessonRecords.map(
    (lesson) => lesson.id
  );

  let lessonProgressRecords: LessonProgressRecord[] =
    [];

  if (
    lessonIds.length > 0 &&
    !coursesError
  ) {
    const {
      data: lessonProgressData,
      error: lessonProgressError,
    } = await supabase
      .from("lesson_progress")
      .select("lesson_id")
      .eq("user_id", userId)
      .eq("completed", true)
      .in("lesson_id", lessonIds);

    if (lessonProgressError) {
      coursesError = true;
    } else {
      lessonProgressRecords = (
        lessonProgressData ?? []
      ).map((progress) => ({
        lesson_id: String(
          progress.lesson_id
        ),
      }));
    }
  }

  const courseMap = new Map(
    courseRecords.map((course) => [
      course.id,
      course,
    ])
  );

  const lessonToCourseMap = new Map(
    lessonRecords.map((lesson) => [
      lesson.id,
      lesson.course_id,
    ])
  );

  const lessonsCountMap = new Map<
    string,
    number
  >();

  lessonRecords.forEach((lesson) => {
    const currentCount =
      lessonsCountMap.get(
        lesson.course_id
      ) ?? 0;

    lessonsCountMap.set(
      lesson.course_id,
      currentCount + 1
    );
  });

  const completedLessonsCountMap =
    new Map<string, number>();

  lessonProgressRecords.forEach(
    (progress) => {
      const courseId =
        lessonToCourseMap.get(
          progress.lesson_id
        );

      if (!courseId) {
        return;
      }

      const currentCount =
        completedLessonsCountMap.get(
          courseId
        ) ?? 0;

      completedLessonsCountMap.set(
        courseId,
        currentCount + 1
      );
    }
  );

  const enrolledCourses: EnrolledCourse[] =
    enrollments.flatMap((enrollment) => {
      const course = courseMap.get(
        enrollment.course_id
      );

      if (!course) {
        return [];
      }

      const totalLessons =
        lessonsCountMap.get(course.id) ??
        course.lessons_count;

      const completedLessons =
        completedLessonsCountMap.get(
          course.id
        ) ?? 0;

      const exactProgress =
        calculateProgress(
          completedLessons,
          totalLessons
        );

      const exactStatus:
        | "active"
        | "completed" =
        totalLessons > 0 &&
        completedLessons >= totalLessons
          ? "completed"
          : enrollment.status;

      return [
        {
          ...course,
          ...enrollment,

          lessons_count: totalLessons,
          completedLessons,

          progress: exactProgress,
          status: exactStatus,

          lastLesson:
            completedLessons === 0
              ? "ابدأ أول درس في الكورس"
              : exactStatus ===
                  "completed"
                ? "تم إكمال الكورس"
                : `أكملت ${completedLessons} من ${totalLessons} درس`,
        },
      ];
    });

  const activeCourses =
    enrolledCourses.filter(
      (course) =>
        course.status === "active"
    ).length;

  const completedCourses =
    enrolledCourses.filter(
      (course) =>
        course.status === "completed"
    ).length;

  const completedLessons =
    enrolledCourses.reduce(
      (total, course) =>
        total +
        course.completedLessons,
      0
    );

  const averageProgress =
    enrolledCourses.length > 0
      ? Math.round(
          enrolledCourses.reduce(
            (total, course) =>
              total + course.progress,
            0
          ) / enrolledCourses.length
        )
      : 0;

  const stats = [
    {
      title: "الكورسات النشطة",
      value: activeCourses.toString(),
      description: "كورسات قيد التعلم",
      icon: BookOpen,
    },
    {
      title: "الدروس المنجزة",
      value: completedLessons.toString(),
      description: "درس تم إنجازه",
      icon: CheckCircle2,
    },
    {
      title: "متوسط التقدم",
      value: `${averageProgress}%`,
      description: "في جميع الكورسات",
      icon: Clock3,
    },
    {
      title: "الكورسات المكتملة",
      value: completedCourses.toString(),
      description: "كورس مكتمل",
      icon: Trophy,
    },
  ];

  const activities = enrolledCourses
    .slice(0, 3)
    .map((course) => ({
      title:
        course.status === "completed"
          ? "أكملت كورسًا"
          : "تتعلم حاليًا",

      description:
        course.completedLessons > 0
          ? `${course.title} — أكملت ${course.completedLessons} درس`
          : course.title,

      time: formatDate(
        course.completed_at ||
          course.enrolled_at
      ),

      icon:
        course.status === "completed"
          ? CheckCircle2
          : PlayCircle,
    }));

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-16">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
                <UserRound size={30} />
              </div>

              <div>
                <p className="text-sm font-bold text-purple-400">
                  لوحة التحكم
                </p>

                <h1 className="mt-2 text-3xl font-black md:text-5xl">
                  مرحبًا، {displayName}
                </h1>

                <p className="mt-3 text-zinc-400">
                  أكمل رحلة التعلم وواصل تطوير
                  مهاراتك.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                href="/profile"
                variant="secondary"
                className="w-fit px-7 py-4"
              >
                <UserRound size={19} />
                الملف الشخصي
              </Button>

              <Button
                href="/certificates"
                variant="secondary"
                className="w-fit px-7 py-4"
              >
                <Award size={19} />
                شهاداتي
              </Button>

              <Button
                href="/courses"
                className="w-fit px-7 py-4"
              >
                استكشف كورسات جديدة
                <BookOpen size={19} />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <GlassCard
                  key={stat.title}
                  hover={false}
                  className="p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-zinc-400">
                        {stat.title}
                      </p>

                      <p className="mt-3 text-4xl font-black">
                        {stat.value}
                      </p>

                      <p className="mt-2 text-sm text-zinc-500">
                        {stat.description}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                      <Icon size={23} />
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-purple-400">
                تابع من حيث توقفت
              </p>

              <h2 className="mt-2 text-3xl font-black">
                كورساتي الحالية
              </h2>

              <p className="mt-3 text-zinc-400">
                الكورسات التي سجلت فيها داخل
                المنصة.
              </p>
            </div>

            <Link
              href="/courses"
              className="text-sm font-bold text-purple-400 transition hover:text-purple-300"
            >
              عرض جميع الكورسات
            </Link>
          </div>

          {coursesError ? (
            <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/[0.06] px-6 py-16 text-center">
              <h3 className="text-2xl font-black text-red-300">
                تعذر تحميل تقدم الكورسات
              </h3>

              <p className="mt-3 text-zinc-400">
                حدث خطأ أثناء قراءة بيانات
                الدروس المكتملة.
              </p>
            </div>
          ) : enrolledCourses.length >
            0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {enrolledCourses.map(
                (course) => (
                  <GlassCard
                    key={course.id}
                    as="article"
                    className="group overflow-hidden p-0"
                  >
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={course.image}
                        alt={course.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover transition duration-500 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                      <span className="absolute right-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-2 text-xs font-bold backdrop-blur-xl">
                        {course.category}
                      </span>
                    </div>

                    <div className="p-6">
                      <h3 className="min-h-14 text-xl font-black leading-7 transition group-hover:text-purple-300">
                        {course.title}
                      </h3>

                      <p className="mt-2 text-sm text-zinc-500">
                        {course.instructor}
                      </p>

                      <div className="mt-5 flex items-center justify-between gap-4 text-sm">
                        <span className="text-zinc-500">
                          نسبة التقدم
                        </span>

                        <span className="font-bold text-purple-400">
                          {course.progress}%
                        </span>
                      </div>

                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-gradient-to-l from-purple-600 to-indigo-600"
                          style={{
                            width: `${course.progress}%`,
                          }}
                        />
                      </div>

                      <div className="mt-5 flex items-center justify-between gap-4 text-sm text-zinc-500">
                        <span>
                          {
                            course.completedLessons
                          }{" "}
                          من{" "}
                          {course.lessons_count}{" "}
                          درس
                        </span>

                        <span className="flex items-center gap-1">
                          <Star
                            size={15}
                            className="fill-yellow-400 text-yellow-400"
                          />

                          {course.rating}
                        </span>
                      </div>

                      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
                        <p className="text-xs text-zinc-500">
                          الحالة
                        </p>

                        <p className="mt-2 text-sm font-bold text-zinc-300">
                          {course.lastLesson}
                        </p>
                      </div>

                      <Button
                        href={`/learn/${course.slug}`}
                        className="mt-6 w-full"
                      >
                        <PlayCircle size={18} />

                        {course.status ===
                        "completed"
                          ? "مراجعة الكورس"
                          : "متابعة التعلم"}
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
              <BookOpen
                size={45}
                className="mx-auto text-purple-400"
              />

              <h3 className="mt-5 text-2xl font-black">
                لم تبدأ أي كورس بعد
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-400">
                استكشف الكورسات المتاحة واختر
                أول كورس لبدء رحلة التعلم.
              </p>

              <Button
                href="/courses"
                className="mx-auto mt-7 w-fit px-8 py-4"
              >
                استكشف الكورسات
              </Button>
            </GlassCard>
          )}
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_360px]">
          <GlassCard
            hover={false}
            className="p-7 md:p-8"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Clock3 size={21} />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  آخر النشاطات
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  أحدث تقدمك داخل الكورسات
                </p>
              </div>
            </div>

            {activities.length > 0 ? (
              <div className="mt-7 space-y-4">
                {activities.map(
                  (activity) => {
                    const Icon =
                      activity.icon;

                    return (
                      <div
                        key={`${activity.title}-${activity.description}`}
                        className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-5"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                          <Icon size={19} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold">
                            {activity.title}
                          </h3>

                          <p className="mt-2 text-sm leading-6 text-zinc-400">
                            {
                              activity.description
                            }
                          </p>

                          <p className="mt-2 text-xs text-zinc-600">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-8 text-center text-zinc-500">
                لا توجد نشاطات حتى الآن.
              </div>
            )}
          </GlassCard>

          <div className="space-y-6">
            <GlassCard
              hover={false}
              className="border-purple-500/20 bg-purple-500/[0.06] p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Award size={24} />
              </div>

              <h2 className="mt-5 text-2xl font-black">
                الشهادات
              </h2>

              <p className="mt-3 leading-7 text-zinc-400">
                أكمل الكورسات للحصول على
                شهادات الإتمام.
              </p>

              <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="text-sm text-zinc-400">
                  الشهادات المكتسبة
                </span>

                <span className="text-2xl font-black text-purple-400">
                  {completedCourses}
                </span>
              </div>

              <Button
                href="/certificates"
                variant="secondary"
                className="mt-6 w-full"
              >
                <Award size={18} />
                عرض شهاداتي
              </Button>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <GraduationCap size={25} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                تقدمك في التعلم
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                متوسط تقدمك المحسوب من الدروس
                التي أنهيتها فعلًا.
              </p>

              <div className="mt-5 flex items-center justify-between text-sm">
                <span className="text-zinc-500">
                  متوسط الإنجاز
                </span>

                <span className="font-bold text-blue-400">
                  {averageProgress}%
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-blue-500 to-indigo-500"
                  style={{
                    width: `${averageProgress}%`,
                  }}
                />
              </div>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <Flame size={25} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                واصل التعلم
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                شاهد الدرس التالي للحفاظ على
                تقدمك داخل الكورس.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
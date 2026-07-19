import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  Clock3,
  Eye,
  Layers3,
  ListVideo,
  Pencil,
  PlayCircle,
  Plus,
  ShieldCheck,
  Video,
} from "lucide-react";

import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import GlassCard from "../../../components/ui/GlassCard";
import { createClient } from "../../../lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    course?: string | string[];
  }>;
};

type CourseRecord = {
  id: string;
  slug: string;
  title: string;
  category: string;
  lessons_count: number;
  is_published: boolean;
};

type LessonRecord = {
  id: string;
  course_id: string;
  position: number;
  section_title: string;
  section_position: number;
  title: string;
  description: string;
  duration_minutes: number;
  is_preview: boolean;
  is_published: boolean;
};

type LessonSection = {
  title: string;
  position: number;
  lessons: LessonRecord[];
};

function formatDuration(totalMinutes: number) {
  if (totalMinutes <= 0) {
    return "0 دقيقة";
  }

  const hours = Math.floor(
    totalMinutes / 60
  );

  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} دقيقة`;
  }

  if (minutes === 0) {
    return `${hours} ساعة`;
  }

  return `${hours} ساعة و${minutes} دقيقة`;
}

export default async function AdminLessonsPage({
  searchParams,
}: PageProps) {
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

  const resolvedSearchParams =
    await searchParams;

  const courseParameter =
    Array.isArray(
      resolvedSearchParams.course
    )
      ? resolvedSearchParams.course[0]
      : resolvedSearchParams.course;

  const {
    data: coursesData,
    error: coursesError,
  } = await supabase
    .from("courses")
    .select(
      `
        id,
        slug,
        title,
        category,
        lessons_count,
        is_published
      `
    )
    .order("created_at", {
      ascending: true,
    });

  const courses: CourseRecord[] =
    coursesError
      ? []
      : (coursesData ?? []).map(
          (course) => ({
            id: String(course.id),
            slug: String(course.slug),
            title: String(course.title),

            category: String(
              course.category
            ),

            lessons_count: Number(
              course.lessons_count
            ),

            is_published: Boolean(
              course.is_published
            ),
          })
        );

  const selectedCourse =
    courses.find(
      (course) =>
        course.id === courseParameter
    ) ??
    courses[0] ??
    null;

  let lessons: LessonRecord[] = [];
  let lessonsError = false;

  if (selectedCourse) {
    const {
      data: lessonsData,
      error: lessonsQueryError,
    } = await supabase
      .from("lessons")
      .select(
        `
          id,
          course_id,
          position,
          section_title,
          section_position,
          title,
          description,
          duration_minutes,
          is_preview,
          is_published
        `
      )
      .eq(
        "course_id",
        selectedCourse.id
      )
      .order("section_position", {
        ascending: true,
      })
      .order("position", {
        ascending: true,
      });

    if (lessonsQueryError) {
      console.error(
        "تعذر تحميل الدروس:",
        lessonsQueryError
      );

      lessonsError = true;
    } else {
      lessons = (lessonsData ?? []).map(
        (lesson) => ({
          id: String(lesson.id),

          course_id: String(
            lesson.course_id
          ),

          position: Number(
            lesson.position
          ),

          section_title: String(
            lesson.section_title
          ),

          section_position: Number(
            lesson.section_position
          ),

          title: String(lesson.title),

          description:
            lesson.description === null
              ? ""
              : String(
                  lesson.description
                ),

          duration_minutes: Number(
            lesson.duration_minutes
          ),

          is_preview: Boolean(
            lesson.is_preview
          ),

          is_published: Boolean(
            lesson.is_published
          ),
        })
      );
    }
  }

  const sectionsMap = new Map<
    string,
    LessonSection
  >();

  lessons.forEach((lesson) => {
    const sectionKey = `${lesson.section_position}-${lesson.section_title}`;

    const currentSection =
      sectionsMap.get(sectionKey);

    if (currentSection) {
      currentSection.lessons.push(
        lesson
      );

      return;
    }

    sectionsMap.set(sectionKey, {
      title: lesson.section_title,
      position:
        lesson.section_position,
      lessons: [lesson],
    });
  });

  const sections = Array.from(
    sectionsMap.values()
  ).sort(
    (firstSection, secondSection) =>
      firstSection.position -
      secondSection.position
  );

  const publishedLessons =
    lessons.filter(
      (lesson) => lesson.is_published
    ).length;

  const previewLessons =
    lessons.filter(
      (lesson) => lesson.is_preview
    ).length;

  const totalDuration = lessons.reduce(
    (total, lesson) =>
      total + lesson.duration_minutes,
    0
  );

  const stats = [
    {
      title: "إجمالي الدروس",
      value: lessons.length.toString(),
      description: "درس داخل الكورس",
      icon: ListVideo,
    },
    {
      title: "الدروس المنشورة",
      value:
        publishedLessons.toString(),
      description: "متاحة للطلاب",
      icon: Eye,
    },
    {
      title: "دروس المعاينة",
      value: previewLessons.toString(),
      description: "متاحة قبل الاشتراك",
      icon: PlayCircle,
    },
    {
      title: "مدة المحتوى",
      value:
        formatDuration(totalDuration),
      description: "إجمالي مدة الدروس",
      icon: Clock3,
    },
  ];

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

          <div className="mt-7 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
                <ShieldCheck size={31} />
              </div>

              <div>
                <p className="text-sm font-bold text-purple-400">
                  لوحة الإدارة
                </p>

                <h1 className="mt-2 text-3xl font-black md:text-5xl">
                  إدارة الدروس
                </h1>

                <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                  اختر الكورس ثم أضف دروسه
                  وعدّل ترتيب المحتوى وحالة
                  النشر.
                </p>
              </div>
            </div>

            {selectedCourse ? (
              <Link
                href={`/admin/lessons/new?course=${selectedCourse.id}`}
                className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] hover:brightness-110"
              >
                <Plus size={20} />
                إضافة درس جديد
              </Link>
            ) : (
              <span className="inline-flex w-fit cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-zinc-800 px-7 py-4 font-black text-zinc-500">
                <Plus size={20} />
                إضافة درس جديد
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div>
            <p className="text-sm font-bold text-purple-400">
              اختر الكورس
            </p>

            <h2 className="mt-2 text-3xl font-black">
              كورسات المنصة
            </h2>

            <p className="mt-3 text-zinc-400">
              اضغط على الكورس لعرض دروسه
              وإدارتها.
            </p>
          </div>

          {coursesError ? (
            <GlassCard
              hover={false}
              className="mt-8 border-red-500/20 bg-red-500/[0.05] px-6 py-12 text-center"
            >
              <h3 className="text-xl font-black text-red-300">
                تعذر تحميل الكورسات
              </h3>

              <p className="mt-3 text-zinc-400">
                حدث خطأ أثناء قراءة بيانات
                الكورسات.
              </p>
            </GlassCard>
          ) : courses.length === 0 ? (
            <GlassCard
              hover={false}
              className="mt-8 px-6 py-12 text-center"
            >
              <BookOpen
                size={44}
                className="mx-auto text-purple-400"
              />

              <h3 className="mt-5 text-xl font-black">
                لا توجد كورسات
              </h3>

              <Link
                href="/admin/courses/new"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 font-black"
              >
                <Plus size={18} />
                إضافة كورس
              </Link>
            </GlassCard>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {courses.map((course) => {
                const isSelected =
                  selectedCourse?.id ===
                  course.id;

                return (
                  <Link
                    key={course.id}
                    href={`/admin/lessons?course=${course.id}`}
                    className={`rounded-2xl border p-5 transition ${
                      isSelected
                        ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-950/30"
                        : "border-white/10 bg-white/[0.04] hover:border-purple-500/40 hover:bg-purple-500/[0.06]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                          isSelected
                            ? "bg-purple-600 text-white"
                            : "bg-purple-500/10 text-purple-400"
                        }`}
                      >
                        <BookOpen size={21} />
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold ${
                          course.is_published
                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                            : "border-orange-500/20 bg-orange-500/10 text-orange-300"
                        }`}
                      >
                        {course.is_published
                          ? "منشور"
                          : "غير منشور"}
                      </span>
                    </div>

                    <h3 className="mt-5 line-clamp-2 min-h-14 text-lg font-black leading-7">
                      {course.title}
                    </h3>

                    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-zinc-500">
                      <span>
                        {course.category}
                      </span>

                      <span>
                        {course.lessons_count} درس
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {selectedCourse && (
        <>
          <section className="px-6 pb-12">
            <div className="mx-auto max-w-7xl">
              <GlassCard
                hover={false}
                className="flex flex-col gap-5 border-purple-500/20 bg-purple-500/[0.05] p-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <Layers3 size={23} />
                  </div>

                  <div>
                    <p className="text-sm text-zinc-500">
                      الكورس المحدد
                    </p>

                    <h2 className="mt-1 text-xl font-black">
                      {selectedCourse.title}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/admin/courses/${selectedCourse.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
                  >
                    <Pencil size={17} />
                    تعديل الكورس
                  </Link>

                  <Link
                    href={`/courses/${selectedCourse.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 text-sm font-bold text-purple-300 transition hover:bg-purple-500/20"
                  >
                    <Eye size={17} />
                    معاينة الكورس
                  </Link>
                </div>
              </GlassCard>
            </div>
          </section>

          <section className="px-6 pb-12">
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

                          <p className="mt-3 text-3xl font-black">
                            {stat.value}
                          </p>

                          <p className="mt-2 text-sm text-zinc-500">
                            {stat.description}
                          </p>
                        </div>

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                          <Icon size={21} />
                        </div>
                      </div>
                    </GlassCard>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="px-6 pb-24">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-purple-400">
                    محتوى الكورس
                  </p>

                  <h2 className="mt-2 text-3xl font-black">
                    الأقسام والدروس
                  </h2>

                  <p className="mt-3 text-zinc-400">
                    الدروس مرتبة حسب القسم
                    والترتيب المسجل في قاعدة
                    البيانات.
                  </p>
                </div>

                <Link
                  href={`/admin/lessons/new?course=${selectedCourse.id}`}
                  className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 font-black text-white"
                >
                  <Plus size={19} />
                  إضافة درس
                </Link>
              </div>

              {lessonsError ? (
                <GlassCard
                  hover={false}
                  className="mt-8 border-red-500/20 bg-red-500/[0.05] px-6 py-16 text-center"
                >
                  <h3 className="text-2xl font-black text-red-300">
                    تعذر تحميل الدروس
                  </h3>

                  <p className="mt-3 text-zinc-400">
                    سنضيف صلاحيات المدير لجدول
                    الدروس في الخطوة التالية.
                  </p>
                </GlassCard>
              ) : sections.length === 0 ? (
                <GlassCard
                  hover={false}
                  className="mt-8 px-6 py-16 text-center"
                >
                  <Video
                    size={48}
                    className="mx-auto text-purple-400"
                  />

                  <h3 className="mt-5 text-2xl font-black">
                    لا توجد دروس في هذا الكورس
                  </h3>

                  <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-400">
                    أضف أول درس وابدأ تجهيز
                    محتوى الكورس.
                  </p>

                  <Link
                    href={`/admin/lessons/new?course=${selectedCourse.id}`}
                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black"
                  >
                    <Plus size={19} />
                    إضافة أول درس
                  </Link>
                </GlassCard>
              ) : (
                <div className="mt-8 space-y-5">
                  {sections.map(
                    (
                      section,
                      sectionIndex
                    ) => (
                      <details
                        key={`${section.position}-${section.title}`}
                        open={
                          sectionIndex === 0
                        }
                        className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-5 border-b border-white/10 px-6 py-5 transition hover:bg-purple-500/[0.05]">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 font-black text-purple-400">
                              {section.position}
                            </div>

                            <div>
                              <h3 className="text-lg font-black">
                                {section.title}
                              </h3>

                              <p className="mt-1 text-sm text-zinc-500">
                                {
                                  section.lessons
                                    .length
                                }{" "}
                                درس
                              </p>
                            </div>
                          </div>

                          <ChevronLeft
                            size={21}
                            className="text-zinc-500 transition group-open:-rotate-90"
                          />
                        </summary>

                        <div className="space-y-3 p-4">
                          {section.lessons.map(
                            (lesson) => (
                              <div
                                key={lesson.id}
                                className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-black/20 p-5 lg:flex-row lg:items-center lg:justify-between"
                              >
                                <div className="flex min-w-0 items-start gap-4">
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/10 font-black text-purple-400">
                                    {
                                      lesson.position
                                    }
                                  </div>

                                  <div className="min-w-0">
                                    <h4 className="font-black leading-7">
                                      {
                                        lesson.title
                                      }
                                    </h4>

                                    {lesson.description && (
                                      <p className="mt-2 line-clamp-1 text-sm leading-6 text-zinc-500">
                                        {
                                          lesson.description
                                        }
                                      </p>
                                    )}

                                    <div className="mt-3 flex flex-wrap gap-2">
                                      <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-400">
                                        <Clock3
                                          size={13}
                                        />
                                        {
                                          lesson.duration_minutes
                                        }{" "}
                                        دقيقة
                                      </span>

                                      <span
                                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
                                          lesson.is_published
                                            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                            : "border-orange-500/20 bg-orange-500/10 text-orange-300"
                                        }`}
                                      >
                                        <Eye
                                          size={13}
                                        />

                                        {lesson.is_published
                                          ? "منشور"
                                          : "غير منشور"}
                                      </span>

                                      {lesson.is_preview && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-bold text-blue-300">
                                          <PlayCircle
                                            size={13}
                                          />
                                          معاينة مجانية
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <Link
                                  href={`/admin/lessons/${lesson.id}`}
                                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 text-sm font-black text-purple-300 transition hover:bg-purple-500/20"
                                >
                                  <Pencil size={17} />
                                  تعديل الدرس
                                </Link>
                              </div>
                            )
                          )}
                        </div>
                      </details>
                    )
                  )}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <Footer />
    </main>
  );
}
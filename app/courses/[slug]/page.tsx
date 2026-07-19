import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Globe2,
  PlayCircle,
  Star,
  Users,
} from "lucide-react";

import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import Button from "../../../components/ui/Button";
import GlassCard from "../../../components/ui/GlassCard";
import EnrollButton from "../../../components/courses/EnrollButton";
import { createClient } from "../../../lib/supabase/server";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type CourseRecord = {
  id: string;
  slug: string;
  title: string;
  instructor: string;
  category: string;
  description: string | null;
  image: string;
  rating: number;
  students_count: number;
  duration: string;
  lessons_count: number;
};

type LessonRecord = {
  id: string;
  position: number;
  section_title: string;
  section_position: number;
  title: string;
  duration_minutes: number;
  is_preview: boolean;
};

type CurriculumSection = {
  title: string;
  position: number;
  durationMinutes: number;
  lessons: LessonRecord[];
};

function formatDuration(minutes: number) {
  if (minutes <= 0) {
    return "مدة غير محددة";
  }

  const hours = Math.floor(
    minutes / 60
  );

  const remainingMinutes =
    minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} دقيقة`;
  }

  if (remainingMinutes === 0) {
    return `${hours} ساعة`;
  }

  return `${hours} ساعة و${remainingMinutes} دقيقة`;
}

export default async function CourseDetailsPage({
  params,
}: PageProps) {
  const { slug } = await params;

  const supabase = await createClient();

  const {
    data: courseData,
    error: courseError,
  } = await supabase
    .from("courses")
    .select(
      `
        id,
        slug,
        title,
        instructor,
        category,
        description,
        image,
        rating,
        students_count,
        duration,
        lessons_count
      `
    )
    .eq("slug", slug)
    .maybeSingle();

  if (
    courseError ||
    !courseData
  ) {
    notFound();
  }

  const course: CourseRecord = {
    id: String(courseData.id),
    slug: String(courseData.slug),
    title: String(courseData.title),

    instructor: String(
      courseData.instructor
    ),

    category: String(
      courseData.category
    ),

    description:
      courseData.description === null
        ? null
        : String(
            courseData.description
          ),

    image: String(courseData.image),
    rating: Number(courseData.rating),

    students_count: Number(
      courseData.students_count
    ),

    duration: String(
      courseData.duration
    ),

    lessons_count: Number(
      courseData.lessons_count
    ),
  };

  const {
    data: lessonsData,
    error: lessonsError,
  } = await supabase
    .from("lessons")
    .select(
      `
        id,
        position,
        section_title,
        section_position,
        title,
        duration_minutes,
        is_preview
      `
    )
    .eq("course_id", course.id)
    .eq("is_published", true)
    .order("section_position", {
      ascending: true,
    })
    .order("position", {
      ascending: true,
    });

  if (lessonsError) {
    console.error(
      "تعذر تحميل محتوى الكورس:",
      lessonsError
    );
  }

  const lessons: LessonRecord[] =
    lessonsError
      ? []
      : (lessonsData ?? []).map(
          (lesson) => ({
            id: String(lesson.id),

            position: Number(
              lesson.position
            ),

            section_title: String(
              lesson.section_title
            ),

            section_position: Number(
              lesson.section_position
            ),

            title: String(
              lesson.title
            ),

            duration_minutes: Number(
              lesson.duration_minutes
            ),

            is_preview: Boolean(
              lesson.is_preview
            ),
          })
        );

  const sectionsMap = new Map<
    string,
    CurriculumSection
  >();

  lessons.forEach((lesson) => {
    const sectionKey = `${lesson.section_position}-${lesson.section_title}`;

    const existingSection =
      sectionsMap.get(sectionKey);

    if (existingSection) {
      existingSection.lessons.push(
        lesson
      );

      existingSection.durationMinutes +=
        lesson.duration_minutes;

      return;
    }

    sectionsMap.set(sectionKey, {
      title: lesson.section_title,

      position:
        lesson.section_position,

      durationMinutes:
        lesson.duration_minutes,

      lessons: [lesson],
    });
  });

  const curriculum = Array.from(
    sectionsMap.values()
  ).sort(
    (firstSection, secondSection) =>
      firstSection.position -
      secondSection.position
  );

  const publishedLessonsCount =
    lessons.length;

  const totalContentMinutes =
    lessons.reduce(
      (total, lesson) =>
        total +
        lesson.duration_minutes,
      0
    );

  const rating =
    Number.isFinite(course.rating)
      ? course.rating
      : 0;

  const students =
    new Intl.NumberFormat(
      "en-US"
    ).format(
      course.students_count
    );

  const learningPoints = [
    `فهم أساسيات ${course.category} بصورة واضحة`,
    "تنفيذ تطبيقات ومشروعات عملية",
    "التعلم خطوة بخطوة",
    "الوصول إلى ملفات ومصادر إضافية",
    "متابعة تقدمك داخل الكورس",
    "الحصول على شهادة بعد الإتمام",
  ];

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300">
              {course.category}
            </span>

            <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
              {course.title}
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
              {course.description ||
                "تعلم المجال من الصفر حتى الاحتراف من خلال دروس منظمة وتطبيقات عملية."}
            </p>

            <div className="mt-8 flex flex-wrap gap-4 text-sm text-zinc-300">
              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <Star
                  size={18}
                  className="fill-yellow-400 text-yellow-400"
                />

                {rating}
              </span>

              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <Users
                  size={18}
                  className="text-purple-400"
                />

                {students} طالب
              </span>

              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <Clock3
                  size={18}
                  className="text-purple-400"
                />

                {totalContentMinutes > 0
                  ? formatDuration(
                      totalContentMinutes
                    )
                  : course.duration}
              </span>

              <span className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <BookOpen
                  size={18}
                  className="text-purple-400"
                />

                {publishedLessonsCount} درس
              </span>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <EnrollButton
                courseId={course.id}
                slug={course.slug}
                className="w-full sm:w-auto"
              />

              <Button
                variant="secondary"
                className="px-8 py-4"
              >
                <PlayCircle size={20} />
                مشاهدة المقدمة
              </Button>
            </div>
          </div>

          <div className="relative h-[320px] overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-purple-950/30 sm:h-[420px]">
            <Image
              src={course.image}
              alt={course.title}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            <div className="absolute bottom-6 right-6 rounded-2xl border border-white/10 bg-black/50 px-5 py-4 backdrop-blur-xl">
              <p className="text-sm text-zinc-400">
                مقدم بواسطة
              </p>

              <p className="mt-1 font-bold text-white">
                {course.instructor}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_340px]">
          <div className="space-y-10">
            <GlassCard
              as="section"
              hover={false}
              className="p-7 md:p-8"
            >
              <h2 className="text-2xl font-black md:text-3xl">
                ماذا ستتعلم؟
              </h2>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {learningPoints.map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3"
                    >
                      <CheckCircle2
                        size={20}
                        className="mt-1 shrink-0 text-green-400"
                      />

                      <span className="leading-7 text-zinc-300">
                        {item}
                      </span>
                    </div>
                  )
                )}
              </div>
            </GlassCard>

            <GlassCard
              as="section"
              hover={false}
              className="p-7 md:p-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black md:text-3xl">
                    محتوى الكورس
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-zinc-500">
                    الأقسام والدروس المنشورة
                    المتاحة داخل الكورس.
                  </p>
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-400">
                  {publishedLessonsCount} درس
                </span>
              </div>

              {lessonsError ? (
                <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/[0.06] px-6 py-10 text-center">
                  <h3 className="font-black text-red-300">
                    تعذر تحميل محتوى الكورس
                  </h3>

                  <p className="mt-3 text-sm text-zinc-500">
                    حدث خطأ أثناء قراءة الدروس
                    من قاعدة البيانات.
                  </p>
                </div>
              ) : curriculum.length > 0 ? (
                <div className="mt-8 space-y-4">
                  {curriculum.map(
                    (
                      section,
                      sectionIndex
                    ) => (
                      <details
                        key={`${section.position}-${section.title}`}
                        open={
                          sectionIndex === 0
                        }
                        className="group overflow-hidden rounded-2xl border border-white/10 bg-black/20 transition duration-300 open:border-purple-500/30"
                      >
                        <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 transition hover:bg-purple-500/[0.05] sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 font-bold text-purple-400">
                              {sectionIndex +
                                1}
                            </div>

                            <div>
                              <h3 className="font-black">
                                {
                                  section.title
                                }
                              </h3>

                              <p className="mt-1 text-sm text-zinc-500">
                                {
                                  section
                                    .lessons
                                    .length
                                }{" "}
                                درس
                              </p>
                            </div>
                          </div>

                          <span className="flex items-center gap-2 text-sm text-zinc-500">
                            <Clock3
                              size={16}
                            />

                            {formatDuration(
                              section.durationMinutes
                            )}
                          </span>
                        </summary>

                        <div className="border-t border-white/10 p-3">
                          {section.lessons.map(
                            (
                              lesson,
                              lessonIndex
                            ) => (
                              <div
                                key={
                                  lesson.id
                                }
                                className="flex flex-col gap-4 rounded-xl px-4 py-4 transition hover:bg-white/[0.04] sm:flex-row sm:items-center sm:justify-between"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm font-bold text-zinc-400">
                                    {lessonIndex +
                                      1}
                                  </div>

                                  <div className="min-w-0">
                                    <p className="font-bold text-zinc-300">
                                      {
                                        lesson.title
                                      }
                                    </p>

                                    {lesson.is_preview && (
                                      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-xs font-bold text-blue-400">
                                        <PlayCircle
                                          size={
                                            13
                                          }
                                        />
                                        معاينة
                                        مجانية
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <span className="flex shrink-0 items-center gap-2 text-sm text-zinc-600">
                                  <Clock3
                                    size={15}
                                  />

                                  {formatDuration(
                                    lesson.duration_minutes
                                  )}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </details>
                    )
                  )}
                </div>
              ) : (
                <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 px-6 py-12 text-center">
                  <BookOpen
                    size={42}
                    className="mx-auto text-purple-400"
                  />

                  <h3 className="mt-5 text-xl font-black">
                    لم تتم إضافة دروس منشورة
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-zinc-500">
                    سيتم عرض أقسام ودروس الكورس
                    هنا بعد نشرها.
                  </p>
                </div>
              )}
            </GlassCard>
          </div>

          <aside className="h-fit lg:sticky lg:top-28">
            <GlassCard
              hover={false}
              className="border-purple-500/20 bg-purple-500/[0.06] p-7"
            >
              <h3 className="text-2xl font-black">
                تفاصيل الاشتراك
              </h3>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                اشترك في المنصة واحصل على وصول
                كامل إلى محتوى الكورس.
              </p>

              <div className="mt-8 space-y-5 text-sm text-zinc-300">
                <div className="flex items-center gap-3">
                  <Globe2
                    size={20}
                    className="shrink-0 text-purple-400"
                  />

                  <span>
                    الوصول من أي جهاز
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Award
                    size={20}
                    className="shrink-0 text-purple-400"
                  />

                  <span>
                    شهادة بعد الإتمام
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Clock3
                    size={20}
                    className="shrink-0 text-purple-400"
                  />

                  <span>
                    وصول طوال مدة الاشتراك
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <BookOpen
                    size={20}
                    className="shrink-0 text-purple-400"
                  />

                  <span>
                    ملفات ومصادر قابلة للتحميل
                  </span>
                </div>
              </div>

              <EnrollButton
                courseId={course.id}
                slug={course.slug}
                className="mt-10"
              />
            </GlassCard>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
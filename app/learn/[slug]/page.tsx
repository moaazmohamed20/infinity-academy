"use client";

import Link from "next/link";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileArchive,
  FileText,
  ListVideo,
  LoaderCircle,
  PlayCircle,
  Star,
  Trophy,
  Users,
} from "lucide-react";

import Navbar from "../../../components/layout/Navbar";
import GlassCard from "../../../components/ui/GlassCard";
import { createClient } from "../../../lib/supabase/client";

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

type EnrollmentStatus =
  | "active"
  | "completed";

type LessonRecord = {
  id: string;
  course_id: string;
  position: number;
  section_title: string;
  section_position: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  video_url: string | null;
  summary_file_url: string | null;
  resources_file_url: string | null;
};

type LessonProgressRecord = {
  lesson_id: string;
  completed: boolean;
};

type LessonSection = {
  title: string;
  position: number;
  lessons: LessonRecord[];
};

function calculateProgress(
  completedLessons: number,
  totalLessons: number
) {
  if (
    totalLessons <= 0 ||
    completedLessons <= 0
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

function formatDuration(minutes: number) {
  if (minutes === 1) {
    return "دقيقة واحدة";
  }

  if (minutes === 2) {
    return "دقيقتان";
  }

  if (
    minutes >= 3 &&
    minutes <= 10
  ) {
    return `${minutes} دقائق`;
  }

  return `${minutes} دقيقة`;
}

export default function LearnPage() {
  const params = useParams<{
    slug: string;
  }>();

  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const slug = params.slug;

  const [course, setCourse] =
    useState<CourseRecord | null>(null);

  const [lessons, setLessons] = useState<
    LessonRecord[]
  >([]);

  const [
    completedLessonIds,
    setCompletedLessonIds,
  ] = useState<string[]>([]);

  const [
    activeLessonId,
    setActiveLessonId,
  ] = useState("");

  const [userId, setUserId] =
    useState("");

  const [enrollmentId, setEnrollmentId] =
    useState("");

  const [
    enrollmentStatus,
    setEnrollmentStatus,
  ] =
    useState<EnrollmentStatus>("active");

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    isSavingProgress,
    setIsSavingProgress,
  ] = useState(false);

  const [loadError, setLoadError] =
    useState("");

  const [progressError, setProgressError] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    const loadCourse = async () => {
      setIsLoading(true);
      setLoadError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (userError || !user) {
        router.replace("/login");
        router.refresh();
        return;
      }

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

      if (!isMounted) {
        return;
      }

      if (courseError || !courseData) {
        console.error(
          "تعذر تحميل الكورس:",
          courseError
        );

        setLoadError(
          "لم نتمكن من العثور على هذا الكورس."
        );

        setIsLoading(false);
        return;
      }

      const formattedCourse: CourseRecord = {
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
        data: enrollmentData,
        error: enrollmentError,
      } = await supabase
        .from("enrollments")
        .select(
          `
            id,
            progress,
            status,
            completed_at
          `
        )
        .eq("user_id", user.id)
        .eq(
          "course_id",
          formattedCourse.id
        )
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (
        enrollmentError ||
        !enrollmentData
      ) {
        router.replace(
          `/courses/${formattedCourse.slug}`
        );

        router.refresh();
        return;
      }

      const {
        data: lessonsData,
        error: lessonsError,
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
            video_url,
            summary_file_url,
            resources_file_url
          `
        )
        .eq(
          "course_id",
          formattedCourse.id
        )
        .eq("is_published", true)
        .order("section_position", {
          ascending: true,
        })
        .order("position", {
          ascending: true,
        });

      if (!isMounted) {
        return;
      }

      if (
        lessonsError ||
        !lessonsData ||
        lessonsData.length === 0
      ) {
        console.error(
          "تعذر تحميل دروس الكورس:",
          lessonsError
        );

        setLoadError(
          "لم تتم إضافة دروس منشورة لهذا الكورس حتى الآن."
        );

        setIsLoading(false);
        return;
      }

      const formattedLessons: LessonRecord[] =
        lessonsData.map((lesson) => ({
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
              ? null
              : String(
                  lesson.description
                ),

          duration_minutes: Number(
            lesson.duration_minutes
          ),

          video_url:
            lesson.video_url === null
              ? null
              : String(
                  lesson.video_url
                ),

          summary_file_url:
            lesson.summary_file_url ===
            null
              ? null
              : String(
                  lesson.summary_file_url
                ),

          resources_file_url:
            lesson.resources_file_url ===
            null
              ? null
              : String(
                  lesson.resources_file_url
                ),
        }));

      const lessonIds =
        formattedLessons.map(
          (lesson) => lesson.id
        );

      const {
        data: progressData,
        error: progressLoadError,
      } = await supabase
        .from("lesson_progress")
        .select(
          `
            lesson_id,
            completed
          `
        )
        .eq("user_id", user.id)
        .in("lesson_id", lessonIds);

      if (!isMounted) {
        return;
      }

      if (progressLoadError) {
        console.error(
          "تعذر تحميل تقدم الدروس:",
          progressLoadError
        );

        setLoadError(
          "تعذر تحميل تقدمك داخل الكورس."
        );

        setIsLoading(false);
        return;
      }

      const progressRows: LessonProgressRecord[] =
        (progressData ?? []).map(
          (progress) => ({
            lesson_id: String(
              progress.lesson_id
            ),

            completed: Boolean(
              progress.completed
            ),
          })
        );

      const existingProgressIds =
        new Set(
          progressRows.map(
            (progress) =>
              progress.lesson_id
          )
        );

      let completedIds = new Set(
        progressRows
          .filter(
            (progress) =>
              progress.completed
          )
          .map(
            (progress) =>
              progress.lesson_id
          )
      );

      const oldProgress = Number(
        enrollmentData.progress
      );

      if (
        completedIds.size === 0 &&
        oldProgress > 0
      ) {
        const oldCompletedCount =
          oldProgress >= 100
            ? formattedLessons.length
            : Math.max(
                1,
                Math.floor(
                  (oldProgress / 100) *
                    formattedLessons.length
                )
              );

        const oldCompletedLessons =
          formattedLessons.slice(
            0,
            oldCompletedCount
          );

        const oldCompletedIds =
          oldCompletedLessons.map(
            (lesson) => lesson.id
          );

        const missingProgressRows =
          oldCompletedLessons
            .filter(
              (lesson) =>
                !existingProgressIds.has(
                  lesson.id
                )
            )
            .map((lesson) => ({
              user_id: user.id,
              lesson_id: lesson.id,
              completed: true,
              completed_at:
                new Date().toISOString(),
              last_watched_seconds: 0,
            }));

        if (
          missingProgressRows.length > 0
        ) {
          const {
            error:
              migrationInsertError,
          } = await supabase
            .from("lesson_progress")
            .insert(
              missingProgressRows
            );

          if (migrationInsertError) {
            console.error(
              "تعذر نقل التقدم القديم:",
              migrationInsertError
            );
          }
        }

        const existingOldLessonIds =
          oldCompletedIds.filter(
            (lessonId) =>
              existingProgressIds.has(
                lessonId
              )
          );

        if (
          existingOldLessonIds.length > 0
        ) {
          const {
            error:
              migrationUpdateError,
          } = await supabase
            .from("lesson_progress")
            .update({
              completed: true,
              completed_at:
                new Date().toISOString(),
            })
            .eq("user_id", user.id)
            .in(
              "lesson_id",
              existingOldLessonIds
            );

          if (migrationUpdateError) {
            console.error(
              "تعذر تحديث التقدم القديم:",
              migrationUpdateError
            );
          }
        }

        completedIds = new Set(
          oldCompletedIds
        );
      }

      const exactProgress =
        calculateProgress(
          completedIds.size,
          formattedLessons.length
        );

      const exactStatus: EnrollmentStatus =
        completedIds.size >=
        formattedLessons.length
          ? "completed"
          : "active";

      const currentStatus =
        enrollmentData.status ===
        "completed"
          ? "completed"
          : "active";

      if (
        exactProgress !== oldProgress ||
        exactStatus !== currentStatus
      ) {
        const { error: syncError } =
          await supabase
            .from("enrollments")
            .update({
              progress: exactProgress,
              status: exactStatus,

              completed_at:
                exactStatus ===
                "completed"
                  ? enrollmentData.completed_at ||
                    new Date().toISOString()
                  : null,
            })
            .eq(
              "id",
              String(enrollmentData.id)
            )
            .eq("user_id", user.id);

        if (syncError) {
          console.error(
            "تعذر مزامنة نسبة التقدم:",
            syncError
          );
        }
      }

      const firstIncompleteLesson =
        formattedLessons.find(
          (lesson) =>
            !completedIds.has(lesson.id)
        );

      const initialLesson =
        firstIncompleteLesson ||
        formattedLessons[
          formattedLessons.length - 1
        ];

      setUserId(user.id);

      setEnrollmentId(
        String(enrollmentData.id)
      );

      setEnrollmentStatus(exactStatus);

      setCourse(formattedCourse);
      setLessons(formattedLessons);

      setCompletedLessonIds(
        Array.from(completedIds)
      );

      setActiveLessonId(
        initialLesson.id
      );

      setIsLoading(false);
    };

    void loadCourse();

    return () => {
      isMounted = false;
    };
  }, [router, slug, supabase]);

  const completedSet = useMemo(
    () => new Set(completedLessonIds),
    [completedLessonIds]
  );

  const lessonSections =
    useMemo<LessonSection[]>(() => {
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
          title:
            lesson.section_title,

          position:
            lesson.section_position,

          lessons: [lesson],
        });
      });

      return Array.from(
        sectionsMap.values()
      ).sort(
        (firstSection, secondSection) =>
          firstSection.position -
          secondSection.position
      );
    }, [lessons]);

  const activeLessonIndex =
    lessons.findIndex(
      (lesson) =>
        lesson.id === activeLessonId
    );

  const currentLesson =
    activeLessonIndex >= 0
      ? lessons[activeLessonIndex]
      : lessons[0];

  const completedLessonsCount =
    completedLessonIds.length;

  const progressPercentage =
    calculateProgress(
      completedLessonsCount,
      lessons.length
    );

  const isCourseCompleted =
    lessons.length > 0 &&
    completedLessonsCount >=
      lessons.length &&
    enrollmentStatus === "completed";

  const openLesson = (
    lessonId: string
  ) => {
    setActiveLessonId(lessonId);
    setProgressError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const saveEnrollmentProgress = async (
    completedCount: number
  ) => {
    if (
      !userId ||
      !enrollmentId ||
      lessons.length === 0
    ) {
      return false;
    }

    const nextProgress =
      calculateProgress(
        completedCount,
        lessons.length
      );

    const nextStatus: EnrollmentStatus =
      completedCount >= lessons.length
        ? "completed"
        : "active";

    const { error } = await supabase
      .from("enrollments")
      .update({
        progress: nextProgress,
        status: nextStatus,

        completed_at:
          nextStatus === "completed"
            ? new Date().toISOString()
            : null,
      })
      .eq("id", enrollmentId)
      .eq("user_id", userId);

    if (error) {
      console.error(
        "تعذر تحديث نسبة الكورس:",
        error
      );

      setProgressError(
        "تم حفظ الدرس، لكن تعذر تحديث نسبة الكورس. اضغط مرة أخرى."
      );

      return false;
    }

    setEnrollmentStatus(nextStatus);

    return true;
  };

  const completeCurrentLesson =
    async () => {
      if (
        !currentLesson ||
        !userId ||
        isSavingProgress
      ) {
        return false;
      }

      setIsSavingProgress(true);
      setProgressError("");

      let nextCompletedIds =
        completedLessonIds;

      if (
        !completedSet.has(
          currentLesson.id
        )
      ) {
        const completedAt =
          new Date().toISOString();

        const { error: insertError } =
          await supabase
            .from("lesson_progress")
            .insert({
              user_id: userId,

              lesson_id:
                currentLesson.id,

              completed: true,
              completed_at: completedAt,
              last_watched_seconds: 0,
            });

        if (
          insertError &&
          insertError.code === "23505"
        ) {
          const { error: updateError } =
            await supabase
              .from("lesson_progress")
              .update({
                completed: true,
                completed_at:
                  completedAt,
              })
              .eq("user_id", userId)
              .eq(
                "lesson_id",
                currentLesson.id
              );

          if (updateError) {
            console.error(
              "تعذر تحديث تقدم الدرس:",
              updateError
            );

            setProgressError(
              "تعذر حفظ تقدم الدرس. حاول مرة أخرى."
            );

            setIsSavingProgress(false);
            return false;
          }
        } else if (insertError) {
          console.error(
            "تعذر حفظ تقدم الدرس:",
            insertError
          );

          setProgressError(
            "تعذر حفظ تقدم الدرس. حاول مرة أخرى."
          );

          setIsSavingProgress(false);
          return false;
        }

        nextCompletedIds = [
          ...completedLessonIds,
          currentLesson.id,
        ];

        setCompletedLessonIds(
          nextCompletedIds
        );
      }

      const enrollmentSaved =
        await saveEnrollmentProgress(
          nextCompletedIds.length
        );

      setIsSavingProgress(false);

      if (!enrollmentSaved) {
        return false;
      }

      router.refresh();

      return true;
    };

  const goToPreviousLesson = () => {
    if (
      isSavingProgress ||
      activeLessonIndex <= 0
    ) {
      return;
    }

    openLesson(
      lessons[
        activeLessonIndex - 1
      ].id
    );
  };

  const goToNextLesson = async () => {
    if (
      !currentLesson ||
      isSavingProgress
    ) {
      return;
    }

    const saved =
      await completeCurrentLesson();

    if (!saved) {
      return;
    }

    const isLastLesson =
      activeLessonIndex ===
      lessons.length - 1;

    if (!isLastLesson) {
      openLesson(
        lessons[
          activeLessonIndex + 1
        ].id
      );
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#09090B] text-white">
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center px-6">
          <div className="text-center">
            <LoaderCircle
              size={48}
              className="mx-auto animate-spin text-purple-400"
            />

            <p className="mt-5 font-bold text-zinc-300">
              جارٍ تحميل الكورس...
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (
    loadError ||
    !course ||
    !currentLesson
  ) {
    return (
      <main className="min-h-screen bg-[#09090B] text-white">
        <Navbar />

        <section className="flex min-h-[70vh] items-center justify-center px-6">
          <GlassCard
            hover={false}
            className="max-w-lg p-10 text-center"
          >
            <BookOpen
              size={48}
              className="mx-auto text-purple-400"
            />

            <h1 className="mt-6 text-3xl font-black">
              الكورس غير متاح
            </h1>

            <p className="mt-4 leading-7 text-zinc-400">
              {loadError}
            </p>

            <Link
              href="/courses"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 font-bold"
            >
              <ArrowRight size={18} />
              العودة إلى الكورسات
            </Link>
          </GlassCard>
        </section>
      </main>
    );
  }

  const formattedStudents =
    new Intl.NumberFormat(
      "en-US"
    ).format(course.students_count);

  const isLastLesson =
    activeLessonIndex ===
    lessons.length - 1;

  const isCurrentLessonCompleted =
    completedSet.has(currentLesson.id);

  const hasLessonFiles =
    Boolean(
      currentLesson.summary_file_url
    ) ||
    Boolean(
      currentLesson.resources_file_url
    );

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="border-b border-white/10 bg-[#0D0D14] px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href={`/courses/${course.slug}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-purple-400"
              >
                <ArrowRight size={17} />
                العودة إلى تفاصيل الكورس
              </Link>

              <h1 className="mt-3 text-xl font-black md:text-2xl">
                {course.title}
              </h1>
            </div>

            <div className="w-full max-w-md">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-zinc-400">
                  تقدمك في الكورس
                </span>

                <span className="font-bold text-purple-400">
                  {progressPercentage}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-purple-600 to-indigo-600 transition-all duration-500"
                  style={{
                    width: `${progressPercentage}%`,
                  }}
                />
              </div>

              <p className="mt-2 text-xs text-zinc-500">
                أكملت{" "}
                {completedLessonsCount} من{" "}
                {lessons.length} درس
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8 md:px-6">
        <div className="mx-auto grid max-w-[1500px] gap-8 xl:grid-cols-[1fr_390px]">
          <div className="min-w-0">
            <div className="relative aspect-video overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl shadow-purple-950/30">
              {currentLesson.video_url ? (
                <video
                  key={currentLesson.id}
                  controls
                  preload="metadata"
                  poster={course.image}
                  className="h-full w-full bg-black object-contain"
                >
                  <source
                    src={
                      currentLesson.video_url
                    }
                  />

                  متصفحك لا يدعم تشغيل
                  الفيديو.
                </video>
              ) : (
                <>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(147,51,234,0.18),transparent_55%)]" />

                  <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full border border-purple-400/40 bg-purple-600 text-white shadow-2xl shadow-purple-600/30">
                      <PlayCircle size={40} />
                    </div>

                    <p className="mt-6 text-sm font-semibold text-purple-300">
                      الدرس{" "}
                      {currentLesson.position}
                    </p>

                    <h2 className="mt-3 max-w-2xl text-2xl font-black md:text-4xl">
                      {currentLesson.title}
                    </h2>

                    <p className="mt-4 text-zinc-500">
                      لم تتم إضافة فيديو لهذا
                      الدرس حتى الآن.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={
                    goToPreviousLesson
                  }
                  disabled={
                    activeLessonIndex <= 0 ||
                    isSavingProgress
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-zinc-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight size={19} />
                  الدرس السابق
                </button>

                <div className="text-center">
                  <p className="text-sm text-zinc-500">
                    الدرس الحالي
                  </p>

                  <p className="mt-1 font-bold">
                    {activeLessonIndex + 1} من{" "}
                    {lessons.length}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={goToNextLesson}
                  disabled={
                    isSavingProgress ||
                    (isLastLesson &&
                      isCourseCompleted)
                  }
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    isLastLesson &&
                    isCourseCompleted
                      ? "bg-emerald-600"
                      : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:scale-105"
                  }`}
                >
                  {isSavingProgress ? (
                    <>
                      <LoaderCircle
                        size={19}
                        className="animate-spin"
                      />

                      جارٍ حفظ التقدم...
                    </>
                  ) : isLastLesson &&
                    isCourseCompleted ? (
                    <>
                      <CheckCircle2 size={19} />
                      تم إكمال الكورس
                    </>
                  ) : isLastLesson ? (
                    <>
                      إتمام الكورس
                      <Trophy size={19} />
                    </>
                  ) : (
                    <>
                      {isCurrentLessonCompleted
                        ? "الدرس التالي"
                        : "إكمال والانتقال"}

                      <ChevronLeft size={19} />
                    </>
                  )}
                </button>
              </div>

              {progressError && (
                <p
                  role="alert"
                  className="mt-4 text-center text-sm font-semibold text-red-400"
                >
                  {progressError}
                </p>
              )}
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-3">
              <GlassCard
                hover={false}
                className="p-6 lg:col-span-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <FileText size={21} />
                  </div>

                  <h2 className="text-xl font-black">
                    عن هذا الدرس
                  </h2>
                </div>

                <p className="mt-6 leading-8 text-zinc-400">
                  {currentLesson.description ||
                    course.description ||
                    `في هذا الدرس ستتعلم أحد المفاهيم الأساسية في ${course.category}.`}
                </p>

                <div className="mt-7 grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                    <Clock3
                      size={19}
                      className="text-purple-400"
                    />

                    <div>
                      <p className="text-xs text-zinc-500">
                        مدة الدرس
                      </p>

                      <p className="mt-1 font-bold">
                        {formatDuration(
                          currentLesson.duration_minutes
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                    <Award
                      size={19}
                      className="text-purple-400"
                    />

                    <div>
                      <p className="text-xs text-zinc-500">
                        مستوى الدرس
                      </p>

                      <p className="mt-1 font-bold">
                        مناسب للمبتدئين
                      </p>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <GlassCard
                hover={false}
                className="p-6"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Download size={21} />
                  </div>

                  <h2 className="text-xl font-black">
                    ملفات الدرس
                  </h2>
                </div>

                {hasLessonFiles ? (
                  <div className="mt-6 space-y-3">
                    {currentLesson.summary_file_url && (
                      <a
                        href={
                          currentLesson.summary_file_url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4 text-right transition hover:border-blue-500/40 hover:bg-blue-500/[0.06]"
                      >
                        <div>
                          <p className="font-bold">
                            ملخص الدرس
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            PDF
                          </p>
                        </div>

                        <FileText
                          size={19}
                          className="text-blue-400"
                        />
                      </a>
                    )}

                    {currentLesson.resources_file_url && (
                      <a
                        href={
                          currentLesson.resources_file_url
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4 text-right transition hover:border-orange-500/40 hover:bg-orange-500/[0.06]"
                      >
                        <div>
                          <p className="font-bold">
                            ملفات التطبيق
                          </p>

                          <p className="mt-1 text-xs text-zinc-500">
                            ZIP
                          </p>
                        </div>

                        <FileArchive
                          size={19}
                          className="text-orange-400"
                        />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-5 text-center text-sm leading-7 text-zinc-500">
                    لم تتم إضافة ملفات لهذا
                    الدرس حتى الآن.
                  </div>
                )}
              </GlassCard>
            </div>

            <GlassCard
              hover={false}
              className="mt-8 p-6 md:p-8"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-purple-400">
                    معلومات الكورس
                  </p>

                  <h2 className="mt-2 text-2xl font-black">
                    {course.title}
                  </h2>
                </div>

                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold transition hover:border-purple-500/50 hover:bg-purple-500/10"
                >
                  لوحة التحكم
                  <ArrowRight size={18} />
                </Link>
              </div>

              <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <Star
                    size={20}
                    className="fill-yellow-400 text-yellow-400"
                  />

                  <p className="mt-3 text-2xl font-black">
                    {course.rating}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    تقييم الكورس
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <Users
                    size={20}
                    className="text-purple-400"
                  />

                  <p className="mt-3 text-2xl font-black">
                    {formattedStudents}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    طالب مسجل
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <BookOpen
                    size={20}
                    className="text-purple-400"
                  />

                  <p className="mt-3 text-2xl font-black">
                    {lessons.length}
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    درس تعليمي
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <Trophy
                    size={20}
                    className="text-purple-400"
                  />

                  <p className="mt-3 text-2xl font-black">
                    شهادة
                  </p>

                  <p className="mt-1 text-sm text-zinc-500">
                    بعد إتمام الكورس
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>

          <aside className="h-fit xl:sticky xl:top-24">
            <GlassCard
              hover={false}
              className="overflow-hidden p-0"
            >
              <div className="border-b border-white/10 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <ListVideo
                      size={22}
                      className="text-purple-400"
                    />

                    <h2 className="text-xl font-black">
                      محتوى الكورس
                    </h2>
                  </div>

                  <span className="text-sm text-zinc-500">
                    {lessons.length} درس
                  </span>
                </div>
              </div>

              <div className="max-h-[720px] overflow-y-auto">
                {lessonSections.map(
                  (
                    section,
                    sectionIndex
                  ) => {
                    const containsActiveLesson =
                      section.lessons.some(
                        (lesson) =>
                          lesson.id ===
                          activeLessonId
                      );

                    return (
                      <details
                        key={`${section.position}-${section.title}`}
                        open={
                          sectionIndex ===
                            0 ||
                          containsActiveLesson
                        }
                        className="border-b border-white/10 last:border-0"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-white/[0.03] px-5 py-4 transition hover:bg-purple-500/[0.06]">
                          <div>
                            <p className="font-bold">
                              {section.title}
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              {
                                section
                                  .lessons
                                  .length
                              }{" "}
                              درس
                            </p>
                          </div>

                          <ChevronLeft
                            size={18}
                            className="text-zinc-500"
                          />
                        </summary>

                        <div className="p-2">
                          {section.lessons.map(
                            (lesson) => {
                              const isActive =
                                lesson.id ===
                                activeLessonId;

                              const isCompleted =
                                completedSet.has(
                                  lesson.id
                                );

                              return (
                                <button
                                  key={
                                    lesson.id
                                  }
                                  type="button"
                                  onClick={() =>
                                    openLesson(
                                      lesson.id
                                    )
                                  }
                                  className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-right transition ${
                                    isActive
                                      ? "bg-purple-500/15 text-white"
                                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                                  }`}
                                >
                                  <span
                                    className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                                      isCompleted
                                        ? "border-green-500/30 bg-green-500/10 text-green-400"
                                        : isActive
                                          ? "border-purple-500 bg-purple-600 text-white"
                                          : "border-white/10 bg-white/5 text-zinc-600"
                                    }`}
                                  >
                                    {isCompleted ? (
                                      <CheckCircle2
                                        size={
                                          15
                                        }
                                      />
                                    ) : isActive ? (
                                      <PlayCircle
                                        size={
                                          15
                                        }
                                      />
                                    ) : (
                                      <span className="text-xs">
                                        {
                                          lesson.position
                                        }
                                      </span>
                                    )}
                                  </span>

                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold">
                                      {
                                        lesson.title
                                      }
                                    </span>

                                    <span className="mt-1 flex items-center gap-1 text-xs text-zinc-600">
                                      <Clock3
                                        size={
                                          13
                                        }
                                      />

                                      {formatDuration(
                                        lesson.duration_minutes
                                      )}
                                    </span>
                                  </span>
                                </button>
                              );
                            }
                          )}
                        </div>
                      </details>
                    );
                  }
                )}
              </div>
            </GlassCard>
          </aside>
        </div>
      </section>
    </main>
  );
}
import Link from "next/link";
import {
  redirect,
} from "next/navigation";
import {
  revalidatePath,
} from "next/cache";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  Layers3,
  ListOrdered,
  PlayCircle,
  Plus,
  Save,
  ShieldCheck,
  Video,
} from "lucide-react";

import Navbar from "../../../../components/layout/Navbar";
import Footer from "../../../../components/layout/Footer";
import GlassCard from "../../../../components/ui/GlassCard";
import { createClient } from "../../../../lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    course?: string | string[];
    error?: string | string[];
  }>;
};

type CourseRecord = {
  id: string;
  slug: string;
  title: string;
  category: string;
  lessons_count: number;
};

type ExistingLessonRecord = {
  position: number;
  section_title: string;
  section_position: number;
};

type ExistingSection = {
  title: string;
  position: number;
  lessonsCount: number;
};

function getSingleParameter(
  value: string | string[] | undefined
) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getFormValue(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) ?? ""
  ).trim();
}

function redirectWithError(
  courseId: string,
  message: string
): never {
  redirect(
    `/admin/lessons/new?course=${encodeURIComponent(
      courseId
    )}&error=${encodeURIComponent(
      message
    )}`
  );
}

async function createLesson(
  courseId: string,
  formData: FormData
) {
  "use server";

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

  const title = getFormValue(
    formData,
    "title"
  );

  const description = getFormValue(
    formData,
    "description"
  );

  const sectionTitle = getFormValue(
    formData,
    "section_title"
  );

  const position = Number(
    getFormValue(
      formData,
      "position"
    )
  );

  const sectionPosition = Number(
    getFormValue(
      formData,
      "section_position"
    )
  );

  const durationMinutes = Number(
    getFormValue(
      formData,
      "duration_minutes"
    )
  );

  const isPreview =
    formData.get("is_preview") ===
    "on";

  const isPublished =
    formData.get("is_published") ===
    "on";

  if (
    !title ||
    !description ||
    !sectionTitle
  ) {
    redirectWithError(
      courseId,
      "اكتب اسم الدرس والقسم ووصف الدرس."
    );
  }

  if (
    !Number.isInteger(position) ||
    position < 1
  ) {
    redirectWithError(
      courseId,
      "ترتيب الدرس يجب أن يكون رقمًا صحيحًا أكبر من صفر."
    );
  }

  if (
    !Number.isInteger(
      sectionPosition
    ) ||
    sectionPosition < 1
  ) {
    redirectWithError(
      courseId,
      "ترتيب القسم يجب أن يكون رقمًا صحيحًا أكبر من صفر."
    );
  }

  if (
    !Number.isInteger(
      durationMinutes
    ) ||
    durationMinutes < 1
  ) {
    redirectWithError(
      courseId,
      "مدة الدرس يجب أن تكون دقيقة واحدة على الأقل."
    );
  }

  const {
    data: selectedCourse,
    error: courseError,
  } = await supabase
    .from("courses")
    .select("id, slug")
    .eq("id", courseId)
    .maybeSingle();

  if (
    courseError ||
    !selectedCourse
  ) {
    redirectWithError(
      courseId,
      "لم يتم العثور على الكورس المحدد."
    );
  }

  const {
    data: insertedLesson,
    error: insertError,
  } = await supabase
    .from("lessons")
    .insert({
      course_id: courseId,
      position,
      section_title: sectionTitle,
      section_position:
        sectionPosition,
      title,
      description,
      duration_minutes:
        durationMinutes,
      is_preview: isPreview,
      is_published: isPublished,
    })
    .select("id")
    .maybeSingle();

  if (insertError) {
    console.error(
      "تعذر إضافة الدرس:",
      insertError
    );

    if (
      insertError.code === "23505"
    ) {
      redirectWithError(
        courseId,
        "يوجد درس آخر بنفس الترتيب داخل هذا الكورس."
      );
    }

    redirectWithError(
      courseId,
      "تعذر إضافة الدرس. سنتأكد من صلاحيات جدول الدروس في الخطوة التالية."
    );
  }

  if (!insertedLesson) {
    redirectWithError(
      courseId,
      "لم تتم إضافة الدرس. حاول مرة أخرى."
    );
  }

  const {
    count: lessonsCount,
    error: countError,
  } = await supabase
    .from("lessons")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("course_id", courseId);

  if (!countError) {
    const { error: updateCountError } =
      await supabase
        .from("courses")
        .update({
          lessons_count:
            lessonsCount ?? 0,
        })
        .eq("id", courseId);

    if (updateCountError) {
      console.error(
        "تعذر تحديث عدد الدروس:",
        updateCountError
      );
    }
  }

  const courseSlug = String(
    selectedCourse.slug
  );

  revalidatePath("/admin");
  revalidatePath("/admin/courses");
  revalidatePath("/admin/lessons");

  revalidatePath(
    `/admin/courses/${courseId}`
  );

  revalidatePath("/courses");
  revalidatePath("/dashboard");

  revalidatePath(
    `/courses/${courseSlug}`
  );

  revalidatePath(
    `/learn/${courseSlug}`
  );

  redirect(
    `/admin/lessons?course=${encodeURIComponent(
      courseId
    )}`
  );
}

export default async function NewLessonPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams =
    await searchParams;

  const courseParameter =
    getSingleParameter(
      resolvedSearchParams.course
    );

  const errorMessage =
    getSingleParameter(
      resolvedSearchParams.error
    );

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
        lessons_count
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
          })
        );

  const selectedCourse =
    courses.find(
      (course) =>
        course.id === courseParameter
    ) ??
    courses[0] ??
    null;

  let existingLessons: ExistingLessonRecord[] =
    [];

  let lessonsQueryError = false;

  if (selectedCourse) {
    const {
      data: lessonsData,
      error: lessonsError,
    } = await supabase
      .from("lessons")
      .select(
        `
          position,
          section_title,
          section_position
        `
      )
      .eq(
        "course_id",
        selectedCourse.id
      )
      .order("position", {
        ascending: true,
      });

    if (lessonsError) {
      lessonsQueryError = true;

      console.error(
        "تعذر قراءة ترتيب الدروس:",
        lessonsError
      );
    } else {
      existingLessons = (
        lessonsData ?? []
      ).map((lesson) => ({
        position: Number(
          lesson.position
        ),

        section_title: String(
          lesson.section_title
        ),

        section_position: Number(
          lesson.section_position
        ),
      }));
    }
  }

  const nextLessonPosition =
    existingLessons.length > 0
      ? Math.max(
          ...existingLessons.map(
            (lesson) =>
              lesson.position
          )
        ) + 1
      : 1;

  const sectionsMap = new Map<
    string,
    ExistingSection
  >();

  existingLessons.forEach((lesson) => {
    const currentSection =
      sectionsMap.get(
        lesson.section_title
      );

    if (currentSection) {
      currentSection.lessonsCount += 1;

      currentSection.position =
        Math.min(
          currentSection.position,
          lesson.section_position
        );

      return;
    }

    sectionsMap.set(
      lesson.section_title,
      {
        title: lesson.section_title,

        position:
          lesson.section_position,

        lessonsCount: 1,
      }
    );
  });

  const existingSections = Array.from(
    sectionsMap.values()
  ).sort(
    (firstSection, secondSection) =>
      firstSection.position -
      secondSection.position
  );

  const lastSection =
    existingSections[
      existingSections.length - 1
    ];

  const defaultSectionTitle =
    lastSection?.title ??
    "المقدمة والتعريف بالكورس";

  const defaultSectionPosition =
    lastSection?.position ?? 1;

  const createLessonAction =
    selectedCourse
      ? createLesson.bind(
          null,
          selectedCourse.id
        )
      : null;

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-16">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            href={
              selectedCourse
                ? `/admin/lessons?course=${selectedCourse.id}`
                : "/admin/lessons"
            }
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-purple-400"
          >
            <ArrowRight size={17} />
            العودة إلى إدارة الدروس
          </Link>

          <div className="mt-7 flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
              <ShieldCheck size={31} />
            </div>

            <div>
              <p className="text-sm font-bold text-purple-400">
                لوحة الإدارة
              </p>

              <h1 className="mt-2 text-3xl font-black md:text-5xl">
                إضافة درس جديد
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                أضف بيانات الدرس وحدد القسم
                والترتيب وحالة النشر.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          {coursesError ? (
            <GlassCard
              hover={false}
              className="border-red-500/20 bg-red-500/[0.05] px-6 py-16 text-center"
            >
              <h2 className="text-2xl font-black text-red-300">
                تعذر تحميل الكورسات
              </h2>

              <p className="mt-3 text-zinc-400">
                حدث خطأ أثناء قراءة بيانات
                الكورسات.
              </p>
            </GlassCard>
          ) : !selectedCourse ||
            !createLessonAction ? (
            <GlassCard
              hover={false}
              className="px-6 py-16 text-center"
            >
              <BookOpen
                size={48}
                className="mx-auto text-purple-400"
              />

              <h2 className="mt-5 text-2xl font-black">
                لا توجد كورسات
              </h2>

              <p className="mt-3 text-zinc-400">
                أضف كورسًا أولًا قبل إضافة
                الدروس.
              </p>

              <Link
                href="/admin/courses/new"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black"
              >
                <Plus size={19} />
                إضافة كورس
              </Link>
            </GlassCard>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              <GlassCard
                hover={false}
                className="p-7 md:p-9"
              >
                <div>
                  <p className="text-sm font-bold text-purple-400">
                    الكورس المحدد
                  </p>

                  <h2 className="mt-2 text-2xl font-black md:text-3xl">
                    {selectedCourse.title}
                  </h2>

                  <p className="mt-3 text-sm text-zinc-500">
                    {selectedCourse.category}
                  </p>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="mt-7 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold leading-7 text-red-300"
                  >
                    {errorMessage}
                  </div>
                )}

                {lessonsQueryError && (
                  <div
                    role="alert"
                    className="mt-7 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-5 py-4 text-sm font-bold leading-7 text-orange-300"
                  >
                    تعذر قراءة الترتيب الحالي
                    للدروس. راجع الرقم قبل
                    الحفظ.
                  </div>
                )}

                <form
                  action={
                    createLessonAction
                  }
                  className="mt-8 space-y-7"
                >
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label
                        htmlFor="title"
                        className="mb-3 block text-sm font-bold text-zinc-300"
                      >
                        اسم الدرس
                        <span className="mr-1 text-red-400">
                          *
                        </span>
                      </label>

                      <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                        <Video
                          size={19}
                          className="shrink-0 text-zinc-600"
                        />

                        <input
                          id="title"
                          name="title"
                          type="text"
                          required
                          placeholder="مثال: مقدمة في تحليل البيانات"
                          className="w-full bg-transparent px-3 py-4 outline-none placeholder:text-zinc-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="position"
                        className="mb-3 block text-sm font-bold text-zinc-300"
                      >
                        ترتيب الدرس
                        <span className="mr-1 text-red-400">
                          *
                        </span>
                      </label>

                      <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                        <ListOrdered
                          size={19}
                          className="shrink-0 text-zinc-600"
                        />

                        <input
                          id="position"
                          name="position"
                          type="number"
                          min="1"
                          step="1"
                          required
                          defaultValue={
                            nextLessonPosition
                          }
                          className="w-full bg-transparent px-3 py-4 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="duration_minutes"
                        className="mb-3 block text-sm font-bold text-zinc-300"
                      >
                        مدة الدرس بالدقائق
                        <span className="mr-1 text-red-400">
                          *
                        </span>
                      </label>

                      <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                        <Clock3
                          size={19}
                          className="shrink-0 text-zinc-600"
                        />

                        <input
                          id="duration_minutes"
                          name="duration_minutes"
                          type="number"
                          min="1"
                          step="1"
                          required
                          defaultValue="10"
                          className="w-full bg-transparent px-3 py-4 outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="section_title"
                        className="mb-3 block text-sm font-bold text-zinc-300"
                      >
                        اسم القسم
                        <span className="mr-1 text-red-400">
                          *
                        </span>
                      </label>

                      <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                        <Layers3
                          size={19}
                          className="shrink-0 text-zinc-600"
                        />

                        <input
                          id="section_title"
                          name="section_title"
                          type="text"
                          required
                          list="existing-sections"
                          defaultValue={
                            defaultSectionTitle
                          }
                          className="w-full bg-transparent px-3 py-4 outline-none"
                        />

                        <datalist id="existing-sections">
                          {existingSections.map(
                            (section) => (
                              <option
                                key={`${section.position}-${section.title}`}
                                value={
                                  section.title
                                }
                              />
                            )
                          )}
                        </datalist>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="section_position"
                        className="mb-3 block text-sm font-bold text-zinc-300"
                      >
                        ترتيب القسم
                        <span className="mr-1 text-red-400">
                          *
                        </span>
                      </label>

                      <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                        <ListOrdered
                          size={19}
                          className="shrink-0 text-zinc-600"
                        />

                        <input
                          id="section_position"
                          name="section_position"
                          type="number"
                          min="1"
                          step="1"
                          required
                          defaultValue={
                            defaultSectionPosition
                          }
                          className="w-full bg-transparent px-3 py-4 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="mb-3 block text-sm font-bold text-zinc-300"
                    >
                      وصف الدرس
                      <span className="mr-1 text-red-400">
                        *
                      </span>
                    </label>

                    <textarea
                      id="description"
                      name="description"
                      required
                      rows={6}
                      placeholder="اكتب وصفًا مختصرًا يوضح ما سيتعلمه الطالب في هذا الدرس..."
                      className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-5 py-4 leading-8 outline-none transition placeholder:text-zinc-700 focus:border-purple-500/60"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-blue-500/40">
                      <input
                        type="checkbox"
                        name="is_preview"
                        className="mt-1 h-5 w-5 accent-blue-600"
                      />

                      <div>
                        <p className="flex items-center gap-2 font-black">
                          <PlayCircle
                            size={18}
                            className="text-blue-400"
                          />
                          معاينة مجانية
                        </p>

                        <p className="mt-2 text-sm leading-7 text-zinc-500">
                          يسمح بمشاهدة الدرس قبل
                          التسجيل في الكورس.
                        </p>
                      </div>
                    </label>

                    <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-purple-500/40">
                      <input
                        type="checkbox"
                        name="is_published"
                        defaultChecked
                        className="mt-1 h-5 w-5 accent-purple-600"
                      />

                      <div>
                        <p className="flex items-center gap-2 font-black">
                          <Eye
                            size={18}
                            className="text-purple-400"
                          />
                          نشر الدرس
                        </p>

                        <p className="mt-2 text-sm leading-7 text-zinc-500">
                          يظهر الدرس للطلاب داخل
                          صفحة التعلم.
                        </p>
                      </div>
                    </label>
                  </div>

                  <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-7 sm:flex-row sm:justify-end">
                    <Link
                      href={`/admin/lessons?course=${selectedCourse.id}`}
                      className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-7 py-4 font-bold text-zinc-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
                    >
                      إلغاء
                    </Link>

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] hover:brightness-110"
                    >
                      <Save size={20} />
                      حفظ الدرس
                    </button>
                  </div>
                </form>
              </GlassCard>

              <aside className="space-y-6">
                <GlassCard
                  hover={false}
                  className="border-purple-500/20 bg-purple-500/[0.05] p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <BookOpen size={24} />
                  </div>

                  <h2 className="mt-5 text-xl font-black">
                    الكورس المحدد
                  </h2>

                  <p className="mt-3 font-bold">
                    {selectedCourse.title}
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    عدد الدروس الحالي:{" "}
                    {existingLessons.length}
                  </p>

                  <Link
                    href="/admin/lessons"
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 font-bold text-purple-300 transition hover:bg-purple-500/20"
                  >
                    اختيار كورس آخر
                  </Link>
                </GlassCard>

                <GlassCard
                  hover={false}
                  className="p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                    <Layers3 size={24} />
                  </div>

                  <h2 className="mt-5 text-xl font-black">
                    الأقسام الموجودة
                  </h2>

                  {existingSections.length >
                  0 ? (
                    <div className="mt-5 space-y-3">
                      {existingSections.map(
                        (section) => (
                          <div
                            key={`${section.position}-${section.title}`}
                            className="rounded-xl border border-white/10 bg-black/20 p-4"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-sm font-bold">
                                {section.title}
                              </p>

                              <span className="rounded-full bg-purple-500/10 px-2 py-1 text-xs font-bold text-purple-400">
                                {section.position}
                              </span>
                            </div>

                            <p className="mt-2 text-xs text-zinc-600">
                              {section.lessonsCount}{" "}
                              درس
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="mt-5 flex items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
                      <CheckCircle2
                        size={18}
                        className="mt-1 shrink-0 text-emerald-400"
                      />

                      <p className="text-sm leading-7 text-zinc-400">
                        هذا أول درس في الكورس.
                        سيتم إنشاء القسم الأول
                        عند الحفظ.
                      </p>
                    </div>
                  )}
                </GlassCard>

                <GlassCard
                  hover={false}
                  className="p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                    <Video size={24} />
                  </div>

                  <h2 className="mt-5 text-xl font-black">
                    فيديو الدرس
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-zinc-400">
                    بعد إنشاء الدرس سنجهز صفحة
                    تعديله لإضافة رابط الفيديو
                    وملفات الدرس.
                  </p>
                </GlassCard>
              </aside>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
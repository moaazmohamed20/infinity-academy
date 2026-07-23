import Link from "next/link";
import {
  notFound,
  redirect,
} from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  Layers3,
  ListOrdered,
  PlayCircle,
  Save,
  ShieldCheck,
  Video,
} from "lucide-react";

import Navbar from "../../../../components/layout/Navbar";
import Footer from "../../../../components/layout/Footer";
import GlassCard from "../../../../components/ui/GlassCard";
import LessonContentUploader from "../../../../components/admin/LessonContentUploader";
import { createClient } from "../../../../lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string | string[];
    success?: string | string[];
  }>;
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
  video_url: string;
  summary_file_url: string;
  resources_file_url: string;
  is_preview: boolean;
  is_published: boolean;
};

type CourseRecord = {
  id: string;
  slug: string;
  title: string;
  category: string;
  lessons_count: number;
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
  lessonId: string,
  message: string
): never {
  redirect(
    `/admin/lessons/${lessonId}?error=${encodeURIComponent(
      message
    )}`
  );
}

async function updateLesson(
  lessonId: string,
  courseId: string,
  courseSlug: string,
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
      lessonId,
      "اكتب اسم الدرس والقسم ووصف الدرس."
    );
  }

  if (
    !Number.isInteger(position) ||
    position < 1
  ) {
    redirectWithError(
      lessonId,
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
      lessonId,
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
      lessonId,
      "مدة الدرس يجب أن تكون دقيقة واحدة على الأقل."
    );
  }

  const {
    data: updatedLesson,
    error: updateError,
  } = await supabase
    .from("lessons")
    .update({
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
    .eq("id", lessonId)
    .eq("course_id", courseId)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error(
      "تعذر تعديل الدرس:",
      updateError
    );

    if (
      updateError.code === "23505"
    ) {
      redirectWithError(
        lessonId,
        "يوجد درس آخر بنفس الترتيب داخل هذا الكورس."
      );
    }

    redirectWithError(
      lessonId,
      "تعذر حفظ تعديلات الدرس. حاول مرة أخرى."
    );
  }

  if (!updatedLesson) {
    redirectWithError(
      lessonId,
      "لم يتم العثور على الدرس أو لا تملك صلاحية تعديله."
    );
  }

  revalidatePath("/admin");
  revalidatePath("/admin/lessons");
  revalidatePath("/admin/courses");
  revalidatePath("/dashboard");

  revalidatePath(
    `/admin/lessons/${lessonId}`
  );

  revalidatePath(
    `/admin/courses/${courseId}`
  );

  revalidatePath(
    `/courses/${courseSlug}`
  );

  revalidatePath(
    `/learn/${courseSlug}`
  );

  redirect(
    `/admin/lessons/${lessonId}?success=1`
  );
}

export default async function EditLessonPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;

  const resolvedSearchParams =
    await searchParams;

  const errorMessage =
    getSingleParameter(
      resolvedSearchParams.error
    );

  const successMessage =
    getSingleParameter(
      resolvedSearchParams.success
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
    data: lessonData,
    error: lessonError,
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
        resources_file_url,
        is_preview,
        is_published
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (
    lessonError ||
    !lessonData
  ) {
    notFound();
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
        category,
        lessons_count
      `
    )
    .eq(
      "id",
      lessonData.course_id
    )
    .maybeSingle();

  if (
    courseError ||
    !courseData
  ) {
    notFound();
  }

  const lesson: LessonRecord = {
    id: String(lessonData.id),

    course_id: String(
      lessonData.course_id
    ),

    position: Number(
      lessonData.position
    ),

    section_title: String(
      lessonData.section_title
    ),

    section_position: Number(
      lessonData.section_position
    ),

    title: String(lessonData.title),

    description:
      lessonData.description === null
        ? ""
        : String(
            lessonData.description
          ),

    duration_minutes: Number(
      lessonData.duration_minutes
    ),

    video_url:
      lessonData.video_url === null
        ? ""
        : String(
            lessonData.video_url
          ),

    summary_file_url:
      lessonData.summary_file_url ===
      null
        ? ""
        : String(
            lessonData.summary_file_url
          ),

    resources_file_url:
      lessonData.resources_file_url ===
      null
        ? ""
        : String(
            lessonData.resources_file_url
          ),

    is_preview: Boolean(
      lessonData.is_preview
    ),

    is_published: Boolean(
      lessonData.is_published
    ),
  };

  const course: CourseRecord = {
    id: String(courseData.id),
    slug: String(courseData.slug),
    title: String(courseData.title),

    category: String(
      courseData.category
    ),

    lessons_count: Number(
      courseData.lessons_count
    ),
  };

  const updateLessonAction =
    updateLesson.bind(
      null,
      lesson.id,
      course.id,
      course.slug
    );

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-16">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            href={`/admin/lessons?course=${course.id}`}
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
                تعديل الدرس
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                عدّل بيانات الدرس وارفع الفيديو
                والملفات داخل التخزين الخاص.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_340px]">
          <GlassCard
            hover={false}
            className="p-7 md:p-9"
          >
            <div>
              <p className="text-sm font-bold text-purple-400">
                بيانات الدرس
              </p>

              <h2 className="mt-2 text-2xl font-black md:text-3xl">
                {lesson.title}
              </h2>

              <p className="mt-3 text-sm text-zinc-500">
                تابع لكورس: {course.title}
              </p>
            </div>

            {successMessage === "1" && (
              <div
                role="status"
                className="mt-7 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-300"
              >
                <CheckCircle2 size={20} />
                تم حفظ تعديلات الدرس بنجاح.
              </div>
            )}

            {errorMessage && (
              <div
                role="alert"
                className="mt-7 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold leading-7 text-red-300"
              >
                {errorMessage}
              </div>
            )}

            <form
              action={updateLessonAction}
              className="mt-8 space-y-8"
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
                      defaultValue={
                        lesson.title
                      }
                      className="w-full bg-transparent px-3 py-4 outline-none"
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
                        lesson.position
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
                      defaultValue={
                        lesson.duration_minutes
                      }
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
                      defaultValue={
                        lesson.section_title
                      }
                      className="w-full bg-transparent px-3 py-4 outline-none"
                    />
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
                        lesson.section_position
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
                  rows={6}
                  required
                  defaultValue={
                    lesson.description
                  }
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-5 py-4 leading-8 outline-none transition focus:border-purple-500/60"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-blue-500/40">
                  <input
                    type="checkbox"
                    name="is_preview"
                    defaultChecked={
                      lesson.is_preview
                    }
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
                    defaultChecked={
                      lesson.is_published
                    }
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
                  href={`/admin/lessons?course=${course.id}`}
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-7 py-4 font-bold text-zinc-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
                >
                  إلغاء
                </Link>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] hover:brightness-110"
                >
                  <Save size={20} />
                  حفظ التعديلات
                </button>
              </div>
            </form>

            <LessonContentUploader
              lessonId={lesson.id}
              courseId={course.id}
              initialContent={{
                video:
                  lesson.video_url ||
                  null,
                summary:
                  lesson.summary_file_url ||
                  null,
                resources:
                  lesson.resources_file_url ||
                  null,
              }}
            />
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
                الكورس
              </h2>

              <p className="mt-3 font-black">
                {course.title}
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                {course.category}
              </p>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="text-sm text-zinc-400">
                  عدد الدروس
                </span>

                <span className="font-black text-purple-400">
                  {course.lessons_count}
                </span>
              </div>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Video size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                حالة المحتوى
              </h2>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
                  <span className="text-sm text-zinc-400">
                    الفيديو
                  </span>

                  <span
                    className={`text-xs font-bold ${
                      lesson.video_url
                        ? "text-emerald-400"
                        : "text-zinc-600"
                    }`}
                  >
                    {lesson.video_url
                      ? "تمت إضافته"
                      : "غير مضاف"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
                  <span className="text-sm text-zinc-400">
                    ملخص الدرس
                  </span>

                  <span
                    className={`text-xs font-bold ${
                      lesson.summary_file_url
                        ? "text-emerald-400"
                        : "text-zinc-600"
                    }`}
                  >
                    {lesson.summary_file_url
                      ? "تمت إضافته"
                      : "غير مضاف"}
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
                  <span className="text-sm text-zinc-400">
                    ملفات التطبيق
                  </span>

                  <span
                    className={`text-xs font-bold ${
                      lesson.resources_file_url
                        ? "text-emerald-400"
                        : "text-zinc-600"
                    }`}
                  >
                    {lesson.resources_file_url
                      ? "تمت إضافته"
                      : "غير مضاف"}
                  </span>
                </div>
              </div>
            </GlassCard>

            <GlassCard
              hover={false}
              className="border-emerald-500/20 bg-emerald-500/[0.05] p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                حماية المحتوى
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                الملفات الجديدة تُحفظ داخل
                Bucket خاص، وتظهر للطالب من
                خلال روابط مؤقتة فقط.
              </p>
            </GlassCard>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}

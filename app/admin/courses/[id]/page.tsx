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
  ImageIcon,
  Save,
  ShieldCheck,
  Star,
  Tag,
  UserRound,
  Users,
} from "lucide-react";

import Navbar from "../../../../components/layout/Navbar";
import Footer from "../../../../components/layout/Footer";
import GlassCard from "../../../../components/ui/GlassCard";
import { createClient } from "../../../../lib/supabase/server";

type PageProps = {
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

type CourseRecord = {
  id: string;
  slug: string;
  title: string;
  instructor: string;
  category: string;
  description: string;
  image: string;
  rating: number;
  students_count: number;
  duration: string;
  lessons_count: number;
  is_published: boolean;
};

const categories = [
  "الذكاء الاصطناعي",
  "البرمجة",
  "اللغات",
  "التصميم",
  "التسويق الإلكتروني",
  "صناعة المحتوى",
  "إدارة الأعمال",
  "التصوير",
  "الإنتاج الموسيقي",
];

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
    `/admin/courses/${courseId}?error=${encodeURIComponent(
      message
    )}`
  );
}

async function updateCourse(
  courseId: string,
  oldSlug: string,
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

  const slug = getFormValue(
    formData,
    "slug"
  ).toLowerCase();

  const instructor = getFormValue(
    formData,
    "instructor"
  );

  const category = getFormValue(
    formData,
    "category"
  );

  const description = getFormValue(
    formData,
    "description"
  );

  const image = getFormValue(
    formData,
    "image"
  );

  const duration = getFormValue(
    formData,
    "duration"
  );

  const ratingValue = Number(
    getFormValue(formData, "rating")
  );

  const studentsCountValue = Number(
    getFormValue(
      formData,
      "students_count"
    )
  );

  const isPublished =
    formData.get("is_published") ===
    "on";

  if (
    !title ||
    !slug ||
    !instructor ||
    !category ||
    !description ||
    !image ||
    !duration
  ) {
    redirectWithError(
      courseId,
      "اكتب جميع بيانات الكورس المطلوبة."
    );
  }

  const slugPattern =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  if (!slugPattern.test(slug)) {
    redirectWithError(
      courseId,
      "رابط الكورس يجب أن يكون بالإنجليزية، مثل: data-science"
    );
  }

  if (
    !image.startsWith(
      "/images/courses/"
    )
  ) {
    redirectWithError(
      courseId,
      "مسار الصورة يجب أن يبدأ بـ /images/courses/"
    );
  }

  if (
    !Number.isFinite(ratingValue) ||
    ratingValue < 0 ||
    ratingValue > 5
  ) {
    redirectWithError(
      courseId,
      "التقييم يجب أن يكون رقمًا من 0 إلى 5."
    );
  }

  if (
    !Number.isInteger(
      studentsCountValue
    ) ||
    studentsCountValue < 0
  ) {
    redirectWithError(
      courseId,
      "عدد الطلاب يجب أن يكون رقمًا صحيحًا يساوي صفرًا أو أكثر."
    );
  }

  const {
    data: updatedCourse,
    error: updateError,
  } = await supabase
    .from("courses")
    .update({
      slug,
      title,
      instructor,
      category,
      description,
      image,
      rating: ratingValue,
      students_count:
        studentsCountValue,
      duration,
      is_published: isPublished,
    })
    .eq("id", courseId)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error(
      "تعذر تعديل الكورس:",
      updateError
    );

    if (
      updateError.code === "23505"
    ) {
      redirectWithError(
        courseId,
        "رابط الكورس مستخدم بالفعل. اختر رابطًا مختلفًا."
      );
    }

    redirectWithError(
      courseId,
      "تعذر حفظ التعديلات. حاول مرة أخرى."
    );
  }

  if (!updatedCourse) {
    redirectWithError(
      courseId,
      "لم يتم العثور على الكورس أو لا تملك صلاحية تعديله."
    );
  }

  revalidatePath("/admin/courses");

  revalidatePath(
    `/admin/courses/${courseId}`
  );

  revalidatePath("/courses");
  revalidatePath("/dashboard");
  revalidatePath("/");

  revalidatePath(
    `/courses/${oldSlug}`
  );

  revalidatePath(
    `/courses/${slug}`
  );

  revalidatePath(
    `/learn/${oldSlug}`
  );

  revalidatePath(
    `/learn/${slug}`
  );

  redirect(
    `/admin/courses/${courseId}?success=1`
  );
}

export default async function EditCoursePage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;

  const { error, success } =
    await searchParams;

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
        lessons_count,
        is_published
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (courseError || !courseData) {
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
        ? ""
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

    is_published: Boolean(
      courseData.is_published
    ),
  };

  const availableCategories =
    categories.includes(course.category)
      ? categories
      : [
          course.category,
          ...categories,
        ];

  const updateCourseAction =
    updateCourse.bind(
      null,
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
            href="/admin/courses"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-purple-400"
          >
            <ArrowRight size={17} />
            العودة إلى إدارة الكورسات
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
                تعديل الكورس
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                عدّل بيانات الكورس وحالة نشره
                ثم احفظ التغييرات.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_330px]">
          <GlassCard
            hover={false}
            className="p-7 md:p-9"
          >
            <div>
              <p className="text-sm font-bold text-purple-400">
                بيانات الكورس
              </p>

              <h2 className="mt-2 text-2xl font-black md:text-3xl">
                {course.title}
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-500">
                يمكنك تعديل جميع البيانات
                الأساسية باستثناء عدد الدروس،
                لأنه يتغير عند إدارة الدروس.
              </p>
            </div>

            {success === "1" && (
              <div
                role="status"
                className="mt-7 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-300"
              >
                <CheckCircle2 size={20} />
                تم حفظ تعديلات الكورس بنجاح.
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-7 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold leading-7 text-red-300"
              >
                {error}
              </div>
            )}

            <form
              action={updateCourseAction}
              className="mt-8 space-y-7"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="title"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    اسم الكورس
                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                    <BookOpen
                      size={19}
                      className="shrink-0 text-zinc-600"
                    />

                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      defaultValue={
                        course.title
                      }
                      className="w-full bg-transparent px-3 py-4 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="slug"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    رابط الكورس
                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <div
                    dir="ltr"
                    className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60"
                  >
                    <Tag
                      size={19}
                      className="shrink-0 text-zinc-600"
                    />

                    <input
                      id="slug"
                      name="slug"
                      type="text"
                      required
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      defaultValue={
                        course.slug
                      }
                      className="w-full bg-transparent px-3 py-4 text-left outline-none"
                    />
                  </div>

                  <p className="mt-2 text-xs leading-6 text-zinc-600">
                    تغيير الرابط سيغيّر رابط
                    صفحة الكورس.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="instructor"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    اسم مقدم الكورس
                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                    <UserRound
                      size={19}
                      className="shrink-0 text-zinc-600"
                    />

                    <input
                      id="instructor"
                      name="instructor"
                      type="text"
                      required
                      defaultValue={
                        course.instructor
                      }
                      className="w-full bg-transparent px-3 py-4 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="category"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    التصنيف
                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <select
                    id="category"
                    name="category"
                    required
                    defaultValue={
                      course.category
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111114] px-4 py-4 text-white outline-none transition focus:border-purple-500/60"
                  >
                    {availableCategories.map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="duration"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    مدة الكورس
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
                      id="duration"
                      name="duration"
                      type="text"
                      required
                      defaultValue={
                        course.duration
                      }
                      className="w-full bg-transparent px-3 py-4 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="image"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    مسار صورة الكورس
                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <div
                    dir="ltr"
                    className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60"
                  >
                    <ImageIcon
                      size={19}
                      className="shrink-0 text-zinc-600"
                    />

                    <input
                      id="image"
                      name="image"
                      type="text"
                      required
                      defaultValue={
                        course.image
                      }
                      className="w-full bg-transparent px-3 py-4 text-left outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="rating"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    تقييم الكورس
                  </label>

                  <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                    <Star
                      size={19}
                      className="shrink-0 fill-yellow-400 text-yellow-400"
                    />

                    <input
                      id="rating"
                      name="rating"
                      type="number"
                      min="0"
                      max="5"
                      step="0.1"
                      required
                      defaultValue={
                        course.rating
                      }
                      className="w-full bg-transparent px-3 py-4 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="students_count"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    عدد الطلاب المعروض
                  </label>

                  <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                    <Users
                      size={19}
                      className="shrink-0 text-zinc-600"
                    />

                    <input
                      id="students_count"
                      name="students_count"
                      type="number"
                      min="0"
                      step="1"
                      required
                      defaultValue={
                        course.students_count
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
                  وصف الكورس
                  <span className="mr-1 text-red-400">
                    *
                  </span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  required
                  rows={6}
                  defaultValue={
                    course.description
                  }
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-5 py-4 leading-8 outline-none transition focus:border-purple-500/60"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-purple-500/40">
                <input
                  type="checkbox"
                  name="is_published"
                  defaultChecked={
                    course.is_published
                  }
                  className="mt-1 h-5 w-5 accent-purple-600"
                />

                <div>
                  <p className="font-black">
                    الكورس منشور للطلاب
                  </p>

                  <p className="mt-2 text-sm leading-7 text-zinc-500">
                    ألغِ التفعيل لإخفاء الكورس
                    عن صفحات الطلاب.
                  </p>
                </div>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-7 sm:flex-row sm:justify-end">
                <Link
                  href="/admin/courses"
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
          </GlassCard>

          <aside className="space-y-6">
            <GlassCard
              hover={false}
              className="border-purple-500/20 bg-purple-500/[0.05] p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Eye size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                حالة الكورس
              </h2>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
                <span className="text-sm text-zinc-400">
                  حالة النشر
                </span>

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

              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 p-4">
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
                <BookOpen size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                إدارة المحتوى
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                بعد حفظ بيانات الكورس يمكنك
                إضافة الدروس والفيديوهات
                والملفات.
              </p>

              <Link
                href={`/admin/lessons?course=${course.id}`}
                className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 px-5 py-3 font-bold text-purple-300 transition hover:bg-purple-500/20"
              >
                إدارة دروس الكورس
              </Link>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
                <Star size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                معاينة الكورس
              </h2>

              <Link
                href={`/courses/${course.slug}`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold transition hover:border-purple-500/50 hover:bg-purple-500/10"
              >
                فتح صفحة الكورس
              </Link>
            </GlassCard>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
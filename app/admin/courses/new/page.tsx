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
  ImageIcon,
  Save,
  ShieldCheck,
  Tag,
  UserRound,
} from "lucide-react";

import Navbar from "../../../../components/layout/Navbar";
import Footer from "../../../../components/layout/Footer";
import GlassCard from "../../../../components/ui/GlassCard";
import { createClient } from "../../../../lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
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
  message: string
): never {
  redirect(
    `/admin/courses/new?error=${encodeURIComponent(
      message
    )}`
  );
}

async function createCourse(
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
      "اكتب جميع بيانات الكورس المطلوبة."
    );
  }

  const slugPattern =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  if (!slugPattern.test(slug)) {
    redirectWithError(
      "رابط الكورس يجب أن يكون بالإنجليزية، مثل: data-science"
    );
  }

  if (
    !image.startsWith(
      "/images/courses/"
    )
  ) {
    redirectWithError(
      "مسار الصورة يجب أن يبدأ بـ /images/courses/"
    );
  }

  const { error: insertError } =
    await supabase
      .from("courses")
      .insert({
        slug,
        title,
        instructor,
        category,
        description,
        image,
        rating: 0,
        students_count: 0,
        duration,
        lessons_count: 0,
        is_published: isPublished,
      });

  if (insertError) {
    console.error(
      "تعذر إضافة الكورس:",
      insertError
    );

    if (
      insertError.code === "23505"
    ) {
      redirectWithError(
        "رابط الكورس مستخدم بالفعل. اختر رابطًا مختلفًا."
      );
    }

    redirectWithError(
      "تعذر إضافة الكورس. سنتأكد من صلاحيات المدير في الخطوة التالية."
    );
  }

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  revalidatePath("/");

  redirect("/admin/courses");
}

export default async function NewCoursePage({
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

  const { error } =
    await searchParams;

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
                إضافة كورس جديد
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                أدخل بيانات الكورس الأساسية،
                وبعد إنشائه سنضيف الدروس
                والفيديوهات والملفات.
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
                المعلومات الأساسية
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-500">
                الحقول المكتوب بجوارها مطلوب
                يجب إدخالها قبل الحفظ.
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-7 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold leading-7 text-red-300"
              >
                {error}
              </div>
            )}

            <form
              action={createCourse}
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
                      placeholder="مثال: احتراف تحليل البيانات"
                      className="w-full bg-transparent px-3 py-4 outline-none placeholder:text-zinc-700"
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
                      placeholder="data-analysis"
                      className="w-full bg-transparent px-3 py-4 text-left outline-none placeholder:text-zinc-700"
                    />
                  </div>

                  <p className="mt-2 text-xs leading-6 text-zinc-600">
                    حروف إنجليزية صغيرة وأرقام
                    وشرطة فقط.
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
                      defaultValue="Infinity Academy"
                      placeholder="اسم مقدم الكورس"
                      className="w-full bg-transparent px-3 py-4 outline-none placeholder:text-zinc-700"
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
                    defaultValue=""
                    className="w-full rounded-xl border border-white/10 bg-[#111114] px-4 py-4 text-white outline-none transition focus:border-purple-500/60"
                  >
                    <option
                      value=""
                      disabled
                    >
                      اختر تصنيف الكورس
                    </option>

                    {categories.map(
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
                      placeholder="مثال: 30 ساعة"
                      className="w-full bg-transparent px-3 py-4 outline-none placeholder:text-zinc-700"
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
                      placeholder="/images/courses/data-analysis.jpg"
                      className="w-full bg-transparent px-3 py-4 text-left outline-none placeholder:text-zinc-700"
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
                  placeholder="اكتب وصفًا واضحًا يشرح محتوى الكورس وما سيتعلمه الطالب..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-5 py-4 leading-8 outline-none transition placeholder:text-zinc-700 focus:border-purple-500/60"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-purple-500/40">
                <input
                  type="checkbox"
                  name="is_published"
                  className="mt-1 h-5 w-5 accent-purple-600"
                />

                <div>
                  <p className="font-black">
                    نشر الكورس مباشرة
                  </p>

                  <p className="mt-2 text-sm leading-7 text-zinc-500">
                    عند تفعيل هذا الاختيار سيظهر
                    الكورس للطلاب بعد حفظه.
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
                  حفظ الكورس
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
                <CheckCircle2 size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                بعد إضافة الكورس
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-400">
                <p>
                  1. سنفتح صفحة تعديل بيانات
                  الكورس.
                </p>

                <p>
                  2. سنضيف الدروس ونرتب
                  الأقسام.
                </p>

                <p>
                  3. سنضيف روابط الفيديوهات
                  والملفات.
                </p>
              </div>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <ImageIcon size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                صورة الكورس
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                ضع الصورة داخل:
              </p>

              <code
                dir="ltr"
                className="mt-4 block overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-4 text-left text-xs text-purple-300"
              >
                public/images/courses/
              </code>

              <p className="mt-4 text-sm leading-7 text-zinc-500">
                واكتب مسارها في النموذج بداية من
                /images/courses/
              </p>
            </GlassCard>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
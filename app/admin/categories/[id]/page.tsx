import Link from "next/link";
import {
  redirect,
} from "next/navigation";
import {
  revalidatePath,
} from "next/cache";

import type {
  LucideIcon,
} from "lucide-react";

import {
  ArrowRight,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  Camera,
  CheckCircle2,
  Clapperboard,
  Code2,
  Eye,
  GraduationCap,
  Languages,
  Laptop,
  ListOrdered,
  Music4,
  Palette,
  Save,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Tags,
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

type CategoryRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  icon_key: string;
  sort_order: number;
  is_published: boolean;
};

const iconOptions = [
  {
    value: "Code2",
    label: "البرمجة",
    icon: Code2,
  },
  {
    value: "Languages",
    label: "اللغات",
    icon: Languages,
  },
  {
    value: "Music4",
    label: "الإنتاج الموسيقي",
    icon: Music4,
  },
  {
    value: "Palette",
    label: "التصميم",
    icon: Palette,
  },
  {
    value: "Brain",
    label: "الذكاء الاصطناعي",
    icon: Brain,
  },
  {
    value: "Briefcase",
    label: "إدارة الأعمال",
    icon: Briefcase,
  },
  {
    value: "Camera",
    label: "التصوير",
    icon: Camera,
  },
  {
    value: "Clapperboard",
    label: "المونتاج",
    icon: Clapperboard,
  },
  {
    value: "ShoppingCart",
    label: "التجارة الإلكترونية",
    icon: ShoppingCart,
  },
  {
    value: "Building2",
    label: "التسويق العقاري",
    icon: Building2,
  },
  {
    value: "Laptop",
    label: "صناعة المحتوى",
    icon: Laptop,
  },
  {
    value: "GraduationCap",
    label: "التطوير الشخصي",
    icon: GraduationCap,
  },
  {
    value: "BookOpen",
    label: "تعليم عام",
    icon: BookOpen,
  },
];

const iconMap: Record<
  string,
  LucideIcon
> = Object.fromEntries(
  iconOptions.map((option) => [
    option.value,
    option.icon,
  ])
);

function getFormValue(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) ?? ""
  ).trim();
}

function redirectWithMessage(
  categoryId: string,
  type: "error" | "success",
  message: string
): never {
  redirect(
    `/admin/categories/${encodeURIComponent(
      categoryId
    )}?${type}=${encodeURIComponent(
      message
    )}`
  );
}

async function requireAdmin() {
  const supabase =
    await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } =
    await supabase.auth.getClaims();

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

  return supabase;
}

async function updateCategory(
  formData: FormData
) {
  "use server";

  const supabase =
    await requireAdmin();

  const categoryId =
    getFormValue(
      formData,
      "category_id"
    );

  const title =
    getFormValue(
      formData,
      "title"
    );

  const slug =
    getFormValue(
      formData,
      "slug"
    ).toLowerCase();

  const description =
    getFormValue(
      formData,
      "description"
    );

  const iconKey =
    getFormValue(
      formData,
      "icon_key"
    );

  const sortOrderValue =
    getFormValue(
      formData,
      "sort_order"
    );

  const sortOrder =
    Number(sortOrderValue);

  const isPublished =
    formData.get(
      "is_published"
    ) === "on";

  if (!categoryId) {
    redirect(
      "/admin/categories?error=" +
        encodeURIComponent(
          "لم يتم العثور على التصنيف."
        )
    );
  }

  if (
    !title ||
    !slug ||
    !description ||
    !iconKey ||
    !sortOrderValue
  ) {
    redirectWithMessage(
      categoryId,
      "error",
      "اكتب جميع بيانات التصنيف المطلوبة."
    );
  }

  const slugPattern =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  if (
    !slugPattern.test(slug)
  ) {
    redirectWithMessage(
      categoryId,
      "error",
      "رابط التصنيف يجب أن يكون بالإنجليزية، مثل: web-development"
    );
  }

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    redirectWithMessage(
      categoryId,
      "error",
      "ترتيب التصنيف يجب أن يكون رقمًا صحيحًا يبدأ من صفر."
    );
  }

  const validIcon =
    iconOptions.some(
      (option) =>
        option.value === iconKey
    );

  if (!validIcon) {
    redirectWithMessage(
      categoryId,
      "error",
      "اختر أيقونة صحيحة للتصنيف."
    );
  }

  const {
    data: currentCategoryData,
    error: currentCategoryError,
  } = await supabase
    .from("categories")
    .select(
      `
        id,
        slug,
        title,
        description,
        icon_key,
        sort_order,
        is_published
      `
    )
    .eq("id", categoryId)
    .maybeSingle();

  if (
    currentCategoryError ||
    !currentCategoryData
  ) {
    redirect(
      "/admin/categories?error=" +
        encodeURIComponent(
          "تعذر العثور على التصنيف المطلوب."
        )
    );
  }

  const currentCategory: CategoryRecord =
    {
      id: String(
        currentCategoryData.id
      ),

      slug: String(
        currentCategoryData.slug
      ),

      title: String(
        currentCategoryData.title
      ),

      description:
        currentCategoryData.description ===
        null
          ? null
          : String(
              currentCategoryData.description
            ),

      icon_key: String(
        currentCategoryData.icon_key
      ),

      sort_order: Number(
        currentCategoryData.sort_order
      ),

      is_published: Boolean(
        currentCategoryData.is_published
      ),
    };

  const {
    error: updateError,
  } = await supabase
    .from("categories")
    .update({
      title,
      slug,
      description,
      icon_key: iconKey,
      sort_order: sortOrder,
      is_published:
        isPublished,
    })
    .eq("id", categoryId);

  if (updateError) {
    console.error(
      "تعذر تعديل التصنيف:",
      updateError
    );

    if (
      updateError.code === "23505"
    ) {
      redirectWithMessage(
        categoryId,
        "error",
        "اسم التصنيف أو رابطه مستخدم بالفعل."
      );
    }

    redirectWithMessage(
      categoryId,
      "error",
      "تعذر تعديل التصنيف. حاول مرة أخرى."
    );
  }

  /*
   * الكورسات تحفظ اسم التصنيف كنص.
   * عند تغيير الاسم نحدّث الكورسات
   * المرتبطة تلقائيًا.
   */
  if (
    currentCategory.title !== title
  ) {
    const {
      error: coursesUpdateError,
    } = await supabase
      .from("courses")
      .update({
        category: title,
      })
      .eq(
        "category",
        currentCategory.title
      );

    if (coursesUpdateError) {
      console.error(
        "تعذر تحديث تصنيف الكورسات:",
        coursesUpdateError
      );

      /*
       * إعادة بيانات التصنيف القديمة
       * عند فشل تحديث الكورسات.
       */
      const {
        error: rollbackError,
      } = await supabase
        .from("categories")
        .update({
          title:
            currentCategory.title,

          slug:
            currentCategory.slug,

          description:
            currentCategory.description,

          icon_key:
            currentCategory.icon_key,

          sort_order:
            currentCategory.sort_order,

          is_published:
            currentCategory.is_published,
        })
        .eq("id", categoryId);

      if (rollbackError) {
        console.error(
          "تعذر التراجع عن تعديل التصنيف:",
          rollbackError
        );
      }

      redirectWithMessage(
        categoryId,
        "error",
        "تعذر تحديث الكورسات المرتبطة بالتصنيف."
      );
    }
  }

  revalidatePath(
    "/admin/categories"
  );

  revalidatePath(
    `/admin/categories/${categoryId}`
  );

  revalidatePath(
    "/admin/courses"
  );

  revalidatePath(
    "/admin/courses/new"
  );

  revalidatePath(
    "/categories"
  );

  revalidatePath(
    "/courses"
  );

  revalidatePath("/");
  
  redirectWithMessage(
    categoryId,
    "success",
    "تم تعديل التصنيف بنجاح."
  );
}

export default async function EditCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const supabase =
    await requireAdmin();

  const {
    id: categoryId,
  } = await params;

  const {
    error,
    success,
  } = await searchParams;

  const {
    data: categoryData,
    error: categoryError,
  } = await supabase
    .from("categories")
    .select(
      `
        id,
        slug,
        title,
        description,
        icon_key,
        sort_order,
        is_published
      `
    )
    .eq("id", categoryId)
    .maybeSingle();

  if (
    categoryError ||
    !categoryData
  ) {
    redirect(
      "/admin/categories?error=" +
        encodeURIComponent(
          "تعذر العثور على التصنيف المطلوب."
        )
    );
  }

  const category: CategoryRecord =
    {
      id: String(
        categoryData.id
      ),

      slug: String(
        categoryData.slug
      ),

      title: String(
        categoryData.title
      ),

      description:
        categoryData.description ===
        null
          ? null
          : String(
              categoryData.description
            ),

      icon_key: String(
        categoryData.icon_key
      ),

      sort_order: Number(
        categoryData.sort_order
      ),

      is_published: Boolean(
        categoryData.is_published
      ),
    };

  const {
    count: linkedCoursesCount,
    error: linkedCoursesError,
  } = await supabase
    .from("courses")
    .select(
      "id",
      {
        count: "exact",
        head: true,
      }
    )
    .eq(
      "category",
      category.title
    );

  const courseCount =
    linkedCoursesError
      ? 0
      : linkedCoursesCount ?? 0;

  const CurrentIcon =
    iconMap[
      category.icon_key
    ] ?? BookOpen;

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-16">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-purple-400"
          >
            <ArrowRight size={17} />
            العودة إلى إدارة التصنيفات
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
                تعديل التصنيف
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                عدّل بيانات التصنيف وترتيبه
                وحالة ظهوره داخل المنصة.
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
                بيانات التصنيف
              </p>

              <h2 className="mt-2 text-2xl font-black md:text-3xl">
                المعلومات الأساسية
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-500">
                يمكنك تعديل البيانات ثم الضغط
                على حفظ التعديلات.
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

            {success && (
              <div
                role="status"
                className="mt-7 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-bold leading-7 text-emerald-300"
              >
                {success}
              </div>
            )}

            <form
              action={updateCategory}
              className="mt-8 space-y-7"
            >
              <input
                type="hidden"
                name="category_id"
                value={category.id}
              />

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="title"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    اسم التصنيف
                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                    <Tags
                      size={19}
                      className="shrink-0 text-zinc-600"
                    />

                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      defaultValue={
                        category.title
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
                    رابط التصنيف
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
                        category.slug
                      }
                      className="w-full bg-transparent px-3 py-4 text-left outline-none"
                    />
                  </div>

                  <p className="mt-2 text-xs leading-6 text-zinc-600">
                    حروف إنجليزية صغيرة وأرقام
                    وشرطة فقط.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="icon_key"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    أيقونة التصنيف
                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <select
                    id="icon_key"
                    name="icon_key"
                    required
                    defaultValue={
                      category.icon_key
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111114] px-4 py-4 text-white outline-none transition focus:border-purple-500/60"
                  >
                    {iconOptions.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="sort_order"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    ترتيب التصنيف
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
                      id="sort_order"
                      name="sort_order"
                      type="number"
                      required
                      min="0"
                      step="1"
                      defaultValue={
                        category.sort_order
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
                  وصف التصنيف
                  <span className="mr-1 text-red-400">
                    *
                  </span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  defaultValue={
                    category.description ?? ""
                  }
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-5 py-4 leading-8 outline-none transition focus:border-purple-500/60"
                />
              </div>

              <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-purple-500/40">
                <input
                  type="checkbox"
                  name="is_published"
                  defaultChecked={
                    category.is_published
                  }
                  className="mt-1 h-5 w-5 accent-purple-600"
                />

                <div>
                  <p className="font-black">
                    نشر التصنيف
                  </p>

                  <p className="mt-2 text-sm leading-7 text-zinc-500">
                    عند إلغاء الاختيار سيختفي
                    التصنيف من صفحات الطلاب.
                  </p>
                </div>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-7 sm:flex-row sm:justify-end">
                <Link
                  href="/admin/categories"
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
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                <CurrentIcon size={28} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                {category.title}
              </h2>

              <p
                dir="ltr"
                className="mt-3 overflow-x-auto text-left text-sm text-purple-300"
              >
                {category.slug}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                  <p className="text-xs text-zinc-500">
                    الكورسات
                  </p>

                  <p className="mt-2 text-2xl font-black">
                    {courseCount}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                  <p className="text-xs text-zinc-500">
                    الحالة
                  </p>

                  <p className="mt-2 text-sm font-black text-purple-300">
                    {category.is_published
                      ? "منشور"
                      : "مخفي"}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                الكورسات المرتبطة
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                عند تغيير اسم التصنيف سيتم
                تحديث اسم التصنيف داخل
                الكورسات المرتبطة تلقائيًا.
              </p>

              <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-black/30 p-4">
                <span className="text-sm text-zinc-500">
                  عدد الكورسات
                </span>

                <span className="text-xl font-black text-emerald-300">
                  {courseCount}
                </span>
              </div>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Eye size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                حالة الظهور
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                التصنيف المخفي يظل موجودًا
                داخل لوحة الإدارة ولكنه لا
                يظهر للطلاب.
              </p>
            </GlassCard>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
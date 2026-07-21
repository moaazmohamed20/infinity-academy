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
  Clapperboard,
  Code2,
  Eye,
  EyeOff,
  GraduationCap,
  Languages,
  Laptop,
  Layers3,
  Music4,
  Palette,
  Pencil,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Trash2,
} from "lucide-react";

import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import GlassCard from "../../../components/ui/GlassCard";
import { createClient } from "../../../lib/supabase/server";

type PageProps = {
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
  created_at: string;
};

const iconMap: Record<
  string,
  LucideIcon
> = {
  Code2,
  Languages,
  Music4,
  Palette,
  Brain,
  Briefcase,
  Camera,
  Clapperboard,
  ShoppingCart,
  Building2,
  Laptop,
  GraduationCap,
  BookOpen,
};

function getFormValue(
  formData: FormData,
  fieldName: string
) {
  return String(
    formData.get(fieldName) ?? ""
  ).trim();
}

function redirectWithMessage(
  type: "error" | "success",
  message: string
): never {
  redirect(
    `/admin/categories?${type}=${encodeURIComponent(
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

async function toggleCategoryStatus(
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

  const currentStatus =
    getFormValue(
      formData,
      "current_status"
    ) === "true";

  if (!categoryId) {
    redirectWithMessage(
      "error",
      "لم يتم العثور على التصنيف."
    );
  }

  const {
    error: updateError,
  } = await supabase
    .from("categories")
    .update({
      is_published:
        !currentStatus,
    })
    .eq("id", categoryId);

  if (updateError) {
    console.error(
      "تعذر تحديث التصنيف:",
      updateError
    );

    redirectWithMessage(
      "error",
      "تعذر تحديث حالة التصنيف."
    );
  }

  revalidatePath(
    "/admin/categories"
  );

  revalidatePath("/categories");
  revalidatePath("/");
  revalidatePath("/courses");

  redirectWithMessage(
    "success",
    currentStatus
      ? "تم إخفاء التصنيف بنجاح."
      : "تم نشر التصنيف بنجاح."
  );
}

async function deleteCategory(
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

  const categoryTitle =
    getFormValue(
      formData,
      "category_title"
    );

  if (
    !categoryId ||
    !categoryTitle
  ) {
    redirectWithMessage(
      "error",
      "بيانات التصنيف غير مكتملة."
    );
  }

  /*
   * منع حذف التصنيف لو فيه
   * كورسات مرتبطة به.
   */
  const {
    data: linkedCourses,
    error: coursesError,
  } = await supabase
    .from("courses")
    .select("id")
    .eq(
      "category",
      categoryTitle
    )
    .limit(1);

  if (coursesError) {
    console.error(
      "تعذر فحص كورسات التصنيف:",
      coursesError
    );

    redirectWithMessage(
      "error",
      "تعذر فحص الكورسات المرتبطة بالتصنيف."
    );
  }

  if (
    linkedCourses &&
    linkedCourses.length > 0
  ) {
    redirectWithMessage(
      "error",
      "لا يمكن حذف التصنيف لأنه مستخدم داخل كورس واحد أو أكثر."
    );
  }

  const {
    error: deleteError,
  } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (deleteError) {
    console.error(
      "تعذر حذف التصنيف:",
      deleteError
    );

    redirectWithMessage(
      "error",
      "تعذر حذف التصنيف."
    );
  }

  revalidatePath(
    "/admin/categories"
  );

  revalidatePath("/categories");
  revalidatePath("/");
  revalidatePath("/courses");

  redirectWithMessage(
    "success",
    "تم حذف التصنيف بنجاح."
  );
}

export default async function AdminCategoriesPage({
  searchParams,
}: PageProps) {
  const supabase =
    await requireAdmin();

  const {
    error,
    success,
  } = await searchParams;

  const {
    data: categoriesData,
    error: categoriesError,
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
        is_published,
        created_at
      `
    )
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  const categories: CategoryRecord[] =
    categoriesError
      ? []
      : (
          categoriesData ?? []
        ).map((category) => ({
          id: String(category.id),

          slug: String(
            category.slug
          ),

          title: String(
            category.title
          ),

          description:
            category.description ===
            null
              ? null
              : String(
                  category.description
                ),

          icon_key: String(
            category.icon_key
          ),

          sort_order: Number(
            category.sort_order
          ),

          is_published: Boolean(
            category.is_published
          ),

          created_at: String(
            category.created_at
          ),
        }));

  const {
    data: coursesData,
    error: coursesError,
  } = await supabase
    .from("courses")
    .select("category");

  const courseCountByCategory =
    new Map<string, number>();

  if (!coursesError) {
    for (
      const course of
      coursesData ?? []
    ) {
      const categoryTitle =
        String(
          course.category ?? ""
        );

      if (!categoryTitle) {
        continue;
      }

      courseCountByCategory.set(
        categoryTitle,
        (
          courseCountByCategory.get(
            categoryTitle
          ) ?? 0
        ) + 1
      );
    }
  }

  const publishedCategories =
    categories.filter(
      (category) =>
        category.is_published
    ).length;

  const unpublishedCategories =
    categories.length -
    publishedCategories;

  const linkedCourses =
    [...courseCountByCategory.values()]
      .reduce(
        (
          total,
          courseCount
        ) =>
          total + courseCount,
        0
      );

  const stats = [
    {
      title:
        "إجمالي التصنيفات",

      value:
        categories.length.toString(),

      description:
        "تصنيف داخل المنصة",

      icon: Tags,
    },
    {
      title:
        "التصنيفات المنشورة",

      value:
        publishedCategories.toString(),

      description:
        "ظاهرة للطلاب",

      icon: Eye,
    },
    {
      title:
        "غير المنشورة",

      value:
        unpublishedCategories.toString(),

      description:
        "مخفية عن الطلاب",

      icon: EyeOff,
    },
    {
      title:
        "الكورسات المرتبطة",

      value:
        linkedCourses.toString(),

      description:
        "كورس داخل التصنيفات",

      icon: Layers3,
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
                  إدارة التصنيفات
                </h1>

                <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                  أضف تصنيفات الكورسات
                  وعدّل ترتيبها وتحكم في
                  ظهورها داخل المنصة.
                </p>
              </div>
            </div>

            <Link
              href="/admin/categories/new"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] hover:shadow-purple-600/20"
            >
              <Plus size={20} />
              إضافة تصنيف جديد
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          {error && (
            <div
              role="alert"
              className="mb-7 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold leading-7 text-red-300"
            >
              {error}
            </div>
          )}

          {success && (
            <div
              role="status"
              className="mb-7 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-bold leading-7 text-emerald-300"
            >
              {success}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon =
                stat.icon;

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

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-purple-400">
                تنظيم المحتوى
              </p>

              <h2 className="mt-2 text-3xl font-black">
                جميع التصنيفات
              </h2>

              <p className="mt-3 text-zinc-400">
                يمكنك تعديل أي تصنيف
                أو إخفاؤه عن الطلاب.
              </p>
            </div>

            <span className="shrink-0 text-sm text-zinc-500">
              {categories.length} تصنيف
            </span>
          </div>

          {categoriesError ? (
            <GlassCard
              hover={false}
              className="mt-8 border-red-500/20 bg-red-500/[0.05] px-6 py-16 text-center"
            >
              <h3 className="text-2xl font-black text-red-300">
                تعذر تحميل التصنيفات
              </h3>

              <p className="mt-3 text-zinc-400">
                حدث خطأ أثناء قراءة
                التصنيفات من قاعدة البيانات.
              </p>
            </GlassCard>
          ) : categories.length === 0 ? (
            <GlassCard
              hover={false}
              className="mt-8 px-6 py-16 text-center"
            >
              <Tags
                size={48}
                className="mx-auto text-purple-400"
              />

              <h3 className="mt-5 text-2xl font-black">
                لا توجد تصنيفات
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-400">
                أضف أول تصنيف لتنظيم
                الكورسات داخل المنصة.
              </p>

              <Link
                href="/admin/categories/new"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black"
              >
                <Plus size={19} />
                إضافة أول تصنيف
              </Link>
            </GlassCard>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {categories.map(
                (category) => {
                  const Icon =
                    iconMap[
                      category.icon_key
                    ] ?? BookOpen;

                  const courseCount =
                    courseCountByCategory.get(
                      category.title
                    ) ?? 0;

                  return (
                    <GlassCard
                      key={category.id}
                      as="article"
                      className="group relative overflow-hidden p-7"
                    >
                      <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-purple-600/10 blur-3xl transition group-hover:bg-purple-600/20" />

                      <div className="relative">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-400">
                            <Icon size={27} />
                          </div>

                          <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${
                              category.is_published
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                : "border-orange-500/20 bg-orange-500/10 text-orange-300"
                            }`}
                          >
                            {category.is_published ? (
                              <Eye size={14} />
                            ) : (
                              <EyeOff size={14} />
                            )}

                            {category.is_published
                              ? "منشور"
                              : "مخفي"}
                          </span>
                        </div>

                        <h3 className="mt-6 text-2xl font-black">
                          {category.title}
                        </h3>

                        <p className="mt-3 min-h-14 text-sm leading-7 text-zinc-400">
                          {category.description ||
                            "لم تتم إضافة وصف لهذا التصنيف."}
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs text-zinc-500">
                              عدد الكورسات
                            </p>

                            <p className="mt-2 text-xl font-black">
                              {courseCount}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                            <p className="text-xs text-zinc-500">
                              الترتيب
                            </p>

                            <p className="mt-2 text-xl font-black">
                              {category.sort_order}
                            </p>
                          </div>
                        </div>

                        <code
                          dir="ltr"
                          className="mt-4 block overflow-x-auto rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-left text-xs text-purple-300"
                        >
                          {category.slug}
                        </code>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                          <Link
                            href={`/admin/categories/${category.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:brightness-110"
                          >
                            <Pencil size={17} />
                            تعديل
                          </Link>

                          <form
                            action={
                              toggleCategoryStatus
                            }
                          >
                            <input
                              type="hidden"
                              name="category_id"
                              value={
                                category.id
                              }
                            />

                            <input
                              type="hidden"
                              name="current_status"
                              value={String(
                                category.is_published
                              )}
                            />

                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-zinc-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
                            >
                              {category.is_published ? (
                                <EyeOff
                                  size={17}
                                />
                              ) : (
                                <Eye
                                  size={17}
                                />
                              )}

                              {category.is_published
                                ? "إخفاء"
                                : "نشر"}
                            </button>
                          </form>
                        </div>

                        <form
                          action={
                            deleteCategory
                          }
                          className="mt-3"
                        >
                          <input
                            type="hidden"
                            name="category_id"
                            value={category.id}
                          />

                          <input
                            type="hidden"
                            name="category_title"
                            value={
                              category.title
                            }
                          />

                          <button
                            type="submit"
                            disabled={
                              courseCount > 0
                            }
                            title={
                              courseCount > 0
                                ? "لا يمكن حذف تصنيف مرتبط بكورسات."
                                : "حذف التصنيف."
                            }
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 size={17} />
                            حذف التصنيف
                          </button>
                        </form>
                      </div>
                    </GlassCard>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
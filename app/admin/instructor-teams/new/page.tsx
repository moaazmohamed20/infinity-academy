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
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  Code2,
  Eye,
  Languages,
  ListOrdered,
  Megaphone,
  Palette,
  Save,
  ShieldCheck,
  Sparkles,
  Tag,
  UsersRound,
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

type CategoryOption = {
  id: string;
  title: string;
  is_published: boolean;
};

const iconOptions = [
  {
    value: "Code2",
    label: "البرمجة",
    icon: Code2,
  },
  {
    value: "Brain",
    label: "الذكاء الاصطناعي",
    icon: Brain,
  },
  {
    value: "Languages",
    label: "اللغات",
    icon: Languages,
  },
  {
    value: "Megaphone",
    label: "التسويق وصناعة المحتوى",
    icon: Megaphone,
  },
  {
    value: "Palette",
    label: "التصميم والمونتاج",
    icon: Palette,
  },
  {
    value: "BriefcaseBusiness",
    label: "إدارة الأعمال",
    icon: BriefcaseBusiness,
  },
  {
    value: "BookOpen",
    label: "تعليم عام",
    icon: BookOpen,
  },
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
    `/admin/instructor-teams/new?error=${encodeURIComponent(
      message
    )}`
  );
}

function parseSkills(
  value: string
) {
  const skills = value
    .split(/[\n,،]+/)
    .map((skill) => skill.trim())
    .filter(Boolean);

  return Array.from(
    new Set(skills)
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

async function createInstructorTeam(
  formData: FormData
) {
  "use server";

  const supabase =
    await requireAdmin();

  const title =
    getFormValue(
      formData,
      "title"
    );

  const categoryId =
    getFormValue(
      formData,
      "category_id"
    );

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

  const skillsValue =
    getFormValue(
      formData,
      "skills"
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

  const skills =
    parseSkills(skillsValue);

  if (
    !title ||
    !categoryId ||
    !description ||
    !iconKey ||
    !skillsValue ||
    !sortOrderValue
  ) {
    redirectWithError(
      "اكتب جميع بيانات الفريق المطلوبة."
    );
  }

  if (
    title.length < 3
  ) {
    redirectWithError(
      "اسم الفريق يجب أن يحتوي على 3 أحرف على الأقل."
    );
  }

  if (
    description.length < 10
  ) {
    redirectWithError(
      "اكتب وصفًا أوضح للفريق التعليمي."
    );
  }

  if (
    skills.length < 1
  ) {
    redirectWithError(
      "أضف مهارة واحدة على الأقل."
    );
  }

  if (
    skills.length > 10
  ) {
    redirectWithError(
      "الحد الأقصى هو 10 مهارات لكل فريق."
    );
  }

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    redirectWithError(
      "ترتيب الفريق يجب أن يكون رقمًا صحيحًا يبدأ من صفر."
    );
  }

  const validIcon =
    iconOptions.some(
      (option) =>
        option.value === iconKey
    );

  if (!validIcon) {
    redirectWithError(
      "اختر أيقونة صحيحة للفريق."
    );
  }

  const {
    data: categoryRecord,
    error: categoryError,
  } = await supabase
    .from("categories")
    .select(
      `
        id,
        title
      `
    )
    .eq("id", categoryId)
    .maybeSingle();

  if (
    categoryError ||
    !categoryRecord
  ) {
    redirectWithError(
      "التصنيف المختار غير موجود."
    );
  }

  const {
    data: existingTeam,
    error: existingTeamError,
  } = await supabase
    .from("instructor_teams")
    .select("id")
    .eq(
      "category_id",
      categoryId
    )
    .maybeSingle();

  if (existingTeamError) {
    console.error(
      "تعذر التحقق من الفريق:",
      existingTeamError
    );

    redirectWithError(
      "تعذر التحقق من التصنيف المختار."
    );
  }

  if (existingTeam) {
    redirectWithError(
      "يوجد فريق تعليمي مرتبط بهذا التصنيف بالفعل."
    );
  }

  const {
    error: insertError,
  } = await supabase
    .from("instructor_teams")
    .insert({
      category_id: categoryId,
      title,
      description,
      icon_key: iconKey,
      skills,
      sort_order: sortOrder,
      is_published:
        isPublished,
    });

  if (insertError) {
    console.error(
      "تعذر إضافة الفريق:",
      insertError
    );

    if (
      insertError.code === "23505"
    ) {
      redirectWithError(
        "يوجد فريق مرتبط بهذا التصنيف بالفعل."
      );
    }

    redirectWithError(
      "تعذر إضافة الفريق. حاول مرة أخرى."
    );
  }

  revalidatePath(
    "/admin/instructor-teams"
  );

  revalidatePath(
    "/instructors"
  );

  redirect(
    "/admin/instructor-teams?success=" +
      encodeURIComponent(
        "تم إضافة الفريق بنجاح."
      )
  );
}

export default async function NewInstructorTeamPage({
  searchParams,
}: PageProps) {
  const supabase =
    await requireAdmin();

  const {
    error,
  } = await searchParams;

  const [
    categoriesResult,
    teamsResult,
  ] = await Promise.all([
    supabase
      .from("categories")
      .select(
        `
          id,
          title,
          is_published
        `
      )
      .order("sort_order", {
        ascending: true,
      })
      .order("title", {
        ascending: true,
      }),

    supabase
      .from("instructor_teams")
      .select("category_id"),
  ]);

  if (
    categoriesResult.error
  ) {
    console.error(
      "تعذر تحميل التصنيفات:",
      categoriesResult.error
    );
  }

  if (teamsResult.error) {
    console.error(
      "تعذر تحميل الفرق:",
      teamsResult.error
    );
  }

  const usedCategoryIds =
    new Set(
      (
        teamsResult.data ?? []
      ).map((team) =>
        String(
          team.category_id
        )
      )
    );

  const availableCategories: CategoryOption[] =
    categoriesResult.error
      ? []
      : (
          categoriesResult.data ??
          []
        )
          .map((category) => ({
            id: String(
              category.id
            ),

            title: String(
              category.title
            ),

            is_published: Boolean(
              category.is_published
            ),
          }))
          .filter(
            (category) =>
              !usedCategoryIds.has(
                category.id
              )
          );

  const canCreateTeam =
    !categoriesResult.error &&
    !teamsResult.error &&
    availableCategories.length >
      0;

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-16">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/admin/instructor-teams"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-purple-400"
          >
            <ArrowRight
              size={17}
            />

            العودة إلى إدارة الفرق
          </Link>

          <div className="mt-7 flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
              <ShieldCheck
                size={31}
              />
            </div>

            <div>
              <p className="text-sm font-bold text-purple-400">
                لوحة الإدارة
              </p>

              <h1 className="mt-2 text-3xl font-black md:text-5xl">
                إضافة فريق جديد
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                أضف فريقًا تعليميًا وحدد
                التصنيف والمهارات التي
                يقدمها داخل المنصة.
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
                بيانات الفريق
              </p>

              <h2 className="mt-2 text-2xl font-black md:text-3xl">
                المعلومات الأساسية
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-500">
                اربط الفريق بتصنيف واحد
                وأضف وصفه ومهاراته.
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

            {(categoriesResult.error ||
              teamsResult.error) && (
              <div
                role="alert"
                className="mt-7 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold leading-7 text-red-300"
              >
                تعذر تحميل التصنيفات
                المتاحة من قاعدة البيانات.
              </div>
            )}

            {!categoriesResult.error &&
              !teamsResult.error &&
              availableCategories.length ===
                0 && (
                <div
                  role="alert"
                  className="mt-7 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-5 py-4 text-sm font-bold leading-7 text-orange-300"
                >
                  جميع التصنيفات مرتبطة
                  بفرق تعليمية بالفعل. أضف
                  تصنيفًا جديدًا أولًا.
                </div>
              )}

            <form
              action={
                createInstructorTeam
              }
              className="mt-8 space-y-7"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="title"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    اسم الفريق

                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                    <UsersRound
                      size={19}
                      className="shrink-0 text-zinc-600"
                    />

                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      placeholder="مثال: فريق الأمن السيبراني"
                      className="w-full bg-transparent px-3 py-4 outline-none placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="category_id"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    تصنيف الفريق

                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <select
                    id="category_id"
                    name="category_id"
                    required
                    defaultValue=""
                    disabled={
                      !canCreateTeam
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111114] px-4 py-4 text-white outline-none transition focus:border-purple-500/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option
                      value=""
                      disabled
                    >
                      {canCreateTeam
                        ? "اختر تصنيف الفريق"
                        : "لا توجد تصنيفات متاحة"}
                    </option>

                    {availableCategories.map(
                      (category) => (
                        <option
                          key={
                            category.id
                          }
                          value={
                            category.id
                          }
                        >
                          {category.title}

                          {!category.is_published
                            ? " — مخفي"
                            : ""}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="icon_key"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    أيقونة الفريق

                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <select
                    id="icon_key"
                    name="icon_key"
                    required
                    defaultValue="BookOpen"
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
                    ترتيب الفريق

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
                      defaultValue="0"
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
                  وصف الفريق

                  <span className="mr-1 text-red-400">
                    *
                  </span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  placeholder="اكتب وصفًا واضحًا يشرح تخصص الفريق وخبراته..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-5 py-4 leading-8 outline-none transition placeholder:text-zinc-700 focus:border-purple-500/60"
                />
              </div>

              <div>
                <label
                  htmlFor="skills"
                  className="mb-3 block text-sm font-bold text-zinc-300"
                >
                  مهارات الفريق

                  <span className="mr-1 text-red-400">
                    *
                  </span>
                </label>

                <div className="relative">
                  <Sparkles
                    size={19}
                    className="absolute right-5 top-5 text-zinc-600"
                  />

                  <textarea
                    id="skills"
                    name="skills"
                    required
                    rows={6}
                    placeholder={`اكتب كل مهارة في سطر منفصل، مثل:\nحماية الشبكات\nاختبار الاختراق\nأمن المعلومات`}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 py-4 pl-5 pr-12 leading-8 outline-none transition placeholder:text-zinc-700 focus:border-purple-500/60"
                  />
                </div>

                <p className="mt-2 text-xs leading-6 text-zinc-600">
                  اكتب كل مهارة في سطر
                  منفصل، بحد أقصى 10 مهارات.
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 transition hover:border-purple-500/40">
                <input
                  type="checkbox"
                  name="is_published"
                  defaultChecked
                  className="mt-1 h-5 w-5 accent-purple-600"
                />

                <div>
                  <p className="font-black">
                    نشر الفريق مباشرة
                  </p>

                  <p className="mt-2 text-sm leading-7 text-zinc-500">
                    عند تفعيل هذا الاختيار
                    سيظهر الفريق للطلاب داخل
                    صفحة الخبراء.
                  </p>
                </div>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-7 sm:flex-row sm:justify-end">
                <Link
                  href="/admin/instructor-teams"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-7 py-4 font-bold text-zinc-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
                >
                  إلغاء
                </Link>

                <button
                  type="submit"
                  disabled={
                    !canCreateTeam
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Save size={20} />
                  حفظ الفريق
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
                <CheckCircle2
                  size={24}
                />
              </div>

              <h2 className="mt-5 text-xl font-black">
                بعد إضافة الفريق
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-400">
                <p>
                  1. سيظهر في صفحة إدارة
                  الفرق.
                </p>

                <p>
                  2. سيتم ربطه بالتصنيف
                  المختار.
                </p>

                <p>
                  3. سيظهر للطلاب بعد ربط
                  صفحة الخبراء بقاعدة
                  البيانات.
                </p>
              </div>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Tag size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                فريق لكل تصنيف
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                لا يمكن ربط أكثر من فريق
                تعليمي بنفس التصنيف.
              </p>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Eye size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                حالة النشر
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                يمكنك إخفاء الفريق لاحقًا
                بدون حذفه من قاعدة البيانات.
              </p>
            </GlassCard>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
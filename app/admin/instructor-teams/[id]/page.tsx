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
  params: Promise<{
    id: string;
  }>;

  searchParams: Promise<{
    error?: string;
    success?: string;
  }>;
};

type CategoryOption = {
  id: string;
  title: string;
  is_published: boolean;
};

type InstructorTeamRecord = {
  id: string;
  category_id: string;
  title: string;
  description: string;
  icon_key: string;
  skills: string[];
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

const iconMap: Record<
  string,
  LucideIcon
> = {
  Code2,
  Brain,
  Languages,
  Megaphone,
  Palette,
  BriefcaseBusiness,
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

function parseSkills(
  value: string
) {
  const skills = value
    .split(/[\n,،]+/)
    .map((skill) =>
      skill.trim()
    )
    .filter(Boolean);

  return Array.from(
    new Set(skills)
  );
}

function redirectWithError(
  teamId: string,
  message: string
): never {
  redirect(
    `/admin/instructor-teams/${teamId}?error=${encodeURIComponent(
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

async function updateInstructorTeam(
  formData: FormData
) {
  "use server";

  const supabase =
    await requireAdmin();

  const teamId =
    getFormValue(
      formData,
      "team_id"
    );

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

  if (!teamId) {
    redirect(
      "/admin/instructor-teams?error=" +
        encodeURIComponent(
          "لم يتم العثور على الفريق."
        )
    );
  }

  if (
    !title ||
    !categoryId ||
    !description ||
    !iconKey ||
    !skillsValue ||
    !sortOrderValue
  ) {
    redirectWithError(
      teamId,
      "اكتب جميع بيانات الفريق المطلوبة."
    );
  }

  if (title.length < 3) {
    redirectWithError(
      teamId,
      "اسم الفريق يجب أن يحتوي على 3 أحرف على الأقل."
    );
  }

  if (
    description.length < 10
  ) {
    redirectWithError(
      teamId,
      "اكتب وصفًا أوضح للفريق التعليمي."
    );
  }

  if (skills.length < 1) {
    redirectWithError(
      teamId,
      "أضف مهارة واحدة على الأقل."
    );
  }

  if (skills.length > 10) {
    redirectWithError(
      teamId,
      "الحد الأقصى هو 10 مهارات لكل فريق."
    );
  }

  if (
    !Number.isInteger(
      sortOrder
    ) ||
    sortOrder < 0
  ) {
    redirectWithError(
      teamId,
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
      teamId,
      "اختر أيقونة صحيحة للفريق."
    );
  }

  const {
    data: categoryRecord,
    error: categoryError,
  } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();

  if (
    categoryError ||
    !categoryRecord
  ) {
    redirectWithError(
      teamId,
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
    .neq("id", teamId)
    .maybeSingle();

  if (existingTeamError) {
    console.error(
      "تعذر التحقق من التصنيف:",
      existingTeamError
    );

    redirectWithError(
      teamId,
      "تعذر التحقق من التصنيف المختار."
    );
  }

  if (existingTeam) {
    redirectWithError(
      teamId,
      "يوجد فريق آخر مرتبط بهذا التصنيف بالفعل."
    );
  }

  const {
    data: updatedTeam,
    error: updateError,
  } = await supabase
    .from("instructor_teams")
    .update({
      category_id:
        categoryId,

      title,

      description,

      icon_key:
        iconKey,

      skills,

      sort_order:
        sortOrder,

      is_published:
        isPublished,
    })
    .eq("id", teamId)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error(
      "تعذر تعديل الفريق:",
      updateError
    );

    if (
      updateError.code ===
      "23505"
    ) {
      redirectWithError(
        teamId,
        "يوجد فريق آخر مرتبط بهذا التصنيف بالفعل."
      );
    }

    redirectWithError(
      teamId,
      "تعذر حفظ تعديلات الفريق."
    );
  }

  if (!updatedTeam) {
    redirectWithError(
      teamId,
      "لم يتم العثور على الفريق المطلوب."
    );
  }

  revalidatePath(
    "/admin/instructor-teams"
  );

  revalidatePath(
    `/admin/instructor-teams/${teamId}`
  );

  revalidatePath(
    "/instructors"
  );

  redirect(
    `/admin/instructor-teams/${teamId}?success=${encodeURIComponent(
      "تم تعديل الفريق بنجاح."
    )}`
  );
}

export default async function EditInstructorTeamPage({
  params,
  searchParams,
}: PageProps) {
  const supabase =
    await requireAdmin();

  const {
    id: teamId,
  } = await params;

  const {
    error,
    success,
  } = await searchParams;

  if (!teamId) {
    redirect(
      "/admin/instructor-teams"
    );
  }

  const {
    data: teamData,
    error: teamError,
  } = await supabase
    .from("instructor_teams")
    .select(
      `
        id,
        category_id,
        title,
        description,
        icon_key,
        skills,
        sort_order,
        is_published
      `
    )
    .eq("id", teamId)
    .maybeSingle();

  if (
    teamError ||
    !teamData
  ) {
    redirect(
      "/admin/instructor-teams?error=" +
        encodeURIComponent(
          "لم يتم العثور على الفريق المطلوب."
        )
    );
  }

  const team: InstructorTeamRecord =
    {
      id: String(
        teamData.id
      ),

      category_id: String(
        teamData.category_id
      ),

      title: String(
        teamData.title
      ),

      description: String(
        teamData.description
      ),

      icon_key: String(
        teamData.icon_key
      ),

      skills: Array.isArray(
        teamData.skills
      )
        ? teamData.skills.map(
            (skill) =>
              String(skill)
          )
        : [],

      sort_order: Number(
        teamData.sort_order
      ),

      is_published: Boolean(
        teamData.is_published
      ),
    };

  const [
    categoriesResult,
    otherTeamsResult,
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
      .from(
        "instructor_teams"
      )
      .select("category_id")
      .neq("id", teamId),
  ]);

  if (
    categoriesResult.error
  ) {
    console.error(
      "تعذر تحميل التصنيفات:",
      categoriesResult.error
    );
  }

  if (
    otherTeamsResult.error
  ) {
    console.error(
      "تعذر تحميل الفرق الأخرى:",
      otherTeamsResult.error
    );
  }

  const usedCategoryIds =
    new Set(
      (
        otherTeamsResult.data ??
        []
      ).map((otherTeam) =>
        String(
          otherTeam.category_id
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
          .map(
            (category) => ({
              id: String(
                category.id
              ),

              title: String(
                category.title
              ),

              is_published:
                Boolean(
                  category.is_published
                ),
            })
          )
          .filter(
            (category) =>
              category.id ===
                team.category_id ||
              !usedCategoryIds.has(
                category.id
              )
          );

  const currentCategory =
    availableCategories.find(
      (category) =>
        category.id ===
        team.category_id
    );

  const CurrentIcon =
    iconMap[
      team.icon_key
    ] ?? BookOpen;

  const canUpdateTeam =
    !categoriesResult.error &&
    !otherTeamsResult.error &&
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
                تعديل الفريق
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                عدّل بيانات الفريق
                وتصنيفه ومهاراته وحالة
                ظهوره للطلاب.
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
                عدّل الحقول المطلوبة ثم
                اضغط حفظ التعديلات.
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

            {(categoriesResult.error ||
              otherTeamsResult.error) && (
              <div
                role="alert"
                className="mt-7 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold leading-7 text-red-300"
              >
                تعذر تحميل التصنيفات
                المتاحة من قاعدة البيانات.
              </div>
            )}

            <form
              action={
                updateInstructorTeam
              }
              className="mt-8 space-y-7"
            >
              <input
                type="hidden"
                name="team_id"
                value={team.id}
              />

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
                      defaultValue={
                        team.title
                      }
                      className="w-full bg-transparent px-3 py-4 outline-none"
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
                    defaultValue={
                      team.category_id
                    }
                    disabled={
                      !canUpdateTeam
                    }
                    className="w-full rounded-xl border border-white/10 bg-[#111114] px-4 py-4 text-white outline-none transition focus:border-purple-500/60 disabled:cursor-not-allowed disabled:opacity-50"
                  >
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
                    defaultValue={
                      team.icon_key
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
                      defaultValue={
                        team.sort_order
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
                  defaultValue={
                    team.description
                  }
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-5 py-4 leading-8 outline-none transition focus:border-purple-500/60"
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
                    defaultValue={team.skills.join(
                      "\n"
                    )}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 py-4 pl-5 pr-12 leading-8 outline-none transition focus:border-purple-500/60"
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
                  defaultChecked={
                    team.is_published
                  }
                  className="mt-1 h-5 w-5 accent-purple-600"
                />

                <div>
                  <p className="font-black">
                    نشر الفريق
                  </p>

                  <p className="mt-2 text-sm leading-7 text-zinc-500">
                    عند إلغاء الاختيار سيتم
                    إخفاء الفريق من صفحة
                    الخبراء بدون حذفه.
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
                    !canUpdateTeam
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
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
                <CurrentIcon
                  size={27}
                />
              </div>

              <h2 className="mt-5 text-xl font-black">
                {team.title}
              </h2>

              <span className="mt-4 inline-flex rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-300">
                {currentCategory?.title ??
                  "تصنيف الفريق"}
              </span>

              <p className="mt-4 text-sm leading-7 text-zinc-400">
                {team.description}
              </p>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Tag size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                التصنيف
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                يمكن ربط الفريق بتصنيف
                غير مستخدم بواسطة فريق آخر.
              </p>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2
                  size={24}
                />
              </div>

              <h2 className="mt-5 text-xl font-black">
                المهارات الحالية
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                تمت إضافة{" "}
                <strong className="text-white">
                  {team.skills.length}
                </strong>{" "}
                مهارة لهذا الفريق.
              </p>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400">
                <Eye size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                حالة الظهور
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                الفريق حاليًا{" "}
                <strong className="text-white">
                  {team.is_published
                    ? "منشور"
                    : "مخفي"}
                </strong>
                .
              </p>
            </GlassCard>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
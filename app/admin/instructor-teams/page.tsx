import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { LucideIcon } from "lucide-react";

import {
  ArrowRight,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Code2,
  Eye,
  EyeOff,
  Languages,
  Layers3,
  Megaphone,
  Palette,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  UsersRound,
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

type InstructorTeamRecord = {
  id: string;
  category_id: string;
  title: string;
  description: string;
  icon_key: string;
  skills: string[];
  sort_order: number;
  is_published: boolean;
  created_at: string;
  category_title: string;
  category_slug: string;
};

const iconMap: Record<string, LucideIcon> = {
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

function redirectWithMessage(
  type: "error" | "success",
  message: string
): never {
  redirect(
    `/admin/instructor-teams?${type}=${encodeURIComponent(
      message
    )}`
  );
}

async function requireAdmin() {
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

  return supabase;
}

async function toggleTeamStatus(
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

  const currentStatus =
    getFormValue(
      formData,
      "current_status"
    ) === "true";

  if (!teamId) {
    redirectWithMessage(
      "error",
      "لم يتم العثور على الفريق."
    );
  }

  const {
    error: updateError,
  } = await supabase
    .from("instructor_teams")
    .update({
      is_published:
        !currentStatus,
    })
    .eq("id", teamId);

  if (updateError) {
    console.error(
      "تعذر تحديث حالة الفريق:",
      updateError
    );

    redirectWithMessage(
      "error",
      "تعذر تحديث حالة الفريق."
    );
  }

  revalidatePath(
    "/admin/instructor-teams"
  );

  revalidatePath("/instructors");

  redirectWithMessage(
    "success",
    currentStatus
      ? "تم إخفاء الفريق بنجاح."
      : "تم نشر الفريق بنجاح."
  );
}

async function deleteTeam(
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

  if (!teamId) {
    redirectWithMessage(
      "error",
      "لم يتم العثور على الفريق."
    );
  }

  const {
    error: deleteError,
  } = await supabase
    .from("instructor_teams")
    .delete()
    .eq("id", teamId);

  if (deleteError) {
    console.error(
      "تعذر حذف الفريق:",
      deleteError
    );

    redirectWithMessage(
      "error",
      "تعذر حذف الفريق."
    );
  }

  revalidatePath(
    "/admin/instructor-teams"
  );

  revalidatePath("/instructors");

  redirectWithMessage(
    "success",
    "تم حذف الفريق بنجاح."
  );
}

export default async function InstructorTeamsAdminPage({
  searchParams,
}: PageProps) {
  const supabase =
    await requireAdmin();

  const {
    error,
    success,
  } = await searchParams;

  const {
    data: teamsData,
    error: teamsError,
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
        is_published,
        created_at,
        categories (
          title,
          slug
        )
      `
    )
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  if (teamsError) {
    console.error(
      "تعذر تحميل فرق التدريس:",
      teamsError
    );
  }

  const teams: InstructorTeamRecord[] =
    teamsError
      ? []
      : (
          teamsData ?? []
        ).map((team) => {
          const categoryValue =
            team.categories;

          const category =
            Array.isArray(
              categoryValue
            )
              ? categoryValue[0]
              : categoryValue;

          return {
            id: String(team.id),

            category_id: String(
              team.category_id
            ),

            title: String(
              team.title
            ),

            description: String(
              team.description
            ),

            icon_key: String(
              team.icon_key
            ),

            skills: Array.isArray(
              team.skills
            )
              ? team.skills.map(
                  (skill) =>
                    String(skill)
                )
              : [],

            sort_order: Number(
              team.sort_order
            ),

            is_published: Boolean(
              team.is_published
            ),

            created_at: String(
              team.created_at
            ),

            category_title:
              category &&
              typeof category.title ===
                "string"
                ? category.title
                : "تصنيف غير معروف",

            category_slug:
              category &&
              typeof category.slug ===
                "string"
                ? category.slug
                : "",
          };
        });

  const {
    data: coursesData,
    error: coursesError,
  } = await supabase
    .from("courses")
    .select("category");

  if (coursesError) {
    console.error(
      "تعذر تحميل أعداد الكورسات:",
      coursesError
    );
  }

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
        ).trim();

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

  const publishedTeams =
    teams.filter(
      (team) =>
        team.is_published
    ).length;

  const hiddenTeams =
    teams.length -
    publishedTeams;

  const totalSkills =
    teams.reduce(
      (
        total,
        team
      ) =>
        total +
        team.skills.length,
      0
    );

  const totalLinkedCourses =
    teams.reduce(
      (
        total,
        team
      ) =>
        total +
        (
          courseCountByCategory.get(
            team.category_title
          ) ?? 0
        ),
      0
    );

  const stats = [
    {
      title:
        "إجمالي الفرق",

      value:
        teams.length.toString(),

      description:
        "فريق تعليمي داخل المنصة",

      icon: UsersRound,
    },
    {
      title:
        "الفرق المنشورة",

      value:
        publishedTeams.toString(),

      description:
        "ظاهرة للطلاب",

      icon: Eye,
    },
    {
      title:
        "الفرق المخفية",

      value:
        hiddenTeams.toString(),

      description:
        "غير ظاهرة للطلاب",

      icon: EyeOff,
    },
    {
      title:
        "المهارات المضافة",

      value:
        totalSkills.toString(),

      description:
        "مهارة داخل جميع الفرق",

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
                  إدارة فرق التدريس
                </h1>

                <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                  أضف الفرق التعليمية
                  وحدد تخصصاتها ومهاراتها
                  وتحكم في ظهورها داخل
                  المنصة.
                </p>
              </div>
            </div>

            <Link
              href="/admin/instructor-teams/new"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] hover:brightness-110"
            >
              <Plus size={20} />
              إضافة فريق جديد
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

          <GlassCard
            hover={false}
            className="mt-6 border-blue-500/20 bg-blue-500/[0.05] px-6 py-5"
          >
            <div className="flex items-center justify-between gap-5">
              <div>
                <p className="font-black text-blue-300">
                  الكورسات المرتبطة بالفرق
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  يتم حسابها حسب تصنيف كل
                  فريق تعليمي.
                </p>
              </div>

              <span className="text-3xl font-black text-blue-300">
                {totalLinkedCourses}
              </span>
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-purple-400">
                المحتوى التعليمي
              </p>

              <h2 className="mt-2 text-3xl font-black">
                جميع الفرق
              </h2>

              <p className="mt-3 text-zinc-400">
                يمكنك تعديل بيانات أي فريق
                أو إخفاؤه عن الطلاب.
              </p>
            </div>

            <span className="shrink-0 text-sm text-zinc-500">
              {teams.length} فريق
            </span>
          </div>

          {teamsError ? (
            <GlassCard
              hover={false}
              className="mt-8 border-red-500/20 bg-red-500/[0.05] px-6 py-16 text-center"
            >
              <h3 className="text-2xl font-black text-red-300">
                تعذر تحميل فرق التدريس
              </h3>

              <p className="mt-3 text-zinc-400">
                حدث خطأ أثناء قراءة الفرق
                من قاعدة البيانات.
              </p>
            </GlassCard>
          ) : teams.length === 0 ? (
            <GlassCard
              hover={false}
              className="mt-8 px-6 py-16 text-center"
            >
              <UsersRound
                size={48}
                className="mx-auto text-purple-400"
              />

              <h3 className="mt-5 text-2xl font-black">
                لا توجد فرق تعليمية
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-400">
                أضف أول فريق تعليمي ليظهر
                داخل صفحة الخبراء.
              </p>

              <Link
                href="/admin/instructor-teams/new"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black"
              >
                <Plus size={19} />
                إضافة أول فريق
              </Link>
            </GlassCard>
          ) : (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {teams.map(
                (team) => {
                  const Icon =
                    iconMap[
                      team.icon_key
                    ] ?? BookOpen;

                  const courseCount =
                    courseCountByCategory.get(
                      team.category_title
                    ) ?? 0;

                  return (
                    <GlassCard
                      key={team.id}
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
                              team.is_published
                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                                : "border-orange-500/20 bg-orange-500/10 text-orange-300"
                            }`}
                          >
                            {team.is_published ? (
                              <Eye size={14} />
                            ) : (
                              <EyeOff size={14} />
                            )}

                            {team.is_published
                              ? "منشور"
                              : "مخفي"}
                          </span>
                        </div>

                        <h3 className="mt-6 text-2xl font-black">
                          {team.title}
                        </h3>

                        <span className="mt-3 inline-flex rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-300">
                          {team.category_title}
                        </span>

                        <p className="mt-4 min-h-20 text-sm leading-7 text-zinc-400">
                          {team.description}
                        </p>

                        <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
                          {team.skills.length >
                          0 ? (
                            team.skills.map(
                              (skill) => (
                                <div
                                  key={skill}
                                  className="flex items-center gap-3 text-sm text-zinc-300"
                                >
                                  <span className="h-2 w-2 shrink-0 rounded-full bg-purple-500" />

                                  {skill}
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-sm text-zinc-600">
                              لم تتم إضافة مهارات
                              لهذا الفريق.
                            </p>
                          )}
                        </div>

                        <div className="mt-6 grid grid-cols-3 gap-3">
                          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                            <p className="text-xs text-zinc-500">
                              الكورسات
                            </p>

                            <p className="mt-2 text-xl font-black">
                              {courseCount}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                            <p className="text-xs text-zinc-500">
                              المهارات
                            </p>

                            <p className="mt-2 text-xl font-black">
                              {team.skills.length}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                            <p className="text-xs text-zinc-500">
                              الترتيب
                            </p>

                            <p className="mt-2 text-xl font-black">
                              {team.sort_order}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-2">
                          <Link
                            href={`/admin/instructor-teams/${team.id}`}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:brightness-110"
                          >
                            <Pencil size={17} />
                            تعديل
                          </Link>

                          <form
                            action={
                              toggleTeamStatus
                            }
                          >
                            <input
                              type="hidden"
                              name="team_id"
                              value={team.id}
                            />

                            <input
                              type="hidden"
                              name="current_status"
                              value={String(
                                team.is_published
                              )}
                            />

                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-zinc-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
                            >
                              {team.is_published ? (
                                <EyeOff
                                  size={17}
                                />
                              ) : (
                                <Eye
                                  size={17}
                                />
                              )}

                              {team.is_published
                                ? "إخفاء"
                                : "نشر"}
                            </button>
                          </form>
                        </div>

                        <form
                          action={deleteTeam}
                          className="mt-3"
                        >
                          <input
                            type="hidden"
                            name="team_id"
                            value={team.id}
                          />

                          <button
                            type="submit"
                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-4 py-3 text-sm font-black text-red-300 transition hover:bg-red-500/10"
                          >
                            <Trash2 size={17} />
                            حذف الفريق
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
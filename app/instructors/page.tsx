import Link from "next/link";

import type {
  LucideIcon,
} from "lucide-react";

import {
  ArrowLeft,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Code2,
  Languages,
  Megaphone,
  Palette,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Video,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import GlassCard from "../../components/ui/GlassCard";
import SectionTitle from "../../components/ui/SectionTitle";
import Button from "../../components/ui/Button";
import { createClient } from "../../lib/supabase/server";

export const dynamic =
  "force-dynamic";

type InstructorTeamRecord = {
  id: string;
  title: string;
  description: string;
  icon_key: string;
  skills: string[];
  category_title: string;
};

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

const benefits = [
  {
    title: "خبرة عملية",
    description:
      "محتوى مبني على تطبيقات ومشروعات واقعية.",
    icon: ShieldCheck,
  },
  {
    title: "شرح مبسط",
    description:
      "تبسيط المفاهيم الصعبة بخطوات منظمة.",
    icon: Sparkles,
  },
  {
    title: "متابعة مستمرة",
    description:
      "محتوى يساعدك على متابعة تقدمك وتطوير مستواك.",
    icon: UsersRound,
  },
  {
    title: "تطبيق مباشر",
    description:
      "كل مهارة يتم دعمها بأمثلة وتطبيقات عملية.",
    icon: Video,
  },
];

export default async function InstructorsPage() {
  const supabase =
    await createClient();

  const [
    teamsResult,
    coursesResult,
  ] = await Promise.all([
    supabase
      .from("instructor_teams")
      .select(
        `
          id,
          title,
          description,
          icon_key,
          skills,
          sort_order,
          created_at,
          categories (
            title
          )
        `
      )
      .eq(
        "is_published",
        true
      )
      .order("sort_order", {
        ascending: true,
      })
      .order("created_at", {
        ascending: true,
      }),

    supabase
      .from("courses")
      .select("category")
      .eq(
        "is_published",
        true
      ),
  ]);

  if (teamsResult.error) {
    console.error(
      "تعذر تحميل فرق التدريس:",
      teamsResult.error
    );
  }

  if (coursesResult.error) {
    console.error(
      "تعذر تحميل أعداد الكورسات:",
      coursesResult.error
    );
  }

  const instructorTeams: InstructorTeamRecord[] =
    teamsResult.error
      ? []
      : (
          teamsResult.data ?? []
        )
          .map((team) => {
            const categoryValue =
              team.categories;

            const category =
              Array.isArray(
                categoryValue
              )
                ? categoryValue[0]
                : categoryValue;

            const categoryTitle =
              category &&
              typeof category.title ===
                "string"
                ? category.title.trim()
                : "";

            return {
              id: String(
                team.id
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

              category_title:
                categoryTitle,
            };
          })
          .filter(
            (team) =>
              team.category_title
          );

  const courseCountByCategory =
    new Map<string, number>();

  if (!coursesResult.error) {
    for (
      const course of
      coursesResult.data ?? []
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

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <SectionTitle
            badge="خبراء Infinity Academy"
            title="تعلّم على يد"
            highlightedText="فرق متخصصة"
            description="يتم إعداد محتوى المنصة بواسطة فرق تعليمية متخصصة تمتلك خبرة عملية في مختلف المجالات."
            align="center"
          />

          {teamsResult.error ? (
            <GlassCard
              hover={false}
              className="mt-16 border-red-500/20 bg-red-500/[0.05] px-6 py-20 text-center"
            >
              <UsersRound
                size={48}
                className="mx-auto text-red-300"
              />

              <h2 className="mt-5 text-2xl font-black text-red-300">
                تعذر تحميل فرق التدريس
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-400">
                حدث خطأ أثناء قراءة فرق
                التدريس من قاعدة البيانات.
              </p>
            </GlassCard>
          ) : instructorTeams.length ===
            0 ? (
            <GlassCard
              hover={false}
              className="mt-16 px-6 py-20 text-center"
            >
              <UsersRound
                size={48}
                className="mx-auto text-purple-400"
              />

              <h2 className="mt-5 text-2xl font-black">
                لا توجد فرق تعليمية
              </h2>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-400">
                سيتم عرض الفرق هنا بعد
                إضافتها ونشرها من لوحة
                الإدارة.
              </p>
            </GlassCard>
          ) : (
            <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {instructorTeams.map(
                (team) => {
                  const Icon =
                    iconMap[
                      team.icon_key
                    ] ?? BookOpen;

                  const teamCourses =
                    courseCountByCategory.get(
                      team.category_title
                    ) ?? 0;

                  return (
                    <GlassCard
                      key={team.id}
                      as="article"
                      className="group flex h-full flex-col p-7"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40 transition duration-300 group-hover:scale-110">
                          <Icon
                            size={27}
                          />
                        </div>

                        <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-300">
                          {teamCourses}{" "}
                          كورس
                        </span>
                      </div>

                      <h2 className="mt-6 text-2xl font-black transition group-hover:text-purple-300">
                        {team.title}
                      </h2>

                      <span className="mt-3 w-fit rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-zinc-400">
                        {
                          team.category_title
                        }
                      </span>

                      <p className="mt-4 min-h-20 text-sm leading-7 text-zinc-400">
                        {
                          team.description
                        }
                      </p>

                      <div className="mt-6 flex-1 space-y-3 border-t border-white/10 pt-6">
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
                            سيتم إضافة مهارات
                            الفريق قريبًا.
                          </p>
                        )}
                      </div>

                      <Link
                        href={`/courses?category=${encodeURIComponent(
                          team.category_title
                        )}`}
                        className="mt-7 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-5 py-4 font-bold text-zinc-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
                      >
                        استكشف كورسات الفريق

                        <ArrowLeft
                          size={18}
                        />
                      </Link>
                    </GlassCard>
                  );
                }
              )}
            </div>
          )}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0D0D14] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            badge="تجربة تعليمية احترافية"
            title="لماذا تتعلم مع"
            highlightedText="خبرائنا؟"
            description="منهجية تعليمية تجمع بين الشرح الواضح والتطبيق العملي."
            align="center"
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(
              (benefit) => {
                const Icon =
                  benefit.icon;

                return (
                  <GlassCard
                    key={
                      benefit.title
                    }
                    hover={false}
                    className="p-6 text-center"
                  >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                      <Icon
                        size={23}
                      />
                    </div>

                    <h3 className="mt-5 text-lg font-black">
                      {
                        benefit.title
                      }
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-zinc-400">
                      {
                        benefit.description
                      }
                    </p>
                  </GlassCard>
                );
              }
            )}
          </div>

          <div className="mt-12 text-center">
            <Button
              href="/courses"
              className="px-8 py-4"
            >
              استكشف جميع الكورسات

              <ArrowLeft
                size={19}
              />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
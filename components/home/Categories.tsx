import Link from "next/link";

import type {
  LucideIcon,
} from "lucide-react";

import {
  ArrowLeft,
  BookOpen,
  Brain,
  Briefcase,
  Building2,
  Camera,
  Clapperboard,
  Code2,
  GraduationCap,
  Languages,
  Laptop,
  Music4,
  Palette,
  ShoppingCart,
} from "lucide-react";

import Button from "../ui/Button";
import GlassCard from "../ui/GlassCard";
import SectionTitle from "../ui/SectionTitle";

import { createClient } from "../../lib/supabase/server";

type CategoryRecord = {
  id: string;
  title: string;
  description: string | null;
  icon_key: string;
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

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-US"
  ).format(value);
}

export default async function Categories() {
  const supabase =
    await createClient();

  /*
   * تحميل التصنيفات المنشورة
   * من قاعدة البيانات.
   */
  const {
    data: categoriesData,
    error: categoriesError,
  } = await supabase
    .from("categories")
    .select(
      `
        id,
        title,
        description,
        icon_key
      `
    )
    .eq("is_published", true)
    .order("sort_order", {
      ascending: true,
    })
    .order("created_at", {
      ascending: true,
    });

  /*
   * تحميل الكورسات المنشورة
   * لحساب عدد الكورسات داخل
   * كل تصنيف.
   */
  const {
    data: coursesData,
    error: coursesError,
  } = await supabase
    .from("courses")
    .select("category")
    .eq("is_published", true);

  if (categoriesError) {
    console.error(
      "تعذر تحميل التصنيفات:",
      categoriesError
    );
  }

  if (coursesError) {
    console.error(
      "تعذر تحميل أعداد الكورسات:",
      coursesError
    );
  }

  const categories: CategoryRecord[] =
    categoriesError
      ? []
      : (
          categoriesData ?? []
        ).map((category) => ({
          id: String(
            category.id
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
        }));

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

  return (
    <section className="relative overflow-hidden bg-[#0B0B10] px-6 py-24 text-white">
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-purple-600/10 blur-[120px]" />

      <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        <SectionTitle
          align="center"
          badge="مجالات تناسب كل أهدافك"
          title="استكشف جميع"
          highlightedText="المجالات"
          description="اختر المجال الذي يناسبك وابدأ رحلة التعلم من خلال كورسات عملية ومسارات واضحة."
        />

        {categoriesError ? (
          <GlassCard
            hover={false}
            className="mt-14 border-red-500/20 bg-red-500/[0.05] px-6 py-16 text-center"
          >
            <BookOpen
              size={48}
              className="mx-auto text-red-300"
            />

            <h3 className="mt-5 text-2xl font-black text-red-300">
              تعذر تحميل التصنيفات
            </h3>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-400">
              حدث خطأ أثناء قراءة التصنيفات
              من قاعدة البيانات.
            </p>
          </GlassCard>
        ) : categories.length === 0 ? (
          <GlassCard
            hover={false}
            className="mt-14 px-6 py-16 text-center"
          >
            <BookOpen
              size={48}
              className="mx-auto text-purple-400"
            />

            <h3 className="mt-5 text-2xl font-black">
              لا توجد تصنيفات متاحة
            </h3>

            <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-400">
              سيتم عرض التصنيفات هنا بعد
              إضافتها ونشرها من لوحة الإدارة.
            </p>
          </GlassCard>
        ) : (
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                  <Link
                    key={category.id}
                    href={`/courses?category=${encodeURIComponent(
                      category.title
                    )}`}
                    className="block"
                  >
                    <GlassCard className="group relative h-full overflow-hidden p-6">
                      <div className="absolute -left-10 -top-10 h-28 w-28 rounded-full bg-purple-600/10 blur-3xl transition group-hover:bg-purple-600/20" />

                      <div className="relative">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 text-purple-400 transition duration-300 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white">
                            <Icon
                              size={27}
                            />
                          </div>

                          <ArrowLeft
                            size={19}
                            className="text-zinc-600 transition duration-300 group-hover:-translate-x-1 group-hover:text-purple-400"
                          />
                        </div>

                        <h3 className="mt-6 text-xl font-bold transition group-hover:text-purple-300">
                          {category.title}
                        </h3>

                        <p className="mt-2 min-h-12 text-sm leading-6 text-zinc-500">
                          {category.description ||
                            "استكشف الكورسات المتاحة داخل هذا التصنيف."}
                        </p>

                        <div className="mt-5 border-t border-white/10 pt-4">
                          <span className="text-sm font-semibold text-purple-400">
                            {formatNumber(
                              courseCount
                            )}{" "}
                            كورس
                          </span>
                        </div>
                      </div>
                    </GlassCard>
                  </Link>
                );
              }
            )}
          </div>
        )}

        <div className="mt-12 text-center">
          <Button
            href="/courses"
            variant="secondary"
            className="px-7 py-4"
          >
            عرض جميع الكورسات
            <ArrowLeft size={19} />
          </Button>
        </div>
      </div>
    </section>
  );
}
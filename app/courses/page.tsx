"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  RotateCcw,
  Search,
  SlidersHorizontal,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import CourseCard from "../../components/courses/CourseCard";
import { createClient } from "../../lib/supabase/client";

type CourseRecord = {
  id: string;
  slug: string;
  title: string;
  instructor: string;
  category: string;
  image: string;
  rating: number;
  students_count: number;
  duration: string;
  lessons_count: number;
};

const pathCategoryMap: Record<string, string> = {
  programming: "البرمجة",
  ai: "الذكاء الاصطناعي",
  languages: "اللغات",
  marketing: "التسويق الإلكتروني",
  "content-creation": "صناعة المحتوى",
  business: "إدارة الأعمال",
};

const pathTitleMap: Record<string, string> = {
  programming: "مسار البرمجة",
  ai: "مسار الذكاء الاصطناعي",
  languages: "مسار اللغات",
  marketing: "مسار التسويق",
  "content-creation": "مسار صناعة المحتوى",
  business: "مسار إدارة الأعمال",
};

const categoryAliasMap: Record<string, string> = {
  التسويق: "التسويق الإلكتروني",
};

function CoursesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const pathSlug = searchParams.get("path");
  const categoryParam =
    searchParams.get("category");

  const normalizedCategoryParam =
    categoryParam &&
    categoryAliasMap[categoryParam]
      ? categoryAliasMap[categoryParam]
      : categoryParam;

  const initialCategory =
    (pathSlug && pathCategoryMap[pathSlug]) ||
    normalizedCategoryParam ||
    "الكل";

  const activePathTitle =
    pathSlug && pathTitleMap[pathSlug]
      ? pathTitleMap[pathSlug]
      : null;

  const [search, setSearch] = useState("");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState(initialCategory);

  const [databaseCourses, setDatabaseCourses] =
    useState<CourseRecord[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [loadError, setLoadError] =
    useState("");

  const [reloadKey, setReloadKey] =
    useState(0);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    let isMounted = true;

    const loadCourses = async () => {
      setIsLoading(true);
      setLoadError("");

      const { data, error } = await supabase
        .from("courses")
        .select(
          `
            id,
            slug,
            title,
            instructor,
            category,
            image,
            rating,
            students_count,
            duration,
            lessons_count
          `
        )
        .order("created_at", {
          ascending: true,
        });

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(
          "تعذر تحميل الكورسات:",
          error
        );

        setLoadError(
          "تعذر تحميل الكورسات حاليًا. حاول مرة أخرى."
        );

        setDatabaseCourses([]);
        setIsLoading(false);

        return;
      }

      const formattedCourses: CourseRecord[] =
        (data ?? []).map((course) => ({
          id: String(course.id),
          slug: String(course.slug),
          title: String(course.title),
          instructor: String(course.instructor),
          category: String(course.category),
          image: String(course.image),
          rating: Number(course.rating),
          students_count: Number(
            course.students_count
          ),
          duration: String(course.duration),
          lessons_count: Number(
            course.lessons_count
          ),
        }));

      setDatabaseCourses(formattedCourses);
      setIsLoading(false);
    };

    void loadCourses();

    return () => {
      isMounted = false;
    };
  }, [reloadKey, supabase]);

  const visibleCategories = useMemo(() => {
    const courseCategories = Array.from(
      new Set(
        databaseCourses.map(
          (course) => course.category
        )
      )
    );

    const result = [
      "الكل",
      ...courseCategories,
    ];

    if (
      selectedCategory !== "الكل" &&
      !result.includes(selectedCategory)
    ) {
      result.splice(1, 0, selectedCategory);
    }

    return result;
  }, [databaseCourses, selectedCategory]);

  const filteredCourses = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    return databaseCourses.filter((course) => {
      const matchesSearch =
        course.title
          .toLowerCase()
          .includes(searchValue) ||
        course.category
          .toLowerCase()
          .includes(searchValue) ||
        course.instructor
          .toLowerCase()
          .includes(searchValue);

      const matchesCategory =
        selectedCategory === "الكل" ||
        course.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [
    databaseCourses,
    search,
    selectedCategory,
  ]);

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("الكل");

    router.replace("/courses", {
      scroll: false,
    });
  };

  const handleCategoryChange = (
    category: string
  ) => {
    setSelectedCategory(category);

    if (category === "الكل") {
      router.replace("/courses", {
        scroll: false,
      });

      return;
    }

    router.replace(
      `/courses?category=${encodeURIComponent(
        category
      )}`,
      {
        scroll: false,
      }
    );
  };

  const retryLoading = () => {
    setReloadKey(
      (currentValue) => currentValue + 1
    );
  };

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-20">
        <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-purple-600/10 blur-[120px]" />

        <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl text-center">
          <span className="text-sm font-bold text-purple-400">
            تعلم بلا حدود
          </span>

          <h1 className="mt-4 text-4xl font-black md:text-6xl">
            {activePathTitle ??
              (selectedCategory === "الكل"
                ? "جميع الكورسات"
                : `كورسات ${selectedCategory}`)}
          </h1>

          <p className="mx-auto mt-5 max-w-2xl leading-8 text-zinc-400">
            {activePathTitle
              ? `استكشف كورسات ${selectedCategory} وابدأ التعلم خطوة بخطوة.`
              : "اكتشف كورسات احترافية في مختلف المجالات وابدأ رحلة تطوير مهاراتك."}
          </p>

          <div className="mx-auto mt-10 flex max-w-2xl items-center rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl transition focus-within:border-purple-500/50">
            <Search
              className="mr-3 shrink-0 text-zinc-500"
              size={21}
            />

            <label
              htmlFor="course-search"
              className="sr-only"
            >
              البحث في الكورسات
            </label>

            <input
              id="course-search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="ابحث باسم الكورس أو المجال..."
              className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-zinc-600"
            />
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <SlidersHorizontal
                className="text-purple-400"
                size={21}
              />

              <h2 className="text-xl font-bold">
                اختر التصنيف
              </h2>
            </div>

            {(search ||
              selectedCategory !== "الكل") && (
              <button
                type="button"
                onClick={resetFilters}
                className="flex w-fit items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-zinc-300 transition duration-300 hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
              >
                <RotateCcw size={17} />
                إعادة ضبط الفلاتر
              </button>
            )}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {visibleCategories.map(
              (category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    handleCategoryChange(
                      category
                    )
                  }
                  className={`rounded-full border px-5 py-2 text-sm font-semibold transition duration-300 ${
                    selectedCategory ===
                    category
                      ? "border-purple-500 bg-purple-600 text-white shadow-lg shadow-purple-950/30"
                      : "border-white/10 bg-white/5 text-zinc-400 hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
                  }`}
                >
                  {category}
                </button>
              )
            )}
          </div>

          <div className="mt-12 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black">
                {selectedCategory === "الكل"
                  ? "الكورسات المتاحة"
                  : `كورسات ${selectedCategory}`}
              </h2>

              {activePathTitle && (
                <p className="mt-2 text-sm text-zinc-500">
                  أنت تستعرض الآن{" "}
                  {activePathTitle}
                </p>
              )}
            </div>

            {!isLoading && !loadError && (
              <span className="shrink-0 text-sm text-zinc-500">
                {filteredCourses.length} كورس
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-20 text-center backdrop-blur-xl">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-purple-500" />

              <p className="mt-5 font-bold text-zinc-300">
                جاري تحميل الكورسات...
              </p>
            </div>
          ) : loadError ? (
            <div className="mt-12 rounded-3xl border border-red-500/20 bg-red-500/[0.06] px-6 py-20 text-center">
              <h3 className="text-2xl font-bold text-red-300">
                تعذر تحميل الكورسات
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-400">
                {loadError}
              </p>

              <button
                type="button"
                onClick={retryLoading}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 font-bold transition hover:scale-105"
              >
                <RotateCcw size={18} />
                إعادة المحاولة
              </button>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="mt-8 grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCourses.map(
                (course) => (
                  <CourseCard
                    key={course.id}
                    slug={course.slug}
                    title={course.title}
                    instructor={
                      course.instructor
                    }
                    category={course.category}
                    image={course.image}
                    rating={course.rating}
                    students={new Intl.NumberFormat(
                      "en-US"
                    ).format(
                      course.students_count
                    )}
                    duration={course.duration}
                    lessons={
                      course.lessons_count
                    }
                  />
                )
              )}
            </div>
          ) : (
            <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.04] px-6 py-20 text-center backdrop-blur-xl">
              <Search
                size={42}
                className="mx-auto text-purple-400"
              />

              <h3 className="mt-5 text-2xl font-bold">
                لا توجد كورسات حاليًا
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-500">
                لا توجد كورسات متاحة في هذا
                التصنيف حاليًا، أو جرّب البحث
                بكلمة مختلفة.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 font-bold transition duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/30"
              >
                عرض جميع الكورسات
              </button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

function CoursesLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#09090B] px-6 text-white">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-purple-500" />

        <p className="mt-5 font-bold text-zinc-300">
          جاري تحميل الكورسات...
        </p>
      </div>
    </main>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<CoursesLoading />}>
      <CoursesContent />
    </Suspense>
  );
}
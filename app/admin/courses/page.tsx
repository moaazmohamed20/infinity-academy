import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Eye,
  EyeOff,
  Layers3,
  ListVideo,
  Pencil,
  Plus,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";

import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import GlassCard from "../../../components/ui/GlassCard";
import { createClient } from "../../../lib/supabase/server";

type CourseRecord = {
  id: string;
  slug: string;
  title: string;
  instructor: string;
  category: string;
  description: string | null;
  image: string;
  rating: number;
  students_count: number;
  duration: string;
  lessons_count: number;
  is_published: boolean;
  created_at: string;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(
    value
  );
}

export default async function AdminCoursesPage() {
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims) {
    redirect("/login");
  }

  const claims = claimsData.claims as Record<
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
    data: coursesData,
    error: coursesError,
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
        is_published,
        created_at
      `
    )
    .order("created_at", {
      ascending: false,
    });

  const courses: CourseRecord[] =
    coursesError
      ? []
      : (coursesData ?? []).map(
          (course) => ({
            id: String(course.id),
            slug: String(course.slug),
            title: String(course.title),

            instructor: String(
              course.instructor
            ),

            category: String(
              course.category
            ),

            description:
              course.description === null
                ? null
                : String(
                    course.description
                  ),

            image: String(course.image),
            rating: Number(course.rating),

            students_count: Number(
              course.students_count
            ),

            duration: String(
              course.duration
            ),

            lessons_count: Number(
              course.lessons_count
            ),

            is_published: Boolean(
              course.is_published
            ),

            created_at: String(
              course.created_at
            ),
          })
        );

  const publishedCourses =
    courses.filter(
      (course) => course.is_published
    ).length;

  const unpublishedCourses =
    courses.length - publishedCourses;

  const totalLessons = courses.reduce(
    (total, course) =>
      total + course.lessons_count,
    0
  );

  const totalStudents = courses.reduce(
    (total, course) =>
      total + course.students_count,
    0
  );

  const stats = [
    {
      title: "إجمالي الكورسات",
      value: courses.length.toString(),
      description: "كورس داخل المنصة",
      icon: BookOpen,
    },
    {
      title: "الكورسات المنشورة",
      value: publishedCourses.toString(),
      description: "متاحة للطلاب",
      icon: Eye,
    },
    {
      title: "غير المنشورة",
      value: unpublishedCourses.toString(),
      description: "مسودة أو مخفية",
      icon: EyeOff,
    },
    {
      title: "إجمالي الدروس",
      value: formatNumber(totalLessons),
      description: "درس تعليمي",
      icon: ListVideo,
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
                  إدارة الكورسات
                </h1>

                <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                  عرض الكورسات وتعديل بياناتها
                  وإدارة الدروس الخاصة بكل كورس.
                </p>
              </div>
            </div>

            <Link
              href="/admin/courses/new"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] hover:shadow-purple-600/20"
            >
              <Plus size={20} />
              إضافة كورس جديد
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

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
            className="mt-6 flex flex-col gap-5 border-blue-500/20 bg-blue-500/[0.04] p-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Users size={23} />
              </div>

              <div>
                <p className="font-black">
                  عدد الطلاب المعروض داخل الكورسات
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  مجموع أعداد الطلاب المسجلة في
                  بيانات الكورسات.
                </p>
              </div>
            </div>

            <p className="text-3xl font-black text-blue-400">
              {formatNumber(totalStudents)}
            </p>
          </GlassCard>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-purple-400">
                محتوى المنصة
              </p>

              <h2 className="mt-2 text-3xl font-black">
                جميع الكورسات
              </h2>

              <p className="mt-3 text-zinc-400">
                يمكنك فتح أي كورس لتعديل بياناته
                أو إدارة دروسه.
              </p>
            </div>

            <span className="shrink-0 text-sm text-zinc-500">
              {courses.length} كورس
            </span>
          </div>

          {coursesError ? (
            <GlassCard
              hover={false}
              className="mt-8 border-red-500/20 bg-red-500/[0.05] px-6 py-16 text-center"
            >
              <h3 className="text-2xl font-black text-red-300">
                تعذر تحميل الكورسات
              </h3>

              <p className="mt-3 text-zinc-400">
                حدث خطأ أثناء قراءة بيانات
                الكورسات من قاعدة البيانات.
              </p>
            </GlassCard>
          ) : courses.length === 0 ? (
            <GlassCard
              hover={false}
              className="mt-8 px-6 py-16 text-center"
            >
              <BookOpen
                size={48}
                className="mx-auto text-purple-400"
              />

              <h3 className="mt-5 text-2xl font-black">
                لا توجد كورسات
              </h3>

              <p className="mx-auto mt-3 max-w-xl leading-7 text-zinc-400">
                أضف أول كورس داخل المنصة وابدأ
                تجهيز المحتوى التعليمي.
              </p>

              <Link
                href="/admin/courses/new"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black"
              >
                <Plus size={19} />
                إضافة أول كورس
              </Link>
            </GlassCard>
          ) : (
            <div className="mt-8 grid gap-7 md:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <GlassCard
                  key={course.id}
                  as="article"
                  className="group overflow-hidden p-0"
                >
                  <div className="relative h-56 overflow-hidden">
                    <Image
                      src={course.image}
                      alt={course.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-110"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                    <span
                      className={`absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold backdrop-blur-xl ${
                        course.is_published
                          ? "border-emerald-500/20 bg-emerald-500/15 text-emerald-300"
                          : "border-orange-500/20 bg-orange-500/15 text-orange-300"
                      }`}
                    >
                      {course.is_published ? (
                        <Eye size={14} />
                      ) : (
                        <EyeOff size={14} />
                      )}

                      {course.is_published
                        ? "منشور"
                        : "غير منشور"}
                    </span>

                    <span className="absolute bottom-4 right-4 rounded-full border border-white/10 bg-black/60 px-3 py-2 text-xs font-bold backdrop-blur-xl">
                      {course.category}
                    </span>
                  </div>

                  <div className="p-6">
                    <h3 className="min-h-14 text-xl font-black leading-7">
                      {course.title}
                    </h3>

                    <p className="mt-2 text-sm text-zinc-500">
                      {course.instructor}
                    </p>

                    <p className="mt-4 line-clamp-2 min-h-12 text-sm leading-6 text-zinc-400">
                      {course.description ||
                        "لم تتم إضافة وصف لهذا الكورس."}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <ListVideo size={16} />
                          الدروس
                        </div>

                        <p className="mt-2 font-black">
                          {course.lessons_count}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Clock3 size={16} />
                          المدة
                        </div>

                        <p className="mt-2 font-black">
                          {course.duration}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Star
                            size={16}
                            className="fill-yellow-400 text-yellow-400"
                          />
                          التقييم
                        </div>

                        <p className="mt-2 font-black">
                          {course.rating}
                        </p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center gap-2 text-zinc-500">
                          <Users size={16} />
                          الطلاب
                        </div>

                        <p className="mt-2 font-black">
                          {formatNumber(
                            course.students_count
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:brightness-110"
                      >
                        <Pencil size={17} />
                        تعديل الكورس
                      </Link>

                      <Link
                        href={`/admin/lessons?course=${course.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-black text-zinc-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
                      >
                        <Layers3 size={17} />
                        إدارة الدروس
                      </Link>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
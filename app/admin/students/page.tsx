import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Mail,
  RotateCcw,
  Search,
  ShieldCheck,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";

import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import GlassCard from "../../../components/ui/GlassCard";
import { createClient } from "../../../lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    q?: string | string[];
    role?: string | string[];
  }>;
};

type StudentRecord = {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  joined_at: string;
  enrollments_count: number;
  active_enrollments: number;
  completed_enrollments: number;
  average_progress: number;
};

type EnrollmentRecord = {
  enrollment_id: string;
  user_id: string;
  course_id: string;
  course_title: string;
  course_slug: string;
  status: "active" | "completed";
  progress: number;
  enrolled_at: string;
  completed_at: string | null;
};

type StudentRpcRow = {
  user_id: unknown;
  full_name: unknown;
  email: unknown;
  role: unknown;
  joined_at: unknown;
  enrollments_count: unknown;
  active_enrollments: unknown;
  completed_enrollments: unknown;
  average_progress: unknown;
};

type EnrollmentRpcRow = {
  enrollment_id: unknown;
  user_id: unknown;
  course_id: unknown;
  course_title: unknown;
  course_slug: unknown;
  status: unknown;
  progress: unknown;
  enrolled_at: unknown;
  completed_at: unknown;
};

function getSingleParameter(
  value: string | string[] | undefined
) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parsedDate);
}

function getInitial(name: string) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return "ط";
  }

  return trimmedName.charAt(0);
}

function normalizeProgress(progress: number) {
  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round(progress))
  );
}

export default async function AdminStudentsPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams =
    await searchParams;

  const searchQuery = getSingleParameter(
    resolvedSearchParams.q
  )
    .trim()
    .toLowerCase();

  const roleFilter = getSingleParameter(
    resolvedSearchParams.role
  );

  const selectedRole = [
    "all",
    "student",
    "admin",
  ].includes(roleFilter)
    ? roleFilter
    : "all";

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

  const [
    {
      data: studentsData,
      error: studentsError,
    },
    {
      data: enrollmentsData,
      error: enrollmentsError,
    },
  ] = await Promise.all([
    supabase.rpc("get_admin_students"),
    supabase.rpc(
      "get_admin_enrollments"
    ),
  ]);

  if (studentsError) {
    console.error(
      "تعذر تحميل الطلاب:",
      studentsError
    );
  }

  if (enrollmentsError) {
    console.error(
      "تعذر تحميل الاشتراكات:",
      enrollmentsError
    );
  }

  const studentRows =
    (studentsData ?? []) as StudentRpcRow[];

  const enrollmentRows =
    (enrollmentsData ??
      []) as EnrollmentRpcRow[];

  const students: StudentRecord[] =
    studentsError
      ? []
      : studentRows.map((student) => ({
          user_id: String(
            student.user_id
          ),

          full_name: String(
            student.full_name || "طالب"
          ),

          email: String(
            student.email || ""
          ),

          role: String(
            student.role || "student"
          ),

          joined_at: String(
            student.joined_at
          ),

          enrollments_count: Number(
            student.enrollments_count
          ),

          active_enrollments: Number(
            student.active_enrollments
          ),

          completed_enrollments: Number(
            student.completed_enrollments
          ),

          average_progress:
            normalizeProgress(
              Number(
                student.average_progress
              )
            ),
        }));

  const enrollments: EnrollmentRecord[] =
    enrollmentsError
      ? []
      : enrollmentRows.map(
          (enrollment) => ({
            enrollment_id: String(
              enrollment.enrollment_id
            ),

            user_id: String(
              enrollment.user_id
            ),

            course_id: String(
              enrollment.course_id
            ),

            course_title: String(
              enrollment.course_title
            ),

            course_slug: String(
              enrollment.course_slug
            ),

            status:
              enrollment.status ===
              "completed"
                ? "completed"
                : "active",

            progress:
              normalizeProgress(
                Number(
                  enrollment.progress
                )
              ),

            enrolled_at: String(
              enrollment.enrolled_at
            ),

            completed_at:
              enrollment.completed_at
                ? String(
                    enrollment.completed_at
                  )
                : null,
          })
        );

  const enrollmentsByUser = new Map<
    string,
    EnrollmentRecord[]
  >();

  enrollments.forEach((enrollment) => {
    const currentEnrollments =
      enrollmentsByUser.get(
        enrollment.user_id
      ) ?? [];

    currentEnrollments.push(
      enrollment
    );

    enrollmentsByUser.set(
      enrollment.user_id,
      currentEnrollments
    );
  });

  const filteredStudents =
    students.filter((student) => {
      const matchesRole =
        selectedRole === "all" ||
        student.role === selectedRole;

      const searchableText =
        `${student.full_name} ${student.email}`.toLowerCase();

      const matchesSearch =
        !searchQuery ||
        searchableText.includes(
          searchQuery
        );

      return (
        matchesRole && matchesSearch
      );
    });

  const totalAccounts = students.length;

  const studentAccounts =
    students.filter(
      (student) =>
        student.role !== "admin"
    ).length;

  const subscribedStudents =
    students.filter(
      (student) =>
        student.enrollments_count > 0
    ).length;

  const completedEnrollments =
    enrollments.filter(
      (enrollment) =>
        enrollment.status ===
        "completed"
    ).length;

  const averagePlatformProgress =
    enrollments.length > 0
      ? Math.round(
          enrollments.reduce(
            (total, enrollment) =>
              total +
              enrollment.progress,
            0
          ) / enrollments.length
        )
      : 0;

  const stats = [
    {
      title: "إجمالي الحسابات",
      value: totalAccounts,
      description:
        "جميع الحسابات المسجلة",
      icon: UsersRound,
    },
    {
      title: "حسابات الطلاب",
      value: studentAccounts,
      description:
        "حسابات من نوع طالب",
      icon: GraduationCap,
    },
    {
      title: "طلاب لديهم كورسات",
      value: subscribedStudents,
      description:
        "مسجلون في كورس أو أكثر",
      icon: BookOpen,
    },
    {
      title: "الكورسات المكتملة",
      value: completedEnrollments,
      description:
        "إجمالي مرات الإكمال",
      icon: Trophy,
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

          <div className="mt-7 flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
              <ShieldCheck size={31} />
            </div>

            <div>
              <p className="text-sm font-bold text-purple-400">
                لوحة الإدارة
              </p>

              <h1 className="mt-2 text-3xl font-black md:text-5xl">
                إدارة الطلاب
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                عرض حسابات الطلاب والكورسات
                المسجلين فيها ونسب تقدمهم.
              </p>
            </div>
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
            className="mt-6 flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Activity size={23} />
              </div>

              <div>
                <p className="font-black">
                  متوسط تقدم المنصة
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  متوسط جميع الاشتراكات
                  الحالية
                </p>
              </div>
            </div>

            <div className="w-full max-w-xl">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-zinc-500">
                  نسبة الإنجاز
                </span>

                <span className="font-black text-blue-400">
                  {averagePlatformProgress}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-blue-500 to-indigo-500"
                  style={{
                    width: `${averagePlatformProgress}%`,
                  }}
                />
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="px-6 pb-8">
        <div className="mx-auto max-w-7xl">
          <GlassCard
            hover={false}
            className="p-6"
          >
            <form className="grid gap-4 lg:grid-cols-[1fr_220px_auto_auto]">
              <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                <Search
                  size={19}
                  className="shrink-0 text-zinc-600"
                />

                <input
                  name="q"
                  type="search"
                  defaultValue={searchQuery}
                  placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                  className="w-full bg-transparent px-3 py-4 outline-none placeholder:text-zinc-700"
                />
              </div>

              <select
                name="role"
                defaultValue={selectedRole}
                className="rounded-xl border border-white/10 bg-[#111114] px-4 py-4 font-bold outline-none transition focus:border-purple-500/60"
              >
                <option value="all">
                  جميع الحسابات
                </option>

                <option value="student">
                  الطلاب
                </option>

                <option value="admin">
                  المديرون
                </option>
              </select>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-black transition hover:brightness-110"
              >
                <Search size={18} />
                بحث
              </button>

              <Link
                href="/admin/students"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-4 font-bold text-zinc-300 transition hover:border-purple-500/40 hover:bg-purple-500/10"
              >
                <RotateCcw size={18} />
                مسح
              </Link>
            </form>
          </GlassCard>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-purple-400">
                حسابات المنصة
              </p>

              <h2 className="mt-2 text-3xl font-black">
                قائمة الطلاب
              </h2>

              <p className="mt-3 text-zinc-500">
                تم العثور على{" "}
                {filteredStudents.length} حساب.
              </p>
            </div>
          </div>

          {studentsError ? (
            <GlassCard
              hover={false}
              className="mt-8 border-red-500/20 bg-red-500/[0.05] px-6 py-16 text-center"
            >
              <h3 className="text-2xl font-black text-red-300">
                تعذر تحميل بيانات الطلاب
              </h3>

              <p className="mt-3 text-zinc-400">
                حدث خطأ أثناء قراءة الحسابات
                من قاعدة البيانات.
              </p>
            </GlassCard>
          ) : filteredStudents.length >
            0 ? (
            <div className="mt-8 space-y-6">
              {filteredStudents.map(
                (student) => {
                  const studentEnrollments =
                    enrollmentsByUser.get(
                      student.user_id
                    ) ?? [];

                  return (
                    <GlassCard
                      key={student.user_id}
                      hover={false}
                      className="overflow-hidden p-0"
                    >
                      <div className="flex flex-col gap-6 border-b border-white/10 p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-xl font-black shadow-lg shadow-purple-950/30">
                            {getInitial(
                              student.full_name
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="truncate text-xl font-black">
                                {
                                  student.full_name
                                }
                              </h3>

                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-bold ${
                                  student.role ===
                                  "admin"
                                    ? "border-purple-500/30 bg-purple-500/10 text-purple-300"
                                    : "border-blue-500/30 bg-blue-500/10 text-blue-300"
                                }`}
                              >
                                {student.role ===
                                "admin"
                                  ? "مدير"
                                  : "طالب"}
                              </span>
                            </div>

                            <div className="mt-3 flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:items-center sm:gap-5">
                              <span className="flex items-center gap-2">
                                <Mail
                                  size={15}
                                />

                                {student.email ||
                                  "لا يوجد بريد"}
                              </span>

                              <span className="flex items-center gap-2">
                                <CalendarDays
                                  size={15}
                                />

                                انضم في{" "}
                                {formatDate(
                                  student.joined_at
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                            <p className="text-2xl font-black">
                              {
                                student.enrollments_count
                              }
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              كورسات
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                            <p className="text-2xl font-black text-blue-400">
                              {
                                student.active_enrollments
                              }
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              نشطة
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                            <p className="text-2xl font-black text-emerald-400">
                              {
                                student.completed_enrollments
                              }
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              مكتملة
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-center">
                            <p className="text-2xl font-black text-purple-400">
                              {
                                student.average_progress
                              }
                              %
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              متوسط التقدم
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                            <BookOpen size={19} />
                          </div>

                          <div>
                            <h4 className="font-black">
                              كورسات الحساب
                            </h4>

                            <p className="mt-1 text-xs text-zinc-500">
                              الاشتراكات ونسب
                              الإنجاز
                            </p>
                          </div>
                        </div>

                        {enrollmentsError ? (
                          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/[0.05] p-5 text-sm text-red-300">
                            تعذر تحميل اشتراكات
                            الحساب.
                          </div>
                        ) : studentEnrollments.length >
                          0 ? (
                          <div className="mt-6 grid gap-4 lg:grid-cols-2">
                            {studentEnrollments.map(
                              (enrollment) => (
                                <div
                                  key={
                                    enrollment.enrollment_id
                                  }
                                  className="rounded-2xl border border-white/10 bg-black/20 p-5"
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <Link
                                        href={`/courses/${enrollment.course_slug}`}
                                        className="font-black transition hover:text-purple-400"
                                      >
                                        {
                                          enrollment.course_title
                                        }
                                      </Link>

                                      <p className="mt-2 text-xs text-zinc-600">
                                        تاريخ التسجيل:{" "}
                                        {formatDate(
                                          enrollment.enrolled_at
                                        )}
                                      </p>
                                    </div>

                                    <span
                                      className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold ${
                                        enrollment.status ===
                                        "completed"
                                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                          : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                                      }`}
                                    >
                                      {enrollment.status ===
                                      "completed" ? (
                                        <CheckCircle2
                                          size={
                                            13
                                          }
                                        />
                                      ) : (
                                        <Clock3
                                          size={
                                            13
                                          }
                                        />
                                      )}

                                      {enrollment.status ===
                                      "completed"
                                        ? "مكتمل"
                                        : "قيد التعلم"}
                                    </span>
                                  </div>

                                  <div className="mt-5 flex items-center justify-between text-sm">
                                    <span className="text-zinc-500">
                                      نسبة التقدم
                                    </span>

                                    <span className="font-black text-purple-400">
                                      {
                                        enrollment.progress
                                      }
                                      %
                                    </span>
                                  </div>

                                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-zinc-800">
                                    <div
                                      className="h-full rounded-full bg-gradient-to-l from-purple-600 to-indigo-600"
                                      style={{
                                        width: `${enrollment.progress}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : (
                          <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-5 text-sm text-zinc-500">
                            <UserRound
                              size={19}
                              className="shrink-0 text-zinc-600"
                            />

                            هذا الحساب غير مسجل
                            في أي كورس حتى الآن.
                          </div>
                        )}
                      </div>
                    </GlassCard>
                  );
                }
              )}
            </div>
          ) : (
            <GlassCard
              hover={false}
              className="mt-8 px-6 py-16 text-center"
            >
              <UsersRound
                size={48}
                className="mx-auto text-purple-400"
              />

              <h3 className="mt-5 text-2xl font-black">
                لا توجد نتائج
              </h3>

              <p className="mt-3 text-zinc-400">
                لم نجد حسابات مطابقة لعملية
                البحث الحالية.
              </p>

              <Link
                href="/admin/students"
                className="mt-7 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-bold transition hover:border-purple-500/40 hover:bg-purple-500/10"
              >
                <RotateCcw size={18} />
                عرض جميع الحسابات
              </Link>
            </GlassCard>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
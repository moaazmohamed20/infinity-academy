import Link from "next/link";
import { revalidatePath } from "next/cache";
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
  Pencil,
  Plus,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  Trophy,
  UserRound,
} from "lucide-react";

import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import GlassCard from "../../../components/ui/GlassCard";
import { createClient } from "../../../lib/supabase/server";

type PageProps = {
  searchParams: Promise<{
    q?: string | string[];
    status?: string | string[];
    success?: string | string[];
    error?: string | string[];
  }>;
};

type StudentRpcRow = {
  user_id: unknown;
  full_name: unknown;
  email: unknown;
  role: unknown;
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

type CourseRpcRow = {
  id: unknown;
  title: unknown;
  slug: unknown;
  category: unknown;
};

type StudentRecord = {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
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

type CourseRecord = {
  id: string;
  title: string;
  slug: string;
  category: string;
};

function getSingleParameter(
  value: string | string[] | undefined
) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function getFormValue(
  formData: FormData,
  name: string
) {
  return String(
    formData.get(name) ?? ""
  ).trim();
}

function normalizeProgress(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, Math.round(value))
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "غير محدد";
  }

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function redirectWithError(
  message: string
): never {
  redirect(
    `/admin/subscriptions?error=${encodeURIComponent(
      message
    )}`
  );
}

async function getAdminClient() {
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

async function createEnrollmentAction(
  formData: FormData
) {
  "use server";

  const supabase =
    await getAdminClient();

  const selectedUserId =
    getFormValue(formData, "user_id");

  const selectedCourseId =
    getFormValue(
      formData,
      "course_id"
    );

  if (
    !selectedUserId ||
    !selectedCourseId
  ) {
    redirectWithError(
      "اختر الحساب والكورس أولًا."
    );
  }

  const { error } = await supabase.rpc(
    "admin_create_enrollment",
    {
      p_user_id: selectedUserId,
      p_course_id: selectedCourseId,
    }
  );

  if (error) {
    console.error(
      "تعذر إضافة الاشتراك:",
      error
    );

    redirectWithError(
      error.message ||
        "تعذر إضافة الاشتراك."
    );
  }

  revalidatePath(
    "/admin/subscriptions"
  );

  revalidatePath("/admin/students");
  revalidatePath("/dashboard");

  redirect(
    "/admin/subscriptions?success=created"
  );
}

async function updateEnrollmentAction(
  enrollmentId: string,
  formData: FormData
) {
  "use server";

  const supabase =
    await getAdminClient();

  const progress = Number(
    getFormValue(
      formData,
      "progress"
    )
  );

  const status = getFormValue(
    formData,
    "status"
  );

  if (
    !Number.isInteger(progress) ||
    progress < 0 ||
    progress > 100
  ) {
    redirectWithError(
      "نسبة التقدم يجب أن تكون رقمًا من 0 إلى 100."
    );
  }

  if (
    status !== "active" &&
    status !== "completed"
  ) {
    redirectWithError(
      "حالة الاشتراك غير صحيحة."
    );
  }

  const { error } = await supabase.rpc(
    "admin_update_enrollment",
    {
      p_enrollment_id:
        enrollmentId,
      p_progress: progress,
      p_status: status,
    }
  );

  if (error) {
    console.error(
      "تعذر تعديل الاشتراك:",
      error
    );

    redirectWithError(
      error.message ||
        "تعذر تعديل الاشتراك."
    );
  }

  revalidatePath(
    "/admin/subscriptions"
  );

  revalidatePath("/admin/students");
  revalidatePath("/dashboard");

  redirect(
    "/admin/subscriptions?success=updated"
  );
}

async function deleteEnrollmentAction(
  enrollmentId: string,
  _formData: FormData
) {
  "use server";

  const supabase =
    await getAdminClient();

  const { error } = await supabase.rpc(
    "admin_delete_enrollment",
    {
      p_enrollment_id:
        enrollmentId,
    }
  );

  if (error) {
    console.error(
      "تعذر حذف الاشتراك:",
      error
    );

    redirectWithError(
      error.message ||
        "تعذر حذف الاشتراك."
    );
  }

  revalidatePath(
    "/admin/subscriptions"
  );

  revalidatePath("/admin/students");
  revalidatePath("/dashboard");

  redirect(
    "/admin/subscriptions?success=deleted"
  );
}

export default async function AdminSubscriptionsPage({
  searchParams,
}: PageProps) {
  const resolvedSearchParams =
    await searchParams;

  const query = getSingleParameter(
    resolvedSearchParams.q
  )
    .trim()
    .toLowerCase();

  const requestedStatus =
    getSingleParameter(
      resolvedSearchParams.status
    );

  const selectedStatus = [
    "all",
    "active",
    "completed",
  ].includes(requestedStatus)
    ? requestedStatus
    : "all";

  const success = getSingleParameter(
    resolvedSearchParams.success
  );

  const errorMessage =
    getSingleParameter(
      resolvedSearchParams.error
    );

  const supabase =
    await getAdminClient();

  const [
    studentsResult,
    enrollmentsResult,
    coursesResult,
  ] = await Promise.all([
    supabase.rpc(
      "get_admin_students"
    ),

    supabase.rpc(
      "get_admin_enrollments"
    ),

    supabase
      .from("courses")
      .select(
        `
          id,
          title,
          slug,
          category
        `
      )
      .order("title", {
        ascending: true,
      }),
  ]);

  const studentsError =
    studentsResult.error;

  const enrollmentsError =
    enrollmentsResult.error;

  const coursesError =
    coursesResult.error;

  if (studentsError) {
    console.error(
      "تعذر تحميل الحسابات:",
      studentsError
    );
  }

  if (enrollmentsError) {
    console.error(
      "تعذر تحميل الاشتراكات:",
      enrollmentsError
    );
  }

  if (coursesError) {
    console.error(
      "تعذر تحميل الكورسات:",
      coursesError
    );
  }

  const studentRows =
    (studentsResult.data ??
      []) as StudentRpcRow[];

  const enrollmentRows =
    (enrollmentsResult.data ??
      []) as EnrollmentRpcRow[];

  const courseRows =
    (coursesResult.data ??
      []) as CourseRpcRow[];

  const students: StudentRecord[] =
    studentsError
      ? []
      : studentRows.map(
          (
            student: StudentRpcRow
          ) => ({
            user_id: String(
              student.user_id
            ),

            full_name: String(
              student.full_name ||
                "طالب"
            ),

            email: String(
              student.email || ""
            ),

            role: String(
              student.role ||
                "student"
            ),
          })
        );

  const courses: CourseRecord[] =
    coursesError
      ? []
      : courseRows.map(
          (course: CourseRpcRow) => ({
            id: String(course.id),

            title: String(
              course.title
            ),

            slug: String(
              course.slug
            ),

            category: String(
              course.category
            ),
          })
        );

  const enrollments: EnrollmentRecord[] =
    enrollmentsError
      ? []
      : enrollmentRows.map(
          (
            enrollment: EnrollmentRpcRow
          ) => ({
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

  const studentsMap = new Map(
    students.map((student) => [
      student.user_id,
      student,
    ])
  );

  const filteredEnrollments =
    enrollments.filter(
      (enrollment) => {
        const student =
          studentsMap.get(
            enrollment.user_id
          );

        const matchesStatus =
          selectedStatus === "all" ||
          enrollment.status ===
            selectedStatus;

        const searchableText = [
          student?.full_name ?? "",
          student?.email ?? "",
          enrollment.course_title,
        ]
          .join(" ")
          .toLowerCase();

        const matchesQuery =
          !query ||
          searchableText.includes(
            query
          );

        return (
          matchesStatus &&
          matchesQuery
        );
      }
    );

  const activeEnrollments =
    enrollments.filter(
      (enrollment) =>
        enrollment.status ===
        "active"
    ).length;

  const completedEnrollments =
    enrollments.filter(
      (enrollment) =>
        enrollment.status ===
        "completed"
    ).length;

  const subscribedAccounts =
    new Set(
      enrollments.map(
        (enrollment) =>
          enrollment.user_id
      )
    ).size;

  const averageProgress =
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
      title: "إجمالي الاشتراكات",
      value: enrollments.length,
      description:
        "اشتراكات الكورسات",
      icon: BookOpen,
    },
    {
      title: "اشتراكات نشطة",
      value: activeEnrollments,
      description:
        "كورسات قيد التعلم",
      icon: Clock3,
    },
    {
      title: "اشتراكات مكتملة",
      value: completedEnrollments,
      description:
        "كورسات تم إكمالها",
      icon: Trophy,
    },
    {
      title: "الحسابات المشتركة",
      value: subscribedAccounts,
      description:
        "حسابات لديها كورسات",
      icon: GraduationCap,
    },
  ];

  const successMessages: Record<
    string,
    string
  > = {
    created:
      "تمت إضافة الاشتراك بنجاح، أو كان الاشتراك موجودًا بالفعل.",

    updated:
      "تم تعديل الاشتراك بنجاح.",

    deleted:
      "تم حذف الاشتراك بنجاح.",
  };

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
                إدارة الاشتراكات
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                أضف اشتراكات الطلاب وعدّل
                الحالة ونسبة التقدم.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-7xl">
          {successMessages[success] && (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 font-bold text-emerald-300">
              <CheckCircle2 size={20} />
              {successMessages[success]}
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 font-bold leading-7 text-red-300">
              {errorMessage}
            </div>
          )}

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
                  متوسط تقدم الاشتراكات
                </p>

                <p className="mt-1 text-sm text-zinc-500">
                  متوسط نسب الإنجاز داخل
                  جميع الكورسات
                </p>
              </div>
            </div>

            <div className="w-full max-w-xl">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-zinc-500">
                  نسبة الإنجاز
                </span>

                <span className="font-black text-blue-400">
                  {averageProgress}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-l from-blue-500 to-indigo-500"
                  style={{
                    width: `${averageProgress}%`,
                  }}
                />
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="mx-auto max-w-7xl">
          <GlassCard
            hover={false}
            className="p-7"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <Plus size={23} />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  إضافة اشتراك
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  اختر الحساب والكورس المراد
                  إضافته.
                </p>
              </div>
            </div>

            <form
              action={createEnrollmentAction}
              className="mt-7 grid gap-4 lg:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <label
                  htmlFor="user_id"
                  className="mb-2 block text-sm font-bold text-zinc-300"
                >
                  الحساب
                </label>

                <select
                  id="user_id"
                  name="user_id"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-white/10 bg-[#111114] px-4 py-4 outline-none transition focus:border-purple-500/60"
                >
                  <option
                    value=""
                    disabled
                  >
                    اختر الحساب
                  </option>

                  {students.map(
                    (student) => (
                      <option
                        key={
                          student.user_id
                        }
                        value={
                          student.user_id
                        }
                      >
                        {
                          student.full_name
                        }{" "}
                        —{" "}
                        {student.email ||
                          "بدون بريد"}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="course_id"
                  className="mb-2 block text-sm font-bold text-zinc-300"
                >
                  الكورس
                </label>

                <select
                  id="course_id"
                  name="course_id"
                  required
                  defaultValue=""
                  className="w-full rounded-xl border border-white/10 bg-[#111114] px-4 py-4 outline-none transition focus:border-purple-500/60"
                >
                  <option
                    value=""
                    disabled
                  >
                    اختر الكورس
                  </option>

                  {courses.map(
                    (course) => (
                      <option
                        key={course.id}
                        value={course.id}
                      >
                        {course.title}
                      </option>
                    )
                  )}
                </select>
              </div>

              <button
                type="submit"
                disabled={
                  students.length === 0 ||
                  courses.length === 0
                }
                className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={19} />
                إضافة الاشتراك
              </button>
            </form>
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
                  defaultValue={query}
                  placeholder="ابحث باسم الطالب أو البريد أو الكورس..."
                  className="w-full bg-transparent px-3 py-4 outline-none placeholder:text-zinc-700"
                />
              </div>

              <select
                name="status"
                defaultValue={
                  selectedStatus
                }
                className="rounded-xl border border-white/10 bg-[#111114] px-4 py-4 font-bold outline-none transition focus:border-purple-500/60"
              >
                <option value="all">
                  جميع الحالات
                </option>

                <option value="active">
                  قيد التعلم
                </option>

                <option value="completed">
                  مكتمل
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
                href="/admin/subscriptions"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-4 font-bold transition hover:border-purple-500/40 hover:bg-purple-500/10"
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
          <div>
            <p className="text-sm font-bold text-purple-400">
              اشتراكات المنصة
            </p>

            <h2 className="mt-2 text-3xl font-black">
              قائمة الاشتراكات
            </h2>

            <p className="mt-3 text-zinc-500">
              تم العثور على{" "}
              {filteredEnrollments.length}{" "}
              اشتراك.
            </p>
          </div>

          {enrollmentsError ? (
            <GlassCard
              hover={false}
              className="mt-8 border-red-500/20 bg-red-500/[0.05] px-6 py-16 text-center"
            >
              <h3 className="text-2xl font-black text-red-300">
                تعذر تحميل الاشتراكات
              </h3>
            </GlassCard>
          ) : filteredEnrollments.length >
            0 ? (
            <div className="mt-8 space-y-5">
              {filteredEnrollments.map(
                (enrollment) => {
                  const student =
                    studentsMap.get(
                      enrollment.user_id
                    );

                  const updateAction =
                    updateEnrollmentAction.bind(
                      null,
                      enrollment.enrollment_id
                    );

                  const deleteAction =
                    deleteEnrollmentAction.bind(
                      null,
                      enrollment.enrollment_id
                    );

                  return (
                    <GlassCard
                      key={
                        enrollment.enrollment_id
                      }
                      hover={false}
                      className="p-6"
                    >
                      <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                              <UserRound
                                size={23}
                              />
                            </div>

                            <div className="min-w-0">
                              <h3 className="text-xl font-black">
                                {student?.full_name ||
                                  "حساب غير معروف"}
                              </h3>

                              <p className="mt-2 flex items-center gap-2 text-sm text-zinc-500">
                                <Mail
                                  size={15}
                                />

                                {student?.email ||
                                  "لا يوجد بريد"}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <Link
                                  href={`/courses/${enrollment.course_slug}`}
                                  className="text-lg font-black transition hover:text-purple-400"
                                >
                                  {
                                    enrollment.course_title
                                  }
                                </Link>

                                <p className="mt-2 flex items-center gap-2 text-sm text-zinc-600">
                                  <CalendarDays
                                    size={
                                      15
                                    }
                                  />

                                  تاريخ التسجيل:{" "}
                                  {formatDate(
                                    enrollment.enrolled_at
                                  )}
                                </p>
                              </div>

                              <span
                                className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold ${
                                  enrollment.status ===
                                  "completed"
                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                                    : "border-blue-500/30 bg-blue-500/10 text-blue-400"
                                }`}
                              >
                                {enrollment.status ===
                                "completed" ? (
                                  <CheckCircle2
                                    size={14}
                                  />
                                ) : (
                                  <Clock3
                                    size={14}
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
                        </div>

                        <div className="w-full xl:max-w-md">
                          <form
                            action={
                              updateAction
                            }
                            className="grid gap-4 rounded-2xl border border-white/10 bg-black/20 p-5 sm:grid-cols-2"
                          >
                            <div>
                              <label className="mb-2 block text-xs font-bold text-zinc-500">
                                نسبة التقدم
                              </label>

                              <input
                                name="progress"
                                type="number"
                                min="0"
                                max="100"
                                step="1"
                                required
                                defaultValue={
                                  enrollment.progress
                                }
                                className="w-full rounded-xl border border-white/10 bg-[#111114] px-4 py-3 outline-none focus:border-purple-500/60"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-xs font-bold text-zinc-500">
                                الحالة
                              </label>

                              <select
                                name="status"
                                defaultValue={
                                  enrollment.status
                                }
                                className="w-full rounded-xl border border-white/10 bg-[#111114] px-4 py-3 outline-none focus:border-purple-500/60"
                              >
                                <option value="active">
                                  قيد التعلم
                                </option>

                                <option value="completed">
                                  مكتمل
                                </option>
                              </select>
                            </div>

                            <button
                              type="submit"
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 font-black transition hover:brightness-110 sm:col-span-2"
                            >
                              <Pencil
                                size={17}
                              />
                              حفظ التعديل
                            </button>
                          </form>

                          <form
                            action={deleteAction}
                            className="mt-3"
                          >
                            <button
                              type="submit"
                              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-5 py-3 font-bold text-red-300 transition hover:bg-red-500/10"
                            >
                              <Trash2
                                size={17}
                              />
                              حذف الاشتراك
                            </button>
                          </form>
                        </div>
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
              <BookOpen
                size={48}
                className="mx-auto text-purple-400"
              />

              <h3 className="mt-5 text-2xl font-black">
                لا توجد اشتراكات
              </h3>

              <p className="mt-3 text-zinc-400">
                لم نجد اشتراكات مطابقة
                للبحث الحالي.
              </p>
            </GlassCard>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
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
  Briefcase,
  Building2,
  Camera,
  CheckCircle2,
  Clapperboard,
  Code2,
  GraduationCap,
  Languages,
  Laptop,
  ListOrdered,
  Music4,
  Palette,
  Save,
  ShieldCheck,
  ShoppingCart,
  Tag,
  Tags,
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

const iconOptions = [
  {
    value: "Code2",
    label: "البرمجة",
    icon: Code2,
  },
  {
    value: "Languages",
    label: "اللغات",
    icon: Languages,
  },
  {
    value: "Music4",
    label: "الإنتاج الموسيقي",
    icon: Music4,
  },
  {
    value: "Palette",
    label: "التصميم",
    icon: Palette,
  },
  {
    value: "Brain",
    label: "الذكاء الاصطناعي",
    icon: Brain,
  },
  {
    value: "Briefcase",
    label: "إدارة الأعمال",
    icon: Briefcase,
  },
  {
    value: "Camera",
    label: "التصوير",
    icon: Camera,
  },
  {
    value: "Clapperboard",
    label: "المونتاج",
    icon: Clapperboard,
  },
  {
    value: "ShoppingCart",
    label: "التجارة الإلكترونية",
    icon: ShoppingCart,
  },
  {
    value: "Building2",
    label: "التسويق العقاري",
    icon: Building2,
  },
  {
    value: "Laptop",
    label: "صناعة المحتوى",
    icon: Laptop,
  },
  {
    value: "GraduationCap",
    label: "التطوير الشخصي",
    icon: GraduationCap,
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
    `/admin/categories/new?error=${encodeURIComponent(
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

async function createCategory(
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

  const slug =
    getFormValue(
      formData,
      "slug"
    ).toLowerCase();

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

  if (
    !title ||
    !slug ||
    !description ||
    !iconKey ||
    !sortOrderValue
  ) {
    redirectWithError(
      "اكتب جميع بيانات التصنيف المطلوبة."
    );
  }

  const slugPattern =
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

  if (
    !slugPattern.test(slug)
  ) {
    redirectWithError(
      "رابط التصنيف يجب أن يكون بالإنجليزية، مثل: web-development"
    );
  }

  if (
    !Number.isInteger(sortOrder) ||
    sortOrder < 0
  ) {
    redirectWithError(
      "ترتيب التصنيف يجب أن يكون رقمًا صحيحًا يبدأ من صفر."
    );
  }

  const validIcon =
    iconOptions.some(
      (option) =>
        option.value === iconKey
    );

  if (!validIcon) {
    redirectWithError(
      "اختر أيقونة صحيحة للتصنيف."
    );
  }

  const {
    error: insertError,
  } = await supabase
    .from("categories")
    .insert({
      title,
      slug,
      description,
      icon_key: iconKey,
      sort_order: sortOrder,
      is_published:
        isPublished,
    });

  if (insertError) {
    console.error(
      "تعذر إضافة التصنيف:",
      insertError
    );

    if (
      insertError.code === "23505"
    ) {
      redirectWithError(
        "اسم التصنيف أو رابطه مستخدم بالفعل."
      );
    }

    redirectWithError(
      "تعذر إضافة التصنيف. حاول مرة أخرى."
    );
  }

  revalidatePath(
    "/admin/categories"
  );

  revalidatePath(
    "/categories"
  );

  revalidatePath(
    "/courses"
  );

  revalidatePath("/");

  redirect(
    "/admin/categories?success=" +
      encodeURIComponent(
        "تم إضافة التصنيف بنجاح."
      )
  );
}

export default async function NewCategoryPage({
  searchParams,
}: PageProps) {
  await requireAdmin();

  const {
    error,
  } = await searchParams;

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-16">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/admin/categories"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-purple-400"
          >
            <ArrowRight size={17} />
            العودة إلى إدارة التصنيفات
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
                إضافة تصنيف جديد
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                أضف تصنيفًا جديدًا لتنظيم
                الكورسات داخل المنصة.
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
                بيانات التصنيف
              </p>

              <h2 className="mt-2 text-2xl font-black md:text-3xl">
                المعلومات الأساسية
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-500">
                أدخل اسم التصنيف ووصفه
                ورابطه وترتيبه داخل المنصة.
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

            <form
              action={createCategory}
              className="mt-8 space-y-7"
            >
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="title"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    اسم التصنيف
                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60">
                    <Tags
                      size={19}
                      className="shrink-0 text-zinc-600"
                    />

                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      placeholder="مثال: الأمن السيبراني"
                      className="w-full bg-transparent px-3 py-4 outline-none placeholder:text-zinc-700"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="slug"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    رابط التصنيف
                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <div
                    dir="ltr"
                    className="flex items-center rounded-xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500/60"
                  >
                    <Tag
                      size={19}
                      className="shrink-0 text-zinc-600"
                    />

                    <input
                      id="slug"
                      name="slug"
                      type="text"
                      required
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      placeholder="cyber-security"
                      className="w-full bg-transparent px-3 py-4 text-left outline-none placeholder:text-zinc-700"
                    />
                  </div>

                  <p className="mt-2 text-xs leading-6 text-zinc-600">
                    حروف إنجليزية صغيرة وأرقام
                    وشرطة فقط.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="icon_key"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    أيقونة التصنيف
                    <span className="mr-1 text-red-400">
                      *
                    </span>
                  </label>

                  <select
                    id="icon_key"
                    name="icon_key"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-white/10 bg-[#111114] px-4 py-4 text-white outline-none transition focus:border-purple-500/60"
                  >
                    <option
                      value=""
                      disabled
                    >
                      اختر أيقونة التصنيف
                    </option>

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
                    ترتيب التصنيف
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
                      placeholder="0"
                      className="w-full bg-transparent px-3 py-4 outline-none placeholder:text-zinc-700"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-3 block text-sm font-bold text-zinc-300"
                >
                  وصف التصنيف
                  <span className="mr-1 text-red-400">
                    *
                  </span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  required
                  rows={5}
                  placeholder="اكتب وصفًا مختصرًا يوضح محتوى التصنيف..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-5 py-4 leading-8 outline-none transition placeholder:text-zinc-700 focus:border-purple-500/60"
                />
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
                    نشر التصنيف مباشرة
                  </p>

                  <p className="mt-2 text-sm leading-7 text-zinc-500">
                    عند تفعيل هذا الاختيار سيظهر
                    التصنيف للطلاب بعد حفظه.
                  </p>
                </div>
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-7 sm:flex-row sm:justify-end">
                <Link
                  href="/admin/categories"
                  className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-7 py-4 font-bold text-zinc-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
                >
                  إلغاء
                </Link>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] hover:brightness-110"
                >
                  <Save size={20} />
                  حفظ التصنيف
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
                <CheckCircle2 size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                بعد إضافة التصنيف
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-7 text-zinc-400">
                <p>
                  1. سيظهر في صفحة إدارة
                  التصنيفات.
                </p>

                <p>
                  2. يمكن استخدامه عند إضافة
                  الكورسات.
                </p>

                <p>
                  3. سيظهر للطلاب عند ربط
                  الصفحة بقاعدة البيانات.
                </p>
              </div>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <ListOrdered size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                ترتيب التصنيفات
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                الرقم الأصغر يظهر أولًا داخل
                صفحة التصنيفات.
              </p>

              <div className="mt-5 rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-7 text-zinc-500">
                مثال: التصنيف رقم 1 يظهر قبل
                التصنيف رقم 2.
              </div>
            </GlassCard>
          </aside>
        </div>
      </section>

      <Footer />
    </main>
  );
}
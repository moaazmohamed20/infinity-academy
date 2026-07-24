import Link from "next/link";
import { redirect } from "next/navigation";

import {
  BookOpen,
  ChevronLeft,
  CreditCard,
  LayoutDashboard,
  ListVideo,
  Settings,
  ShieldCheck,
  Tags,
  TicketPercent,
  UserCog,
  Users,
  UsersRound,
  WalletCards,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import GlassCard from "../../components/ui/GlassCard";
import { createClient } from "../../lib/supabase/server";

const managementSections = [
  {
    title: "إدارة الكورسات",
    description:
      "إضافة الكورسات وتعديل بياناتها والتحكم في نشرها.",
    href: "/admin/courses",
    icon: BookOpen,
  },
  {
    title: "إدارة التصنيفات",
    description:
      "إضافة تصنيفات الكورسات وتعديل ترتيبها والتحكم في ظهورها.",
    href: "/admin/categories",
    icon: Tags,
  },
  {
    title: "إدارة فرق التدريس",
    description:
      "إضافة الفرق التعليمية وتعديل تخصصاتها ومهاراتها والتحكم في ظهورها.",
    href: "/admin/instructor-teams",
    icon: UsersRound,
  },
  {
    title: "إدارة الدروس",
    description:
      "إضافة الدروس والفيديوهات والملفات وترتيب المحتوى.",
    href: "/admin/lessons",
    icon: ListVideo,
  },
  {
    title: "إدارة الباقات والأسعار",
    description:
      "تعديل أسعار الباقات ومميزاتها والتحكم في ظهورها والدفع الإلكتروني.",
    href: "/admin/plans",
    icon: WalletCards,
  },
  {
    title: "إدارة أكواد الخصم",
    description:
      "إنشاء أكواد الخصم وتحديد قيمتها ومدتها وعدد مرات استخدامها.",
    href: "/admin/promo-codes",
    icon: TicketPercent,
  },
  {
    title: "إدارة الطلاب",
    description:
      "عرض حسابات الطلاب ومتابعة بياناتهم وتقدمهم.",
    href: "/admin/students",
    icon: Users,
  },
  {
    title: "إدارة الأدمنز",
    description:
      "إضافة أدمنز جدد والتحكم في صلاحيات حسابات الإدارة.",
    href: "/admin/admins",
    icon: UserCog,
  },
  {
    title: "إدارة الاشتراكات",
    description:
      "إضافة اشتراكات الطلاب وتعديل الحالة ونسب التقدم.",
    href: "/admin/subscriptions",
    icon: CreditCard,
  },
];

export default async function AdminPage() {
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
    .select("full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {
    redirect("/dashboard");
  }

  const fullName =
    typeof profile.full_name ===
      "string" &&
    profile.full_name.trim()
      ? profile.full_name.trim()
      : "مدير المنصة";

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-16">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
                <ShieldCheck size={32} />
              </div>

              <div>
                <p className="text-sm font-bold text-purple-400">
                  لوحة إدارة المنصة
                </p>

                <h1 className="mt-2 text-3xl font-black md:text-5xl">
                  مرحبًا، {fullName}
                </h1>

                <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                  تحكم في الكورسات والتصنيفات
                  وفرق التدريس والدروس
                  والأسعار وأكواد الخصم
                  والطلاب والأدمنز
                  والاشتراكات من مكان واحد.
                </p>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="inline-flex w-fit items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-bold text-zinc-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
            >
              <LayoutDashboard size={19} />
              لوحة الطالب
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div>
            <p className="text-sm font-bold text-purple-400">
              أدوات الإدارة
            </p>

            <h2 className="mt-2 text-3xl font-black">
              إدارة Infinity Academy
            </h2>

            <p className="mt-3 text-zinc-400">
              اختر القسم الذي تريد إدارته.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {managementSections.map(
              (section) => {
                const Icon =
                  section.icon;

                return (
                  <Link
                    key={section.href}
                    href={section.href}
                    className="group"
                  >
                    <GlassCard className="h-full p-7 md:p-8">
                      <div className="flex items-start justify-between gap-5">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 transition group-hover:bg-purple-600 group-hover:text-white">
                          <Icon size={27} />
                        </div>

                        <ChevronLeft
                          size={22}
                          className="text-zinc-600 transition group-hover:-translate-x-1 group-hover:text-purple-400"
                        />
                      </div>

                      <h3 className="mt-7 text-2xl font-black transition group-hover:text-purple-300">
                        {section.title}
                      </h3>

                      <p className="mt-3 leading-7 text-zinc-400">
                        {section.description}
                      </p>

                      <div className="mt-7 border-t border-white/10 pt-5">
                        <span className="text-sm font-bold text-purple-400">
                          فتح قسم الإدارة
                        </span>
                      </div>
                    </GlassCard>
                  </Link>
                );
              }
            )}
          </div>

          <GlassCard
            hover={false}
            className="mt-10 border-purple-500/20 bg-purple-500/[0.05] p-7 md:p-8"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <Settings size={23} />
                </div>

                <div>
                  <h3 className="text-xl font-black">
                    إعدادات المدير
                  </h3>

                  <p className="mt-2 leading-7 text-zinc-400">
                    تحديث اسم المدير ورقم
                    الهاتف وكلمة مرور
                    الحساب.
                  </p>

                  <span className="mt-4 inline-flex w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
                    صلاحية Admin مفعّلة
                  </span>
                </div>
              </div>

              <Link
                href="/admin/settings"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-black text-white transition hover:brightness-110 sm:w-fit"
              >
                <Settings size={19} />
                فتح إعدادات المدير
                <ChevronLeft size={18} />
              </Link>
            </div>
          </GlassCard>
        </div>
      </section>

      <Footer />
    </main>
  );
}
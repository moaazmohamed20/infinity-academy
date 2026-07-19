import Link from "next/link";

import {
  ArrowLeft,
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

const categories = [
  {
    title: "البرمجة",
    courses: "450+ كورس",
    description: "تطوير المواقع والتطبيقات",
    icon: Code2,
  },
  {
    title: "اللغات",
    courses: "300+ كورس",
    description: "تعلم اللغات باحتراف",
    icon: Languages,
  },
  {
    title: "الإنتاج الموسيقي",
    courses: "180+ كورس",
    description: "صناعة وتحرير الموسيقى",
    icon: Music4,
  },
  {
    title: "التصميم",
    courses: "250+ كورس",
    description: "تصميم الجرافيك والواجهات",
    icon: Palette,
  },
  {
    title: "الذكاء الاصطناعي",
    courses: "320+ كورس",
    description: "أدوات وتقنيات المستقبل",
    icon: Brain,
  },
  {
    title: "إدارة الأعمال",
    courses: "170+ كورس",
    description: "الإدارة وريادة الأعمال",
    icon: Briefcase,
  },
  {
    title: "التصوير",
    courses: "90+ كورس",
    description: "التصوير الاحترافي",
    icon: Camera,
  },
  {
    title: "المونتاج",
    courses: "120+ كورس",
    description: "تحرير الفيديو وصناعة الأفلام",
    icon: Clapperboard,
  },
  {
    title: "التجارة الإلكترونية",
    courses: "160+ كورس",
    description: "إنشاء وإدارة المتاجر",
    icon: ShoppingCart,
  },
  {
    title: "التسويق العقاري",
    courses: "110+ كورس",
    description: "التسويق والمبيعات العقارية",
    icon: Building2,
  },
  {
    title: "صناعة المحتوى",
    courses: "220+ كورس",
    description: "بناء جمهور وصناعة محتوى",
    icon: Laptop,
  },
  {
    title: "التطوير الشخصي",
    courses: "140+ كورس",
    description: "طور مهاراتك وحياتك",
    icon: GraduationCap,
  },
];

export default function Categories() {
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

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <Link
                key={category.title}
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
                        <Icon size={27} />
                      </div>

                      <ArrowLeft
                        size={19}
                        className="text-zinc-600 transition duration-300 group-hover:-translate-x-1 group-hover:text-purple-400"
                      />
                    </div>

                    <h3 className="mt-6 text-xl font-bold transition group-hover:text-purple-300">
                      {category.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {category.description}
                    </p>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <span className="text-sm font-semibold text-purple-400">
                        {category.courses}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>

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
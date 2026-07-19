import { Check, Crown, Sparkles, Zap } from "lucide-react";

import Button from "../ui/Button";
import GlassCard from "../ui/GlassCard";
import SectionTitle from "../ui/SectionTitle";

const plans = [
  {
    name: "الباقة المجانية",
    price: "0",
    period: "مدى الحياة",
    description:
      "مناسبة لتجربة المنصة وبعض الكورسات المجانية.",
    icon: Sparkles,
    featured: false,
    features: [
      "الوصول إلى الكورسات المجانية",
      "مشاهدة الدروس الأساسية",
      "إنشاء حساب شخصي",
      "متابعة تقدم التعلم",
    ],
    button: "ابدأ مجانًا",
  },
  {
    name: "الباقة الاحترافية",
    price: "299",
    period: "شهريًا",
    description:
      "الوصول الكامل إلى جميع الكورسات والمسارات التعليمية.",
    icon: Zap,
    featured: true,
    features: [
      "الوصول إلى جميع الكورسات",
      "جميع مسارات التعلم",
      "شهادات إتمام",
      "تحميل الملفات والمصادر",
      "مشاهدة بدون حدود",
      "دعم فني سريع",
    ],
    button: "اشترك الآن",
  },
  {
    name: "الباقة السنوية",
    price: "2499",
    period: "سنويًا",
    description:
      "أفضل قيمة للتعلم طوال العام بسعر مخفض.",
    icon: Crown,
    featured: false,
    features: [
      "كل مميزات الباقة الاحترافية",
      "توفير كبير على الاشتراك",
      "محتوى حصري",
      "أولوية في الدعم",
      "شهادات لجميع الكورسات",
      "الوصول إلى التحديثات الجديدة",
    ],
    button: "اشترك سنويًا",
  },
];

export default function Pricing() {
  return (
    <section className="relative overflow-hidden bg-[#0d0d14] px-6 py-24 text-white">
      <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-purple-600/10 blur-[120px]" />

      <div className="absolute bottom-0 left-0 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        <SectionTitle
          badge="اختر الباقة المناسبة"
          title="استثمر في"
          highlightedText="مستقبلك اليوم"
          description="اشترك مرة واحدة واستمتع بمئات الكورسات في مختلف المجالات."
          align="center"
        />

        <div className="mt-16 grid items-stretch gap-8 lg:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon;

            return (
              <GlassCard
                key={plan.name}
                as="article"
                className={`relative flex h-full flex-col p-8 ${
                  plan.featured
                    ? "border-purple-500 bg-gradient-to-b from-purple-500/15 to-white/[0.04] shadow-2xl shadow-purple-950/40 hover:border-purple-400"
                    : "hover:border-purple-500/40"
                }`}
              >
                {plan.featured && (
                  <span className="absolute -top-4 right-1/2 translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-2 text-sm font-bold shadow-lg shadow-purple-950/40">
                    الأكثر طلبًا
                  </span>
                )}

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
                  <Icon size={27} />
                </div>

                <h3 className="mt-6 text-2xl font-black">
                  {plan.name}
                </h3>

                <p className="mt-3 min-h-14 text-sm leading-7 text-zinc-400">
                  {plan.description}
                </p>

                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-black">
                    {plan.price}
                  </span>

                  <span className="mb-1 text-zinc-400">
                    جنيه / {plan.period}
                  </span>
                </div>

                <div className="mt-8 flex-1 space-y-4 border-t border-white/10 pt-7">
                  {plan.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 text-sm text-zinc-300"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/10 text-green-400">
                        <Check size={15} />
                      </span>

                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  variant={
                    plan.featured
                      ? "primary"
                      : "secondary"
                  }
                  className="mt-9 w-full py-4"
                >
                  {plan.button}
                </Button>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
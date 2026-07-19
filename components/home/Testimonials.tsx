import { Quote, Star } from "lucide-react";

import GlassCard from "../ui/GlassCard";
import SectionTitle from "../ui/SectionTitle";

const testimonials = [
  {
    name: "أحمد محمد",
    role: "طالب برمجة",
    review:
      "المنصة منظمة جدًا، والشرح واضح، وقدرت أبدأ في البرمجة من الصفر بدون تشتت.",
    rating: 5,
  },
  {
    name: "سارة علي",
    role: "طالبة تسويق",
    review:
      "أكثر شيء عجبني هو تنوع الكورسات والمسارات المرتبة خطوة بخطوة.",
    rating: 5,
  },
  {
    name: "محمود حسن",
    role: "صانع محتوى",
    review:
      "كورسات صناعة المحتوى والمونتاج ساعدتني أطور شغلي وأبدأ أحقق دخل من الإنترنت.",
    rating: 5,
  },
  {
    name: "عبدالرحمن طه",
    role: "طالب لغات",
    review:
      "التصميم مريح، والكورسات سهلة المتابعة، وبقيت أتعلم في الوقت المناسب لي.",
    rating: 5,
  },
  {
    name: "يوسف إبراهيم",
    role: "طالب ذكاء اصطناعي",
    review:
      "المحتوى عملي ومباشر، وفيه ملفات ومصادر ساعدتني أطبق اللي اتعلمته.",
    rating: 5,
  },
  {
    name: "منة سامي",
    role: "طالبة إدارة أعمال",
    review:
      "المسارات التعليمية وفرت علي وقت كبير، وكل شيء موجود في مكان واحد.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-[#09090B] px-6 py-24 text-white">
      <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-purple-600/10 blur-[120px]" />

      <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl">
        <SectionTitle
          badge="آراء مجتمعنا"
          title="ماذا يقول طلاب"
          highlightedText="Infinity Academy؟"
          description="تجارب حقيقية لطلاب بدأوا رحلة التعلم وطوّروا مهاراتهم."
          align="center"
        />

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item) => (
            <GlassCard
              key={item.name}
              as="article"
              className="group flex h-full flex-col p-7 hover:border-purple-500/50 hover:bg-purple-500/[0.06]"
            >
              <div className="flex items-center justify-between">
                <div
                  className="flex gap-1"
                  aria-label={`التقييم ${item.rating} من 5`}
                >
                  {Array.from({ length: 5 }).map((_, index) => {
                    const isActive = index < item.rating;

                    return (
                      <Star
                        key={index}
                        size={17}
                        fill={isActive ? "currentColor" : "none"}
                        className={
                          isActive
                            ? "text-yellow-400"
                            : "text-zinc-700"
                        }
                      />
                    );
                  })}
                </div>

                <Quote
                  size={34}
                  className="text-purple-500/60 transition group-hover:text-purple-400"
                />
              </div>

              <p className="mt-6 flex-1 text-sm leading-8 text-zinc-300">
                “{item.review}”
              </p>

              <div className="mt-7 border-t border-white/10 pt-6">
                <h3 className="font-bold text-white">
                  {item.name}
                </h3>

                <p className="mt-1 text-sm text-purple-400">
                  {item.role}
                </p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
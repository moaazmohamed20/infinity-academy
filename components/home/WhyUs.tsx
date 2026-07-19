import {
  Award,
  BookOpenCheck,
  CheckCircle2,
  Headphones,
  Infinity as InfinityIcon,
  ShieldCheck,
  Users,
} from "lucide-react";

import GlassCard from "../ui/GlassCard";
import SectionTitle from "../ui/SectionTitle";

const features = [
  {
    title: "كورسات في كل المجالات",
    description:
      "اكتشف محتوى تعليمي متنوع في البرمجة، اللغات، التسويق، التصميم، صناعة المحتوى والمزيد.",
    icon: BookOpenCheck,
  },
  {
    title: "تعلم بلا حدود",
    description:
      "شاهد الدروس في الوقت المناسب لك ومن أي جهاز، مع تجربة تعلم مرنة وسهلة.",
    icon: InfinityIcon,
  },
  {
    title: "شهادات إتمام",
    description:
      "احصل على شهادة بعد إتمام الكورس واجتياز متطلباته وإثبات تقدمك.",
    icon: Award,
  },
  {
    title: "دعم مستمر",
    description:
      "احصل على المساعدة والإجابة عن استفساراتك طوال رحلة التعلم.",
    icon: Headphones,
  },
];

const stats = [
  {
    value: "1000+",
    label: "كورس متنوع",
    icon: BookOpenCheck,
  },
  {
    value: "5000+",
    label: "طالب مسجل",
    icon: Users,
  },
  {
    value: "100%",
    label: "تعلم مرن",
    icon: InfinityIcon,
  },
  {
    value: "24/7",
    label: "وصول للمحتوى",
    icon: ShieldCheck,
  },
];

export default function WhyUs() {
  return (
    <section className="relative overflow-hidden bg-[#0D0D14] px-6 py-24 text-white">
      <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-purple-600/10 blur-[120px]" />

      <div className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-blue-600/10 blur-[120px]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative mx-auto max-w-7xl">
        <SectionTitle
          badge="لماذا Infinity Academy؟"
          title="كل ما تحتاجه"
          highlightedText="لتطوير مهاراتك"
          description="منصة تعليمية متكاملة تمنحك المحتوى، المرونة، الدعم والأدوات التي تساعدك على التعلم والتطور والوصول إلى أهدافك."
          align="center"
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <GlassCard
                key={feature.title}
                as="article"
                className="group relative overflow-hidden p-7 hover:border-purple-500/50"
              >
                <div className="absolute -left-12 -top-12 h-28 w-28 rounded-full bg-purple-600/10 blur-3xl transition group-hover:bg-purple-600/20" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40 transition duration-300 group-hover:scale-110">
                      <Icon size={27} />
                    </div>

                    <span className="text-sm font-black text-white/10">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mt-6 text-xl font-bold transition group-hover:text-purple-300">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-zinc-400">
                    {feature.description}
                  </p>

                  <div className="mt-6 flex items-center gap-2 border-t border-white/10 pt-5 text-sm font-semibold text-zinc-300">
                    <CheckCircle2
                      size={17}
                      className="text-green-400"
                    />
                    تجربة تعلم أفضل
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        <GlassCard
          hover={false}
          className="mt-14 rounded-[32px] p-5 lg:p-7"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <div
                  key={stat.label}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <Icon size={23} />
                  </div>

                  <div>
                    <p className="text-2xl font-black">
                      {stat.value}
                    </p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {stat.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
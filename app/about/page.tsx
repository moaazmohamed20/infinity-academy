import {
  ArrowLeft,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  Infinity as InfinityIcon,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import SectionTitle from "../../components/ui/SectionTitle";
import { courses } from "../../data/courses";

const values = [
  {
    title: "تعليم عملي",
    description:
      "نركز على المهارات القابلة للتطبيق من خلال أمثلة ومشروعات عملية.",
    icon: BookOpenCheck,
  },
  {
    title: "محتوى واضح",
    description:
      "نقدم المفاهيم المعقدة بطريقة منظمة ومبسطة تناسب مختلف المستويات.",
    icon: Brain,
  },
  {
    title: "تعلّم مرن",
    description:
      "يمكنك مشاهدة الدروس والتعلم في الوقت والمكان المناسبين لك.",
    icon: InfinityIcon,
  },
  {
    title: "جودة مستمرة",
    description:
      "نعمل على تحديث المحتوى وتحسين تجربة التعلم بصورة مستمرة.",
    icon: ShieldCheck,
  },
];

const achievements = [
  {
    value: `${courses.length}+`,
    label: "كورس متاح",
  },
  {
    value: "12",
    label: "مجالًا تعليميًا",
  },
  {
    value: "5000+",
    label: "طالب مسجل",
  },
  {
    value: "24/7",
    label: "وصول للمحتوى",
  },
];

const goals = [
  "توفير محتوى تعليمي عربي عالي الجودة.",
  "مساعدة الطلاب على اكتساب مهارات مطلوبة في سوق العمل.",
  "تقديم مسارات واضحة تقلل التشتت أثناء التعلم.",
  "دمج الشرح النظري بالتطبيقات والمشروعات العملية.",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <SectionTitle
            badge="من نحن"
            title="نبني تجربة تعلم"
            highlightedText="بلا حدود"
            description="Infinity Academy منصة تعليمية عربية تساعدك على تطوير مهاراتك من خلال كورسات عملية ومسارات تعليمية منظمة."
            align="center"
          />

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            <GlassCard
              hover={false}
              className="relative overflow-hidden p-8 md:p-10"
            >
              <div className="absolute -left-20 -top-20 h-52 w-52 rounded-full bg-purple-600/10 blur-[70px]" />

              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
                  <InfinityIcon size={34} />
                </div>

                <p className="mt-8 text-sm font-bold text-purple-400">
                  قصتنا
                </p>

                <h1 className="mt-3 text-3xl font-black leading-tight md:text-4xl">
                  منصة تساعدك على التعلم بطريقة واضحة وعملية
                </h1>

                <p className="mt-6 leading-8 text-zinc-400">
                  أنشئت Infinity Academy لتوفير مكان واحد يجمع
                  الكورسات والمسارات التعليمية في مجالات متعددة،
                  ويساعد الطالب على الانتقال من المستوى المبتدئ
                  إلى مستوى متقدم دون تشتت.
                </p>

                <p className="mt-4 leading-8 text-zinc-400">
                  نؤمن بأن التعلم الفعال لا يعتمد على مشاهدة
                  الدروس فقط، بل يحتاج إلى خطة واضحة، تطبيق عملي
                  ومتابعة مستمرة للتقدم.
                </p>

                <Button
                  href="/courses"
                  className="mt-8 px-7 py-4"
                >
                  استكشف الكورسات
                  <ArrowLeft size={19} />
                </Button>
              </div>
            </GlassCard>

            <div className="grid gap-5 sm:grid-cols-2">
              {values.map((value) => {
                const Icon = value.icon;

                return (
                  <GlassCard
                    key={value.title}
                    as="article"
                    className="group p-7"
                  >
                    <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 transition duration-300 group-hover:bg-purple-600 group-hover:text-white">
                      <Icon size={25} />
                    </div>

                    <h2 className="mt-6 text-xl font-black transition group-hover:text-purple-300">
                      {value.title}
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-zinc-400">
                      {value.description}
                    </p>
                  </GlassCard>
                );
              })}
            </div>
          </div>

          <div className="mt-12 grid gap-4 rounded-[32px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4 lg:p-7">
            {achievements.map((achievement) => (
              <div
                key={achievement.label}
                className="rounded-2xl border border-white/10 bg-black/20 p-6 text-center"
              >
                <p className="text-3xl font-black text-purple-400">
                  {achievement.value}
                </p>

                <p className="mt-2 text-sm text-zinc-500">
                  {achievement.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0D0D14] px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-2">
          <GlassCard
            hover={false}
            className="border-purple-500/20 bg-purple-500/[0.06] p-8 md:p-10"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
              <Target size={27} />
            </div>

            <p className="mt-7 text-sm font-bold text-purple-400">
              رسالتنا
            </p>

            <h2 className="mt-3 text-3xl font-black">
              جعل التعلم أكثر سهولة وفعالية
            </h2>

            <p className="mt-5 leading-8 text-zinc-400">
              نسعى إلى تمكين الطلاب من اكتساب مهارات حقيقية من
              خلال تجربة تعليمية مرنة، منظمة ومناسبة لاحتياجات
              سوق العمل.
            </p>
          </GlassCard>

          <GlassCard
            hover={false}
            className="p-8 md:p-10"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <UsersRound size={27} />
            </div>

            <p className="mt-7 text-sm font-bold text-blue-400">
              رؤيتنا
            </p>

            <h2 className="mt-3 text-3xl font-black">
              مجتمع عربي يتعلم ويتطور باستمرار
            </h2>

            <p className="mt-5 leading-8 text-zinc-400">
              نطمح إلى بناء منصة تعليمية متكاملة تجمع الطلاب
              والخبراء والمحتوى العملي في بيئة تساعد على التطور
              وتحقيق الأهداف.
            </p>
          </GlassCard>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            badge="أهدافنا"
            title="ما الذي نعمل"
            highlightedText="على تحقيقه؟"
            description="أهداف واضحة توجه طريقة إعداد المحتوى وتطوير المنصة."
            align="center"
          />

          <GlassCard
            hover={false}
            className="mx-auto mt-12 max-w-4xl p-7 md:p-10"
          >
            <div className="space-y-5">
              {goals.map((goal, index) => (
                <div
                  key={goal}
                  className="flex items-start gap-4 rounded-2xl border border-white/10 bg-black/20 p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 font-black text-purple-400">
                    {index + 1}
                  </div>

                  <div className="flex min-w-0 items-start gap-3">
                    <CheckCircle2
                      size={20}
                      className="mt-1 shrink-0 text-green-400"
                    />

                    <p className="leading-7 text-zinc-300">
                      {goal}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard
            hover={false}
            className="mt-16 overflow-hidden border-purple-500/20 bg-gradient-to-l from-purple-600/20 via-indigo-600/10 to-transparent p-8 text-center md:p-12"
          >
            <Sparkles
              size={34}
              className="mx-auto text-purple-400"
            />

            <h2 className="mt-6 text-3xl font-black md:text-4xl">
              ابدأ رحلة تطوير مهاراتك اليوم
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-8 text-zinc-400">
              اختر المجال المناسب لك وابدأ التعلم من خلال كورسات
              ومسارات عملية.
            </p>

            <Button
              href="/register"
              className="mt-8 px-8 py-4"
            >
              إنشاء حساب مجاني
              <ArrowLeft size={19} />
            </Button>
          </GlassCard>
        </div>
      </section>

      <Footer />
    </main>
  );
}
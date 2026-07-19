import Link from "next/link";
import {
  ArrowLeft,
  Brain,
  BriefcaseBusiness,
  Code2,
  Languages,
  Megaphone,
  Palette,
  ShieldCheck,
  Sparkles,
  UsersRound,
  Video,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import GlassCard from "../../components/ui/GlassCard";
import SectionTitle from "../../components/ui/SectionTitle";
import Button from "../../components/ui/Button";
import { courses } from "../../data/courses";

const instructorTeams = [
  {
    title: "فريق البرمجة",
    category: "البرمجة",
    description:
      "خبراء في تطوير المواقع، التطبيقات وأساسيات البرمجة الحديثة.",
    icon: Code2,
    skills: [
      "تطوير المواقع",
      "تطبيقات عملية",
      "مشروعات احترافية",
    ],
  },
  {
    title: "فريق الذكاء الاصطناعي",
    category: "الذكاء الاصطناعي",
    description:
      "متخصصون في أدوات الذكاء الاصطناعي، الأتمتة وتحليل البيانات.",
    icon: Brain,
    skills: [
      "أدوات الذكاء الاصطناعي",
      "الأتمتة",
      "تحليل البيانات",
    ],
  },
  {
    title: "فريق اللغات",
    category: "اللغات",
    description:
      "مدربون متخصصون في المحادثة، الاستماع وتطوير المهارات اللغوية.",
    icon: Languages,
    skills: [
      "المحادثة",
      "الاستماع",
      "الكتابة",
    ],
  },
  {
    title: "فريق التسويق",
    category: "التسويق الإلكتروني",
    description:
      "خبراء في التسويق الرقمي، الإعلانات وبناء العلامات التجارية.",
    icon: Megaphone,
    skills: [
      "التسويق الرقمي",
      "الإعلانات",
      "بناء العلامة",
    ],
  },
  {
    title: "فريق التصميم والمونتاج",
    category: "التصميم",
    description:
      "متخصصون في التصميم الجرافيكي، تحرير الفيديو وصناعة المحتوى المرئي.",
    icon: Palette,
    skills: [
      "التصميم الجرافيكي",
      "المونتاج",
      "المحتوى المرئي",
    ],
  },
  {
    title: "فريق إدارة الأعمال",
    category: "إدارة الأعمال",
    description:
      "خبراء في الإدارة، القيادة، التخطيط وريادة المشروعات.",
    icon: BriefcaseBusiness,
    skills: [
      "الإدارة",
      "القيادة",
      "ريادة الأعمال",
    ],
  },
];

const benefits = [
  {
    title: "خبرة عملية",
    description:
      "محتوى مبني على تطبيقات ومشروعات واقعية.",
    icon: ShieldCheck,
  },
  {
    title: "شرح مبسط",
    description:
      "تبسيط المفاهيم الصعبة بخطوات منظمة.",
    icon: Sparkles,
  },
  {
    title: "متابعة مستمرة",
    description:
      "محتوى يساعدك على متابعة تقدمك وتطوير مستواك.",
    icon: UsersRound,
  },
  {
    title: "تطبيق مباشر",
    description:
      "كل مهارة يتم دعمها بأمثلة وتطبيقات عملية.",
    icon: Video,
  },
];

export default function InstructorsPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <SectionTitle
            badge="خبراء Infinity Academy"
            title="تعلّم على يد"
            highlightedText="فرق متخصصة"
            description="يتم إعداد محتوى المنصة بواسطة فرق تعليمية متخصصة تمتلك خبرة عملية في مختلف المجالات."
            align="center"
          />

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {instructorTeams.map((team) => {
              const Icon = team.icon;

              const teamCourses = courses.filter(
                (course) =>
                  course.category === team.category
              ).length;

              return (
                <GlassCard
                  key={team.title}
                  as="article"
                  className="group flex h-full flex-col p-7"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40 transition duration-300 group-hover:scale-110">
                      <Icon size={27} />
                    </div>

                    <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-2 text-xs font-bold text-purple-300">
                      {teamCourses} كورس
                    </span>
                  </div>

                  <h2 className="mt-6 text-2xl font-black transition group-hover:text-purple-300">
                    {team.title}
                  </h2>

                  <p className="mt-3 min-h-20 text-sm leading-7 text-zinc-400">
                    {team.description}
                  </p>

                  <div className="mt-6 flex-1 space-y-3 border-t border-white/10 pt-6">
                    {team.skills.map((skill) => (
                      <div
                        key={skill}
                        className="flex items-center gap-3 text-sm text-zinc-300"
                      >
                        <span className="h-2 w-2 shrink-0 rounded-full bg-purple-500" />
                        {skill}
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/courses?category=${encodeURIComponent(
                      team.category
                    )}`}
                    className="mt-7 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-5 py-4 font-bold text-zinc-300 transition hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-white"
                  >
                    استكشف كورسات الفريق
                    <ArrowLeft size={18} />
                  </Link>
                </GlassCard>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#0D0D14] px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            badge="تجربة تعليمية احترافية"
            title="لماذا تتعلم مع"
            highlightedText="خبرائنا؟"
            description="منهجية تعليمية تجمع بين الشرح الواضح والتطبيق العملي."
            align="center"
          />

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <GlassCard
                  key={benefit.title}
                  hover={false}
                  className="p-6 text-center"
                >
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <Icon size={23} />
                  </div>

                  <h3 className="mt-5 text-lg font-black">
                    {benefit.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-zinc-400">
                    {benefit.description}
                  </p>
                </GlassCard>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Button
              href="/courses"
              className="px-8 py-4"
            >
              استكشف جميع الكورسات
              <ArrowLeft size={19} />
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
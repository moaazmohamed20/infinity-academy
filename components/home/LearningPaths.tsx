import {
  ArrowLeft,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Code2,
  Languages,
  Megaphone,
  Route,
  Video,
} from "lucide-react";

import Button from "../ui/Button";
import GlassCard from "../ui/GlassCard";
import ProgressBar from "../ui/ProgressBar";
import SectionTitle from "../ui/SectionTitle";

const paths = [
  {
    slug: "programming",
    title: "مسار البرمجة",
    description:
      "ابدأ من أساسيات البرمجة ثم انتقل إلى تطوير المواقع والتطبيقات من خلال خطة عملية متدرجة.",
    courses: 24,
    duration: "6 أشهر",
    level: "من المبتدئ للاحتراف",
    progress: 92,
    icon: Code2,
    skills: [
      "أساسيات البرمجة",
      "تطوير المواقع",
      "مشروعات عملية",
    ],
  },
  {
    slug: "ai",
    title: "مسار الذكاء الاصطناعي",
    description:
      "تعلّم أدوات الذكاء الاصطناعي، الأتمتة، تحليل البيانات وبناء حلول ذكية قابلة للتطبيق.",
    courses: 18,
    duration: "4 أشهر",
    level: "مبتدئ ومتوسط",
    progress: 78,
    icon: Brain,
    skills: [
      "أدوات الذكاء الاصطناعي",
      "الأتمتة",
      "تحليل البيانات",
    ],
  },
  {
    slug: "languages",
    title: "مسار اللغات",
    description:
      "طوّر مهارات المحادثة والاستماع والكتابة من خلال مستويات منظمة وتدريبات عملية مستمرة.",
    courses: 30,
    duration: "8 أشهر",
    level: "جميع المستويات",
    progress: 85,
    icon: Languages,
    skills: ["المحادثة", "الاستماع", "الكتابة"],
  },
  {
    slug: "marketing",
    title: "مسار التسويق",
    description:
      "تعلّم التسويق الرقمي، الإعلانات، تحليل الجمهور وبناء العلامات التجارية بخطوات واضحة.",
    courses: 20,
    duration: "5 أشهر",
    level: "من الصفر للاحتراف",
    progress: 74,
    icon: Megaphone,
    skills: [
      "التسويق الرقمي",
      "الإعلانات",
      "بناء العلامة",
    ],
  },
  {
    slug: "content-creation",
    title: "مسار صناعة المحتوى",
    description:
      "أنشئ محتوى احترافيًا وتعلّم التصوير، المونتاج، بناء الجمهور وتحقيق الدخل من المنصات.",
    courses: 22,
    duration: "5 أشهر",
    level: "مبتدئ ومتوسط",
    progress: 88,
    icon: Video,
    skills: [
      "صناعة الفيديو",
      "المونتاج",
      "بناء الجمهور",
    ],
  },
  {
    slug: "business",
    title: "مسار إدارة الأعمال",
    description:
      "طوّر مهاراتك في الإدارة، القيادة، التخطيط وريادة المشاريع من خلال محتوى عملي متكامل.",
    courses: 16,
    duration: "4 أشهر",
    level: "جميع المستويات",
    progress: 70,
    icon: BriefcaseBusiness,
    skills: [
      "الإدارة",
      "القيادة",
      "ريادة الأعمال",
    ],
  },
];

export default function LearningPaths() {
  return (
    <section className="relative overflow-hidden bg-[#0B0B10] px-6 py-24 text-white">
      <div className="absolute -right-40 top-10 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

      <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            badge="تعلّم بخطة واضحة"
            title="اختر مسار التعلم"
            highlightedText="المناسب لك"
            description="مسارات تعليمية منظمة تبدأ معك من المستوى الصحيح، وتساعدك على التقدم خطوة بخطوة حتى تحقق هدفك."
          />

          <GlassCard
            hover={false}
            className="flex items-center gap-3 px-5 py-4"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Route size={22} />
            </div>

            <div>
              <p className="font-bold">
                6 مسارات متكاملة
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                من البداية حتى الاحتراف
              </p>
            </div>
          </GlassCard>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {paths.map((path, index) => {
            const Icon = path.icon;

            return (
              <GlassCard
                key={path.slug}
                as="article"
                className="group relative overflow-hidden p-7 hover:border-purple-500/50"
              >
                <div className="absolute -left-16 -top-16 h-36 w-36 rounded-full bg-purple-600/10 blur-3xl transition group-hover:bg-purple-600/20" />

                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40 transition duration-300 group-hover:scale-110">
                      <Icon size={27} />
                    </div>

                    <span className="text-sm font-black text-white/10">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-black transition group-hover:text-purple-300">
                    {path.title}
                  </h3>

                  <p className="mt-3 min-h-24 text-sm leading-7 text-zinc-400">
                    {path.description}
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <BookOpen size={16} />

                        <span className="text-xs">
                          عدد الكورسات
                        </span>
                      </div>

                      <p className="mt-2 font-bold">
                        {path.courses} كورس
                      </p>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Clock3 size={16} />

                        <span className="text-xs">
                          مدة المسار
                        </span>
                      </div>

                      <p className="mt-2 font-bold">
                        {path.duration}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    <p className="text-xs text-zinc-500">
                      ستتعلم:
                    </p>

                    <div className="mt-3 space-y-3">
                      {path.skills.map((skill) => (
                        <div
                          key={skill}
                          className="flex items-center gap-2 text-sm text-zinc-300"
                        >
                          <CheckCircle2
                            size={17}
                            className="shrink-0 text-green-400"
                          />

                          {skill}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-500">
                        المستوى
                      </span>

                      <span className="text-sm font-semibold text-purple-300">
                        {path.level}
                      </span>
                    </div>

                    <ProgressBar
                      value={path.progress}
                      label="اكتمال المسار"
                      className="mt-5"
                    />
                  </div>

                  <Button
                    href={`/courses?path=${path.slug}`}
                    variant="secondary"
                    className="mt-6 w-full"
                  >
                    استكشف المسار
                    <ArrowLeft size={18} />
                  </Button>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
}
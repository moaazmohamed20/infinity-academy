import {
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import Button from "../../components/ui/Button";
import GlassCard from "../../components/ui/GlassCard";
import SectionTitle from "../../components/ui/SectionTitle";

const faqGroups = [
  {
    title: "الحساب والاشتراك",
    questions: [
      {
        question: "كيف أنشئ حسابًا جديدًا؟",
        answer:
          "انتقل إلى صفحة إنشاء الحساب، وأدخل اسمك وبريدك الإلكتروني ورقم هاتفك وكلمة المرور، ثم وافق على الشروط واضغط على إنشاء الحساب.",
      },
      {
        question: "هل يمكنني تجربة المنصة مجانًا؟",
        answer:
          "نعم، يمكنك إنشاء حساب مجاني والوصول إلى مجموعة من الدروس والكورسات المجانية قبل اختيار الباقة المناسبة لك.",
      },
      {
        question: "ما الفرق بين الباقة الشهرية والسنوية؟",
        answer:
          "الباقة الشهرية يتم تجديدها كل شهر، بينما تمنحك الباقة السنوية وصولًا لمدة عام كامل بسعر إجمالي أقل.",
      },
      {
        question: "هل يمكنني إلغاء الاشتراك؟",
        answer:
          "يمكنك إيقاف تجديد الاشتراك من إعدادات حسابك، ويستمر وصولك إلى المحتوى حتى نهاية مدة الاشتراك الحالية.",
      },
    ],
  },
  {
    title: "الكورسات والتعلم",
    questions: [
      {
        question: "هل الكورسات مناسبة للمبتدئين؟",
        answer:
          "نعم، تحتوي المنصة على كورسات تبدأ من المستوى المبتدئ، بالإضافة إلى كورسات للمستويات المتوسطة والمتقدمة.",
      },
      {
        question: "هل يمكنني مشاهدة الدروس من الهاتف؟",
        answer:
          "نعم، تصميم المنصة متوافق مع الهاتف والتابلت والكمبيوتر، ويمكنك متابعة دروسك من أي جهاز.",
      },
      {
        question: "هل يوجد وقت محدد لمشاهدة الدروس؟",
        answer:
          "لا، يمكنك مشاهدة الدروس في الوقت المناسب لك طوال فترة اشتراكك.",
      },
      {
        question: "كيف أتابع تقدمي داخل الكورس؟",
        answer:
          "تظهر نسبة تقدمك وعدد الدروس المكتملة داخل صفحة الكورس ولوحة التحكم الخاصة بك.",
      },
    ],
  },
  {
    title: "الشهادات والدعم",
    questions: [
      {
        question: "هل أحصل على شهادة بعد إنهاء الكورس؟",
        answer:
          "نعم، يمكنك الحصول على شهادة إتمام بعد مشاهدة الدروس واستكمال متطلبات الكورس.",
      },
      {
        question: "هل يمكن تحميل ملفات الكورس؟",
        answer:
          "يمكن تحميل الملفات والمصادر التي يسمح بها كل كورس، مثل الملخصات وملفات التطبيقات العملية.",
      },
      {
        question: "ماذا أفعل إذا واجهت مشكلة تقنية؟",
        answer:
          "تواصل مع فريق الدعم من خلال صفحة تواصل معنا، واكتب تفاصيل المشكلة التي تواجهك.",
      },
      {
        question: "كم يستغرق الرد من فريق الدعم؟",
        answer:
          "عادةً يقوم فريق الدعم بالرد خلال 24 ساعة من إرسال الاستفسار.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-5xl">
          <SectionTitle
            badge="مركز المساعدة"
            title="الأسئلة"
            highlightedText="الشائعة"
            description="إجابات واضحة عن أكثر الأسئلة المتعلقة بالحساب والاشتراكات والكورسات والشهادات."
            align="center"
          />

          <div className="mt-16 space-y-10">
            {faqGroups.map((group) => (
              <section key={group.title}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <HelpCircle size={21} />
                  </div>

                  <h2 className="text-2xl font-black">
                    {group.title}
                  </h2>
                </div>

                <div className="space-y-4">
                  {group.questions.map((item) => (
                    <GlassCard
                      key={item.question}
                      hover={false}
                      className="overflow-hidden p-0"
                    >
                      <details className="group">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-6 py-5">
                          <h3 className="font-bold text-zinc-200 transition group-open:text-purple-300">
                            {item.question}
                          </h3>

                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                            <ChevronDown
                              size={19}
                              className="transition duration-300 group-open:rotate-180"
                            />
                          </span>
                        </summary>

                        <div className="border-t border-white/10 px-6 py-5">
                          <p className="leading-8 text-zinc-400">
                            {item.answer}
                          </p>
                        </div>
                      </details>
                    </GlassCard>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <GlassCard
            hover={false}
            className="mt-16 overflow-hidden border-purple-500/20 bg-gradient-to-l from-purple-600/20 via-indigo-600/10 to-transparent p-8 text-center md:p-12"
          >
            <Sparkles
              size={34}
              className="mx-auto text-purple-400"
            />

            <h2 className="mt-6 text-3xl font-black">
              لم تجد إجابة عن سؤالك؟
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-8 text-zinc-400">
              تواصل مع فريق الدعم وأرسل استفسارك، وسنساعدك في أقرب
              وقت.
            </p>

            <Button
              href="/contact"
              className="mt-8 px-8 py-4"
            >
              <MessageCircle size={19} />
              تواصل معنا
            </Button>
          </GlassCard>
        </div>
      </section>

      <Footer />
    </main>
  );
}
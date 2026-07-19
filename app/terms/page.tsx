import {
  BookOpenCheck,
  CreditCard,
  FileCheck2,
  LockKeyhole,
  Scale,
  ShieldAlert,
  UserCheck,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import GlassCard from "../../components/ui/GlassCard";
import SectionTitle from "../../components/ui/SectionTitle";

const termsSections = [
  {
    title: "إنشاء الحساب",
    description:
      "يجب تقديم معلومات صحيحة عند إنشاء الحساب، والمحافظة على سرية كلمة المرور وعدم مشاركة بيانات الدخول مع الآخرين.",
    icon: UserCheck,
  },
  {
    title: "استخدام المحتوى",
    description:
      "المحتوى التعليمي مخصص للاستخدام الشخصي فقط، ولا يجوز نسخه أو إعادة نشره أو بيعه دون موافقة مكتوبة.",
    icon: BookOpenCheck,
  },
  {
    title: "الاشتراكات والمدفوعات",
    description:
      "يتم تحديد سعر ومدة كل باقة قبل الاشتراك، وقد يخضع الاشتراك للتجديد وفق الطريقة الموضحة أثناء عملية الدفع.",
    icon: CreditCard,
  },
  {
    title: "حماية الحساب",
    description:
      "يتحمل المستخدم مسؤولية النشاط الذي يتم من خلال حسابه، ويجب إبلاغ الدعم عند الاشتباه في استخدام غير مصرح به.",
    icon: LockKeyhole,
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-5xl">
          <SectionTitle
            badge="قواعد استخدام المنصة"
            title="الشروط"
            highlightedText="والأحكام"
            description="توضح هذه الصفحة القواعد العامة لاستخدام منصة Infinity Academy والاشتراك في خدماتها."
            align="center"
          />

          <GlassCard
            hover={false}
            className="mt-12 border-yellow-500/20 bg-yellow-500/[0.05] p-6"
          >
            <div className="flex items-start gap-4">
              <ShieldAlert
                size={24}
                className="mt-1 shrink-0 text-yellow-400"
              />

              <div>
                <h2 className="font-black text-yellow-300">
                  تنبيه قانوني
                </h2>

                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  هذه الشروط صياغة مبدئية للمشروع، ويجب مراجعتها
                  بواسطة مختص قانوني قبل إطلاق المنصة واستقبال
                  مدفوعات حقيقية.
                </p>
              </div>
            </div>
          </GlassCard>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {termsSections.map((section) => {
              const Icon = section.icon;

              return (
                <GlassCard
                  key={section.title}
                  as="article"
                  className="group h-full p-7"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 transition duration-300 group-hover:bg-purple-600 group-hover:text-white">
                    <Icon size={25} />
                  </div>

                  <h2 className="mt-6 text-xl font-black transition group-hover:text-purple-300">
                    {section.title}
                  </h2>

                  <p className="mt-4 text-sm leading-8 text-zinc-400">
                    {section.description}
                  </p>
                </GlassCard>
              );
            })}
          </div>

          <GlassCard
            hover={false}
            className="mt-10 p-7 md:p-10"
          >
            <div className="space-y-9">
              <section>
                <div className="flex items-center gap-3">
                  <FileCheck2
                    size={24}
                    className="text-purple-400"
                  />

                  <h2 className="text-2xl font-black">
                    قبول الشروط
                  </h2>
                </div>

                <p className="mt-4 leading-8 text-zinc-400">
                  باستخدام المنصة أو إنشاء حساب، فإن المستخدم يوافق
                  على الالتزام بهذه الشروط وسياسة الخصوصية وأي
                  تعليمات تظهر أثناء استخدام الخدمات.
                </p>
              </section>

              <div className="h-px bg-white/10" />

              <section>
                <h2 className="text-2xl font-black">
                  أهلية الاستخدام
                </h2>

                <p className="mt-4 leading-8 text-zinc-400">
                  يجب أن يكون المستخدم قادرًا قانونيًا على إنشاء
                  الحساب وإجراء عمليات الاشتراك، أو أن يتم ذلك
                  بموافقة ولي الأمر عند الحاجة.
                </p>
              </section>

              <div className="h-px bg-white/10" />

              <section>
                <h2 className="text-2xl font-black">
                  قواعد السلوك
                </h2>

                <p className="mt-4 leading-8 text-zinc-400">
                  يمنع استخدام المنصة في أي نشاط غير قانوني، أو
                  محاولة اختراقها، أو تعطيل خدماتها، أو مشاركة
                  المحتوى بصورة تضر بحقوق المنصة أو المستخدمين.
                </p>
              </section>

              <div className="h-px bg-white/10" />

              <section>
                <h2 className="text-2xl font-black">
                  إيقاف الحساب
                </h2>

                <p className="mt-4 leading-8 text-zinc-400">
                  يحق للمنصة إيقاف أو تقييد الحساب عند مخالفة
                  الشروط، أو إساءة استخدام المحتوى، أو وجود نشاط
                  يهدد سلامة المنصة أو حقوق الآخرين.
                </p>
              </section>

              <div className="h-px bg-white/10" />

              <section>
                <h2 className="text-2xl font-black">
                  الأسعار والتجديد
                </h2>

                <p className="mt-4 leading-8 text-zinc-400">
                  تظهر قيمة الاشتراك ومدة الباقة قبل إتمام الدفع.
                  وقد تتغير الأسعار مستقبلًا، دون التأثير على مدة
                  الاشتراك التي تم دفعها بالفعل.
                </p>
              </section>

              <div className="h-px bg-white/10" />

              <section>
                <h2 className="text-2xl font-black">
                  الاسترداد والإلغاء
                </h2>

                <p className="mt-4 leading-8 text-zinc-400">
                  يتم تطبيق سياسة الإلغاء والاسترداد وفق الشروط
                  الموضحة أثناء الدفع والقوانين المعمول بها، وبعد
                  مراجعة حالة كل طلب.
                </p>
              </section>

              <div className="h-px bg-white/10" />

              <section>
                <h2 className="text-2xl font-black">
                  الملكية الفكرية
                </h2>

                <p className="mt-4 leading-8 text-zinc-400">
                  جميع النصوص والتصميمات والفيديوهات والملفات
                  والعلامات التجارية داخل المنصة تخضع لحقوق الملكية
                  الفكرية، ولا يجوز استخدامها خارج حدود الاشتراك
                  المسموح.
                </p>
              </section>

              <div className="h-px bg-white/10" />

              <section>
                <h2 className="text-2xl font-black">
                  تحديث الشروط
                </h2>

                <p className="mt-4 leading-8 text-zinc-400">
                  قد يتم تعديل هذه الشروط عند تطوير المنصة أو إضافة
                  خدمات جديدة، وسيتم نشر النسخة المحدثة في هذه
                  الصفحة.
                </p>
              </section>
            </div>
          </GlassCard>

          <GlassCard
            hover={false}
            className="mt-10 border-purple-500/20 bg-purple-500/[0.06] p-7 text-center md:p-10"
          >
            <Scale
              size={34}
              className="mx-auto text-purple-400"
            />

            <h2 className="mt-5 text-2xl font-black">
              استفسارات الشروط والأحكام
            </h2>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-zinc-400">
              يمكنك التواصل مع فريق الدعم للاستفسار عن أي بند قبل
              إنشاء الحساب أو الاشتراك.
            </p>

            <a
              href="mailto:support@infinityacademy.com"
              className="mt-6 inline-flex rounded-xl border border-purple-500/30 bg-purple-500/10 px-6 py-3 font-bold text-purple-300 transition hover:bg-purple-600 hover:text-white"
            >
              support@infinityacademy.com
            </a>
          </GlassCard>
        </div>
      </section>

      <Footer />
    </main>
  );
}
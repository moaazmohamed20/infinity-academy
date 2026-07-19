import {
  Cookie,
  Database,
  LockKeyhole,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import GlassCard from "../../components/ui/GlassCard";
import SectionTitle from "../../components/ui/SectionTitle";

const privacySections = [
  {
    title: "البيانات التي قد نجمعها",
    description:
      "قد تشمل البيانات الاسم، البريد الإلكتروني، رقم الهاتف، معلومات الحساب، تقدمك في الكورسات وأي بيانات ترسلها عند التواصل مع فريق الدعم.",
    icon: Database,
  },
  {
    title: "كيفية استخدام البيانات",
    description:
      "تُستخدم البيانات لتشغيل الحساب، تقديم المحتوى التعليمي، متابعة تقدمك، تحسين تجربة المنصة والرد على الاستفسارات.",
    icon: UserCheck,
  },
  {
    title: "حماية المعلومات",
    description:
      "نعمل على استخدام إجراءات تقنية وتنظيمية مناسبة لحماية البيانات من الوصول أو الاستخدام غير المصرح به.",
    icon: LockKeyhole,
  },
  {
    title: "ملفات تعريف الارتباط",
    description:
      "قد تستخدم المنصة ملفات تعريف الارتباط لحفظ تفضيلاتك، تحسين الأداء وتحليل كيفية استخدام صفحات الموقع.",
    icon: Cookie,
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-5xl">
          <SectionTitle
            badge="حماية بياناتك"
            title="سياسة"
            highlightedText="الخصوصية"
            description="توضح هذه الصفحة بصورة عامة كيفية التعامل مع المعلومات عند استخدام منصة Infinity Academy."
            align="center"
          />

          <GlassCard
            hover={false}
            className="mt-12 border-yellow-500/20 bg-yellow-500/[0.05] p-6"
          >
            <div className="flex items-start gap-4">
              <ShieldCheck
                size={24}
                className="mt-1 shrink-0 text-yellow-400"
              />

              <div>
                <h2 className="font-black text-yellow-300">
                  تنبيه مهم
                </h2>

                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  هذه صياغة مبدئية للموقع، ويجب مراجعتها وتعديلها
                  وفق الخدمات الفعلية ووسائل الدفع وقوانين الدولة
                  قبل إطلاق المنصة رسميًا.
                </p>
              </div>
            </div>
          </GlassCard>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {privacySections.map((section) => {
              const Icon = section.icon;

              return (
                <GlassCard
                  key={section.title}
                  as="article"
                  className="group h-full p-7"
                >
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 transition duration-300 group-hover:bg-purple-600 group-hover:text-white">
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
                <h2 className="text-2xl font-black">
                  مشاركة البيانات
                </h2>

                <p className="mt-4 leading-8 text-zinc-400">
                  لا يتم بيع بيانات المستخدمين. وقد تتم مشاركة
                  البيانات الضرورية مع مزودي الخدمات الذين يساعدون
                  في تشغيل المنصة، مثل خدمات الاستضافة أو الدفع أو
                  البريد الإلكتروني، وفق الحاجة فقط.
                </p>
              </section>

              <div className="h-px bg-white/10" />

              <section>
                <h2 className="text-2xl font-black">
                  الاحتفاظ بالبيانات
                </h2>

                <p className="mt-4 leading-8 text-zinc-400">
                  يتم الاحتفاظ بالبيانات للمدة اللازمة لتقديم
                  الخدمة وتنفيذ الالتزامات المتعلقة بالحساب
                  والاشتراك، ما لم تتطلب القوانين الاحتفاظ بها لمدة
                  أطول.
                </p>
              </section>

              <div className="h-px bg-white/10" />

              <section>
                <h2 className="text-2xl font-black">
                  حقوق المستخدم
                </h2>

                <p className="mt-4 leading-8 text-zinc-400">
                  يمكنك طلب معرفة بيانات حسابك أو تحديثها أو حذفها،
                  وفق الإمكانات المتاحة والالتزامات القانونية
                  المطبقة على المنصة.
                </p>
              </section>

              <div className="h-px bg-white/10" />

              <section>
                <h2 className="text-2xl font-black">
                  تحديث سياسة الخصوصية
                </h2>

                <p className="mt-4 leading-8 text-zinc-400">
                  قد يتم تحديث هذه السياسة عند إضافة خدمات أو
                  تغييرات جديدة، وسيتم نشر النسخة المحدثة داخل هذه
                  الصفحة.
                </p>
              </section>
            </div>
          </GlassCard>

          <GlassCard
            hover={false}
            className="mt-10 border-purple-500/20 bg-purple-500/[0.06] p-7 text-center md:p-10"
          >
            <Mail
              size={32}
              className="mx-auto text-purple-400"
            />

            <h2 className="mt-5 text-2xl font-black">
              لديك استفسار عن بياناتك؟
            </h2>

            <p className="mt-4 text-zinc-400">
              تواصل معنا من خلال البريد الإلكتروني.
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
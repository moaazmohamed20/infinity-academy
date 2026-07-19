import Link from "next/link";
import {
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import CheckoutForm from "../../components/checkout/CheckoutForm";

type CheckoutPageProps = {
  searchParams: Promise<{
    plan?: string | string[];
  }>;
};

const plans = {
  monthly: {
    name: "الباقة الاحترافية",
    price: 299,
    period: "شهريًا",
    description:
      "وصول كامل لجميع الكورسات والمسارات التعليمية لمدة شهر.",
    features: [
      "الوصول إلى جميع الكورسات",
      "جميع مسارات التعلم",
      "شهادات إتمام معتمدة",
      "تحميل الملفات والمصادر",
      "مشاهدة الدروس بدون حدود",
      "دعم فني سريع",
    ],
  },

  yearly: {
    name: "الباقة السنوية",
    price: 2499,
    period: "سنويًا",
    description:
      "أفضل قيمة للتعلم طوال العام مع توفير كبير.",
    features: [
      "كل مميزات الباقة الاحترافية",
      "اشتراك كامل لمدة عام",
      "محتوى حصري للمشتركين",
      "أولوية في الدعم الفني",
      "شهادات لجميع الكورسات",
      "الوصول إلى التحديثات الجديدة",
    ],
  },
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams;

  const planParam = Array.isArray(params.plan)
    ? params.plan[0]
    : params.plan;

  const selectedPlanKey: "monthly" | "yearly" =
    planParam === "yearly"
      ? "yearly"
      : "monthly";

  const selectedPlan =
    plans[selectedPlanKey];

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-indigo-600/10 blur-[130px]" />

        <div className="relative mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-2 text-sm font-bold text-purple-300">
              <Sparkles size={16} />
              إتمام الاشتراك
            </span>

            <h1 className="mt-6 text-4xl font-black md:text-5xl">
              اختر باقتك وأكمل
              <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                {" "}
                عملية الدفع
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl leading-8 text-zinc-400">
              اشترك في Infinity Academy واحصل على وصول كامل
              إلى المحتوى التعليمي والشهادات والمسارات المتخصصة.
            </p>
          </div>

          <div className="mt-12 flex justify-center">
            <div className="inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-2">
              <Link
                href="/checkout?plan=monthly"
                className={`rounded-xl px-6 py-3 text-sm font-bold transition ${
                  selectedPlanKey === "monthly"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                اشتراك شهري
              </Link>

              <Link
                href="/checkout?plan=yearly"
                className={`rounded-xl px-6 py-3 text-sm font-bold transition ${
                  selectedPlanKey === "yearly"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                اشتراك سنوي
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_420px]">
            <CheckoutForm plan={selectedPlanKey} />

            <aside className="h-fit rounded-3xl border border-purple-500/20 bg-gradient-to-b from-purple-500/10 to-white/[0.03] p-7">
              <p className="text-sm font-bold text-purple-300">
                ملخص الطلب
              </p>

              <h2 className="mt-3 text-2xl font-black">
                {selectedPlan.name}
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                {selectedPlan.description}
              </p>

              <div className="mt-7 flex items-end justify-between border-b border-white/10 pb-7">
                <span className="text-zinc-400">
                  قيمة الاشتراك
                </span>

                <div className="text-left">
                  <span className="text-4xl font-black">
                    {selectedPlan.price}
                  </span>

                  <span className="mr-2 text-sm text-zinc-400">
                    جنيه
                  </span>

                  <p className="mt-1 text-xs text-zinc-500">
                    {selectedPlan.period}
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-4">
                {selectedPlan.features.map((feature) => (
                  <div
                    key={feature}
                    className="flex items-center gap-3 text-sm text-zinc-300"
                  >
                    <CheckCircle2
                      size={19}
                      className="shrink-0 text-green-400"
                    />

                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-400">
                    الإجمالي
                  </span>

                  <span className="text-xl font-black">
                    {selectedPlan.price} جنيه
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
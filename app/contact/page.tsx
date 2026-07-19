"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import {
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import GlassCard from "../../components/ui/GlassCard";
import SectionTitle from "../../components/ui/SectionTitle";

const contactMethods = [
  {
    title: "البريد الإلكتروني",
    value: "support@infinityacademy.com",
    description: "راسلنا في أي وقت",
    href: "mailto:support@infinityacademy.com",
    icon: Mail,
  },
  {
    title: "رقم الهاتف",
    value: "+20 100 000 0000",
    description: "متاح خلال مواعيد العمل",
    href: "tel:+201000000000",
    icon: Phone,
  },
  {
    title: "الموقع",
    value: "القاهرة، مصر",
    description: "مقر Infinity Academy",
    href: null,
    icon: MapPin,
  },
  {
    title: "مواعيد الدعم",
    value: "يوميًا من 9 صباحًا إلى 9 مساءً",
    description: "دعم سريع ومستمر",
    href: null,
    icon: Clock3,
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] =
    useState(false);

  const handleSubmit = (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setSubmitted(true);

    event.currentTarget.reset();
  };

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-7xl">
          <SectionTitle
            badge="نحن هنا لمساعدتك"
            title="تواصل مع"
            highlightedText="Infinity Academy"
            description="أرسل لنا استفسارك أو مشكلتك، وسيقوم فريق الدعم بالرد عليك في أقرب وقت."
            align="center"
          />

          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method) => {
              const Icon = method.icon;

              const content = (
                <>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <Icon size={23} />
                  </div>

                  <h2 className="mt-5 text-lg font-black">
                    {method.title}
                  </h2>

                  <p
                    className="mt-3 break-words text-sm font-semibold text-purple-300"
                    dir={
                      method.title ===
                        "البريد الإلكتروني" ||
                      method.title === "رقم الهاتف"
                        ? "ltr"
                        : undefined
                    }
                  >
                    {method.value}
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    {method.description}
                  </p>
                </>
              );

              if (method.href) {
                return (
                  <a
                    key={method.title}
                    href={method.href}
                    className="block"
                  >
                    <GlassCard
                      as="article"
                      className="h-full p-6"
                    >
                      {content}
                    </GlassCard>
                  </a>
                );
              }

              return (
                <GlassCard
                  key={method.title}
                  as="article"
                  className="h-full p-6"
                >
                  {content}
                </GlassCard>
              );
            })}
          </div>

          <div className="mt-14 grid gap-8 lg:grid-cols-[1fr_420px]">
            <GlassCard
              hover={false}
              className="p-7 md:p-10"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                  <Send size={23} />
                </div>

                <div>
                  <h2 className="text-2xl font-black">
                    أرسل رسالة
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    املأ البيانات وسنتواصل معك
                    قريبًا.
                  </p>
                </div>
              </div>

              {submitted && (
                <div
                  role="status"
                  className="mt-7 rounded-2xl border border-green-500/30 bg-green-500/10 px-5 py-4 text-sm font-semibold text-green-300"
                >
                  تم إرسال رسالتك بنجاح. سيتواصل
                  معك فريق الدعم قريبًا.
                </div>
              )}

              <form
                className="mt-8 space-y-6"
                onSubmit={handleSubmit}
              >
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-3 block text-sm font-bold text-zinc-300"
                    >
                      الاسم بالكامل
                    </label>

                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder="اكتب اسمك"
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-3 block text-sm font-bold text-zinc-300"
                    >
                      البريد الإلكتروني
                    </label>

                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="name@example.com"
                      className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-subject"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    موضوع الرسالة
                  </label>

                  <input
                    id="contact-subject"
                    name="subject"
                    type="text"
                    required
                    placeholder="اكتب موضوع رسالتك"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    رسالتك
                  </label>

                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={7}
                    placeholder="اكتب تفاصيل استفسارك أو مشكلتك..."
                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-4 leading-7 text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-black text-white shadow-lg shadow-purple-950/30 transition duration-300 hover:scale-[1.02] hover:shadow-purple-600/30 sm:w-auto"
                >
                  إرسال الرسالة
                  <Send size={19} />
                </button>
              </form>
            </GlassCard>

            <GlassCard
              hover={false}
              className="h-fit border-purple-500/20 bg-purple-500/[0.06] p-7 md:p-8"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
                <MessageCircle size={27} />
              </div>

              <h2 className="mt-6 text-2xl font-black">
                كيف يمكننا مساعدتك؟
              </h2>

              <p className="mt-4 leading-8 text-zinc-400">
                يمكنك التواصل معنا بخصوص الاشتراك،
                الكورسات، الحساب، الشهادات أو أي مشكلة
                تقنية تواجهك أثناء استخدام المنصة.
              </p>

              <div className="mt-7 space-y-4">
                {[
                  "مشكلات تسجيل الدخول",
                  "الاستفسار عن الاشتراكات",
                  "مشكلات تشغيل الدروس",
                  "الاستفسار عن الشهادات",
                  "اقتراح كورسات جديدة",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-300"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-purple-500" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-sm font-bold text-white">
                  متوسط وقت الرد
                </p>

                <p className="mt-2 text-sm leading-7 text-zinc-400">
                  عادةً يرد فريق الدعم خلال 24 ساعة
                  من إرسال الرسالة.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
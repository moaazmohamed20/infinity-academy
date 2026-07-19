"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  Infinity as InfinityIcon,
  LoaderCircle,
  Mail,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import GlassCard from "../../components/ui/GlassCard";
import { createClient } from "../../lib/supabase/client";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const formData = new FormData(
      event.currentTarget
    );

    const email = String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${window.location.origin}/update-password`,
          }
        );

      if (error) {
        setErrorMessage(
          "تعذر إرسال رابط استعادة كلمة المرور. حاول مرة أخرى."
        );

        return;
      }

      setSuccessMessage(
        "تم إرسال رابط استعادة كلمة المرور. افتح بريدك الإلكتروني لإكمال العملية."
      );
    } catch {
      setErrorMessage(
        "حدث خطأ غير متوقع. حاول مرة أخرى."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-24">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-purple-600/15 blur-[140px]" />

        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[140px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <GlassCard
          hover={false}
          className="relative mx-auto max-w-xl p-8 shadow-2xl shadow-purple-950/30 sm:p-12"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
            <InfinityIcon size={35} />
          </div>

          <p className="mt-8 text-sm font-bold text-purple-400">
            استعادة الحساب
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            نسيت كلمة المرور؟
          </h1>

          <p className="mt-4 leading-7 text-zinc-400">
            أدخل بريدك الإلكتروني وسنرسل إليك رابطًا
            لإنشاء كلمة مرور جديدة.
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-10 space-y-6"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-3 block text-sm font-bold text-zinc-300"
              >
                البريد الإلكتروني
              </label>

              <div className="flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500">
                <Mail
                  size={20}
                  className="shrink-0 text-zinc-500"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                  placeholder="name@example.com"
                  className="w-full bg-transparent px-4 py-4 text-white outline-none placeholder:text-zinc-600"
                />
              </div>
            </div>

            {errorMessage && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold leading-6 text-red-300"
              >
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div
                role="status"
                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold leading-6 text-emerald-300"
              >
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-black text-white shadow-lg shadow-purple-950/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {isLoading ? (
                <>
                  <LoaderCircle
                    size={19}
                    className="animate-spin"
                  />
                  جارٍ إرسال الرابط...
                </>
              ) : (
                "إرسال رابط الاستعادة"
              )}
            </button>
          </form>

          <Link
            href="/login"
            className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-purple-400 transition hover:text-purple-300"
          >
            <ArrowRight size={18} />
            العودة إلى تسجيل الدخول
          </Link>
        </GlassCard>
      </section>

      <Footer />
    </main>
  );
}
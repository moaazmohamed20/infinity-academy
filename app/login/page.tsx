"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";
import {
  Eye,
  EyeOff,
  Infinity as InfinityIcon,
  LockKeyhole,
  Mail,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import GlassCard from "../../components/ui/GlassCard";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [isGoogleLoading, setIsGoogleLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setIsLoading(true);
    setErrorMessage("");

    const formData = new FormData(
      event.currentTarget
    );

    const email = String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    const password = String(
      formData.get("password") ?? ""
    );

    try {
      const supabase = createClient();

      const {
        data: signInData,
        error: signInError,
      } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (
        signInError ||
        !signInData.user
      ) {
        setErrorMessage(
          "البريد الإلكتروني أو كلمة المرور غير صحيحة."
        );

        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", signInData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error(
          "تعذر تحميل صلاحية المستخدم:",
          profileError
        );
      }

      const destination =
        profile?.role === "admin"
          ? "/admin"
          : "/dashboard";

      router.replace(destination);
      router.refresh();
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      setErrorMessage(
        "حدث خطأ أثناء تسجيل الدخول. حاول مرة أخرى."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage("");

    try {
      const supabase = createClient();

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
          },
        });

      if (error) {
        setErrorMessage(
          "تعذر تسجيل الدخول باستخدام Google. حاول مرة أخرى."
        );

        setIsGoogleLoading(false);
      }
    } catch (error) {
      console.error(
        "Google login error:",
        error
      );

      setErrorMessage(
        "حدث خطأ أثناء الاتصال بخدمة Google. حاول مرة أخرى."
      );

      setIsGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-20">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-purple-600/15 blur-[140px]" />

        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[140px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <GlassCard
          hover={false}
          className="relative mx-auto grid max-w-6xl overflow-hidden p-0 shadow-2xl shadow-purple-950/30 lg:grid-cols-2"
        >
          <div className="hidden min-h-[680px] flex-col justify-between bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 p-12 lg:flex">
            <div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur">
                <InfinityIcon size={36} />
              </div>

              <h1 className="mt-10 text-5xl font-black leading-tight">
                أهلاً بعودتك إلى Infinity Academy
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-white/80">
                أكمل رحلة التعلم، تابع تقدمك، وابدأ من
                آخر درس وصلت إليه.
              </p>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
              <p className="text-lg font-bold">
                تعلم بلا حدود
              </p>

              <p className="mt-3 leading-7 text-white/75">
                كورسات احترافية، مسارات تعليمية،
                اختبارات وشهادات في مكان واحد.
              </p>
            </div>
          </div>

          <div className="p-8 sm:p-12 lg:p-16">
            <div className="mx-auto max-w-md">
              <div className="lg:hidden">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
                  <InfinityIcon size={32} />
                </div>
              </div>

              <span className="mt-8 inline-block text-sm font-bold text-purple-400 lg:mt-0">
                تسجيل الدخول
              </span>

              <h2 className="mt-4 text-4xl font-black">
                مرحبًا بعودتك
              </h2>

              <p className="mt-4 leading-7 text-zinc-400">
                أدخل بيانات حسابك لمتابعة رحلة التعلم.
              </p>

              <form
                className="mt-10 space-y-6"
                onSubmit={handleSubmit}
              >
                <div>
                  <label
                    htmlFor="email"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    البريد الإلكتروني
                  </label>

                  <div className="flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition duration-300 focus-within:border-purple-500 focus-within:bg-purple-500/[0.04]">
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

                <div>
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <label
                      htmlFor="password"
                      className="text-sm font-bold text-zinc-300"
                    >
                      كلمة المرور
                    </label>

                    <Link
                      href="/forgot-password"
                      className="text-sm font-semibold text-purple-400 transition hover:text-purple-300"
                    >
                      نسيت كلمة المرور؟
                    </Link>
                  </div>

                  <div className="flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition duration-300 focus-within:border-purple-500 focus-within:bg-purple-500/[0.04]">
                    <LockKeyhole
                      size={20}
                      className="shrink-0 text-zinc-500"
                    />

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      required
                      minLength={6}
                      placeholder="أدخل كلمة المرور"
                      className="w-full bg-transparent px-4 py-4 text-white outline-none placeholder:text-zinc-600"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                      aria-label={
                        showPassword
                          ? "إخفاء كلمة المرور"
                          : "إظهار كلمة المرور"
                      }
                      aria-pressed={showPassword}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/5 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <label
                  htmlFor="remember-me"
                  className="flex w-fit cursor-pointer items-center gap-3 text-sm text-zinc-400"
                >
                  <input
                    id="remember-me"
                    name="remember"
                    type="checkbox"
                    className="h-4 w-4 cursor-pointer accent-purple-600"
                  />

                  تذكرني على هذا الجهاز
                </label>

                {errorMessage && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300"
                  >
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    isLoading ||
                    isGoogleLoading
                  }
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-black text-white shadow-lg shadow-purple-950/30 transition duration-300 hover:scale-[1.02] hover:shadow-purple-600/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {isLoading
                    ? "جارٍ تسجيل الدخول..."
                    : "تسجيل الدخول"}
                </button>
              </form>

              <div className="my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/10" />

                <span className="text-sm text-zinc-600">
                  أو
                </span>

                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={
                  isGoogleLoading ||
                  isLoading
                }
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-4 font-bold text-white transition duration-300 hover:border-white/20 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-zinc-900">
                  G
                </span>

                {isGoogleLoading
                  ? "جارٍ الاتصال بـ Google..."
                  : "المتابعة باستخدام Google"}
              </button>

              <p className="mt-8 text-center text-zinc-400">
                ليس لديك حساب؟{" "}
                <Link
                  href="/register"
                  className="font-bold text-purple-400 transition hover:text-purple-300"
                >
                  إنشاء حساب جديد
                </Link>
              </p>
            </div>
          </div>
        </GlassCard>
      </section>

      <Footer />
    </main>
  );
}
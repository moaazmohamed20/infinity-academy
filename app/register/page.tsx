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
  Phone,
  UserRound,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import GlassCard from "../../components/ui/GlassCard";
import { createClient } from "../../lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [acceptTerms, setAcceptTerms] =
    useState(false);

  const [passwordError, setPasswordError] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  const [isGoogleLoading, setIsGoogleLoading] =
    useState(false);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setPasswordError("");
    setErrorMessage("");
    setSuccessMessage("");

    if (password !== confirmPassword) {
      setPasswordError(
        "كلمتا المرور غير متطابقتين."
      );

      return;
    }

    if (!acceptTerms) {
      setErrorMessage(
        "يجب الموافقة على الشروط والأحكام وسياسة الخصوصية."
      );

      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);

    const fullName = String(
      formData.get("name") ?? ""
    ).trim();

    const email = String(
      formData.get("email") ?? ""
    )
      .trim()
      .toLowerCase();

    const phone = String(
      formData.get("phone") ?? ""
    ).trim();

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { data, error } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone,
            },
          },
        });

      if (error) {
        setErrorMessage(
          "تعذر إنشاء الحساب. تأكد من البيانات أو استخدم بريدًا إلكترونيًا آخر."
        );

        return;
      }

      if (data.session) {
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      setSuccessMessage(
        "تم إنشاء الحساب. افتح بريدك الإلكتروني واضغط على رابط تأكيد الحساب."
      );

      form.reset();
      setPassword("");
      setConfirmPassword("");
      setAcceptTerms(false);
    } catch {
      setErrorMessage(
        "حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setPasswordError("");
    setErrorMessage("");
    setSuccessMessage("");

    if (!acceptTerms) {
      setErrorMessage(
        "يجب الموافقة على الشروط والأحكام وسياسة الخصوصية أولًا."
      );

      return;
    }

    setIsGoogleLoading(true);

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
          "تعذر التسجيل باستخدام Google. حاول مرة أخرى."
        );

        setIsGoogleLoading(false);
      }
    } catch {
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
          <div className="hidden min-h-[820px] flex-col justify-between bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-700 p-12 lg:flex">
            <div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur">
                <InfinityIcon size={36} />
              </div>

              <h1 className="mt-10 text-5xl font-black leading-tight">
                ابدأ رحلتك التعليمية مع Infinity
                Academy
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-8 text-white/80">
                أنشئ حسابك الآن وابدأ التعلم من خلال
                كورسات ومسارات تعليمية احترافية.
              </p>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur">
              <p className="text-lg font-bold">
                كل ما تحتاجه للتطور
              </p>

              <p className="mt-3 leading-7 text-white/75">
                كورسات، اختبارات، شهادات، متابعة تقدم
                ومحتوى عملي يساعدك على بناء مهارات
                حقيقية.
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
                إنشاء حساب
              </span>

              <h2 className="mt-4 text-4xl font-black">
                انضم إلينا الآن
              </h2>

              <p className="mt-4 leading-7 text-zinc-400">
                أدخل بياناتك لإنشاء حساب جديد وبدء
                التعلم.
              </p>

              <form
                className="mt-10 space-y-5"
                onSubmit={handleSubmit}
              >
                <div>
                  <label
                    htmlFor="name"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    الاسم بالكامل
                  </label>

                  <div className="flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition duration-300 focus-within:border-purple-500 focus-within:bg-purple-500/[0.04]">
                    <UserRound
                      size={20}
                      className="shrink-0 text-zinc-500"
                    />

                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required
                      minLength={3}
                      placeholder="اكتب اسمك بالكامل"
                      className="w-full bg-transparent px-4 py-4 text-white outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </div>

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
                  <label
                    htmlFor="phone"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    رقم الهاتف
                  </label>

                  <div className="flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition duration-300 focus-within:border-purple-500 focus-within:bg-purple-500/[0.04]">
                    <Phone
                      size={20}
                      className="shrink-0 text-zinc-500"
                    />

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      inputMode="tel"
                      required
                      minLength={10}
                      placeholder="01xxxxxxxxx"
                      className="w-full bg-transparent px-4 py-4 text-white outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    كلمة المرور
                  </label>

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
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => {
                        setPassword(
                          event.target.value
                        );
                        setPasswordError("");
                        setErrorMessage("");
                      }}
                      placeholder="ثمانية أحرف على الأقل"
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

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    تأكيد كلمة المرور
                  </label>

                  <div
                    className={`flex items-center rounded-2xl border bg-black/20 px-4 transition duration-300 focus-within:bg-purple-500/[0.04] ${
                      passwordError
                        ? "border-red-500/70 focus-within:border-red-500"
                        : "border-white/10 focus-within:border-purple-500"
                    }`}
                  >
                    <LockKeyhole
                      size={20}
                      className="shrink-0 text-zinc-500"
                    />

                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type={
                        showConfirmPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(
                          event.target.value
                        );
                        setPasswordError("");
                        setErrorMessage("");
                      }}
                      aria-invalid={
                        passwordError
                          ? true
                          : undefined
                      }
                      aria-describedby={
                        passwordError
                          ? "password-error"
                          : undefined
                      }
                      placeholder="اكتب كلمة المرور مرة أخرى"
                      className="w-full bg-transparent px-4 py-4 text-white outline-none placeholder:text-zinc-600"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (current) => !current
                        )
                      }
                      aria-label={
                        showConfirmPassword
                          ? "إخفاء تأكيد كلمة المرور"
                          : "إظهار تأكيد كلمة المرور"
                      }
                      aria-pressed={
                        showConfirmPassword
                      }
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/5 hover:text-white"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>

                  {passwordError && (
                    <p
                      id="password-error"
                      role="alert"
                      className="mt-2 text-sm text-red-400"
                    >
                      {passwordError}
                    </p>
                  )}
                </div>

                <label
                  htmlFor="accept-terms"
                  className="flex cursor-pointer items-start gap-3 text-sm leading-7 text-zinc-400"
                >
                  <input
                    id="accept-terms"
                    name="acceptTerms"
                    type="checkbox"
                    required
                    checked={acceptTerms}
                    onChange={(event) => {
                      setAcceptTerms(
                        event.target.checked
                      );
                      setErrorMessage("");
                    }}
                    className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-purple-600"
                  />

                  <span>
                    أوافق على{" "}
                    <Link
                      href="/terms"
                      className="font-bold text-purple-400 transition hover:text-purple-300"
                    >
                      الشروط والأحكام
                    </Link>{" "}
                    و{" "}
                    <Link
                      href="/privacy"
                      className="font-bold text-purple-400 transition hover:text-purple-300"
                    >
                      سياسة الخصوصية
                    </Link>
                  </span>
                </label>

                {errorMessage && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold leading-6 text-red-300"
                  >
                    {errorMessage}
                  </div>
                )}

                {successMessage && (
                  <div
                    role="status"
                    aria-live="polite"
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-semibold leading-6 text-emerald-300"
                  >
                    {successMessage}
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
                    ? "جارٍ إنشاء الحساب..."
                    : "إنشاء الحساب"}
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
                onClick={handleGoogleRegister}
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
                  : "التسجيل باستخدام Google"}
              </button>

              <p className="mt-8 text-center text-zinc-400">
                لديك حساب بالفعل؟{" "}
                <Link
                  href="/login"
                  className="font-bold text-purple-400 transition hover:text-purple-300"
                >
                  تسجيل الدخول
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
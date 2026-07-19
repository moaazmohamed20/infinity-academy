"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import type { FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Infinity as InfinityIcon,
  KeyRound,
  LoaderCircle,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import GlassCard from "../../components/ui/GlassCard";
import { createClient } from "../../lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [isPreparing, setIsPreparing] =
    useState(true);

  const [canUpdate, setCanUpdate] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    const prepareRecoverySession = async () => {
      const searchParams = new URLSearchParams(
        window.location.search
      );

      const code = searchParams.get("code");

      if (code) {
        const { error } =
          await supabase.auth.exchangeCodeForSession(
            code
          );

        if (error) {
          if (isMounted) {
            setErrorMessage(
              "رابط استعادة كلمة المرور غير صالح أو انتهت صلاحيته."
            );

            setIsPreparing(false);
          }

          return;
        }

        window.history.replaceState(
          {},
          document.title,
          "/update-password"
        );
      }

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      if (error || !session) {
        setErrorMessage(
          "افتح رابط استعادة كلمة المرور المرسل إلى بريدك الإلكتروني أولًا."
        );

        setCanUpdate(false);
      } else {
        setCanUpdate(true);
        setErrorMessage("");
      }

      setIsPreparing(false);
    };

    void prepareRecoverySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) {
          return;
        }

        if (
          event === "PASSWORD_RECOVERY" ||
          session
        ) {
          setCanUpdate(true);
          setErrorMessage("");
          setIsPreparing(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!canUpdate) {
      setErrorMessage(
        "رابط استعادة كلمة المرور غير صالح أو انتهت صلاحيته."
      );

      return;
    }

    if (password.length < 8) {
      setErrorMessage(
        "كلمة المرور يجب ألا تقل عن 8 أحرف."
      );

      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage(
        "كلمتا المرور غير متطابقتين."
      );

      return;
    }

    setIsLoading(true);

    try {
      const { error } =
        await supabase.auth.updateUser({
          password,
        });

      if (error) {
        setErrorMessage(
          "تعذر تغيير كلمة المرور. حاول طلب رابط استعادة جديد."
        );

        return;
      }

      setSuccessMessage(
        "تم تغيير كلمة المرور بنجاح. سيتم تحويلك إلى تسجيل الدخول."
      );

      await supabase.auth.signOut({
        scope: "local",
      });

      window.setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1500);
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
            تأمين الحساب
          </p>

          <h1 className="mt-3 text-3xl font-black sm:text-4xl">
            إنشاء كلمة مرور جديدة
          </h1>

          <p className="mt-4 leading-7 text-zinc-400">
            اختر كلمة مرور قوية وجديدة لحسابك.
          </p>

          {isPreparing ? (
            <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-5 py-8 text-zinc-400">
              <LoaderCircle
                size={22}
                className="animate-spin text-purple-400"
              />

              جارٍ التحقق من رابط الاستعادة...
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-10 space-y-6"
            >
              <div>
                <label
                  htmlFor="password"
                  className="mb-3 block text-sm font-bold text-zinc-300"
                >
                  كلمة المرور الجديدة
                </label>

                <div className="flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500">
                  <KeyRound
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

                      setErrorMessage("");
                    }}
                    placeholder="ثمانية أحرف على الأقل"
                    disabled={!canUpdate}
                    className="w-full bg-transparent px-4 py-4 text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed"
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
                  تأكيد كلمة المرور الجديدة
                </label>

                <div className="flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500">
                  <KeyRound
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

                      setErrorMessage("");
                    }}
                    placeholder="اكتب كلمة المرور مرة أخرى"
                    disabled={!canUpdate}
                    className="w-full bg-transparent px-4 py-4 text-white outline-none placeholder:text-zinc-600 disabled:cursor-not-allowed"
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
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/5 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={20} />
                    ) : (
                      <Eye size={20} />
                    )}
                  </button>
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
                disabled={
                  isLoading || !canUpdate
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-black text-white shadow-lg shadow-purple-950/30 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle
                      size={19}
                      className="animate-spin"
                    />

                    جارٍ تغيير كلمة المرور...
                  </>
                ) : (
                  "حفظ كلمة المرور الجديدة"
                )}
              </button>
            </form>
          )}

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
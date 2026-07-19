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
  LoaderCircle,
  Mail,
  Phone,
  Save,
  UserRound,
} from "lucide-react";

import Navbar from "../../components/layout/Navbar";
import Footer from "../../components/layout/Footer";
import GlassCard from "../../components/ui/GlassCard";
import { createClient } from "../../lib/supabase/client";

export default function ProfilePage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (userError || !user) {
        router.replace("/login");
        router.refresh();
        return;
      }

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("full_name, phone")
          .eq("id", user.id)
          .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (profileError) {
        setErrorMessage(
          "تعذر تحميل بيانات الحساب."
        );

        setIsLoading(false);
        return;
      }

      const metadata = user.user_metadata;

      setFullName(
        profile?.full_name ??
          metadata?.full_name ??
          ""
      );

      setPhone(
        profile?.phone ??
          metadata?.phone ??
          ""
      );

      setIsLoading(false);
    };

    void loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    const cleanName = fullName.trim();
    const cleanPhone = phone.trim();

    if (!userId) {
      setErrorMessage(
        "تعذر التحقق من الحساب. سجل الدخول مرة أخرى."
      );

      return;
    }

    if (cleanName.length < 3) {
      setErrorMessage(
        "الاسم يجب ألا يقل عن 3 أحرف."
      );

      return;
    }

    if (cleanPhone.length < 10) {
      setErrorMessage(
        "اكتب رقم هاتف صحيح."
      );

      return;
    }

    setIsSaving(true);

    try {
      const { error: profileError } =
        await supabase
          .from("profiles")
          .upsert(
            {
              id: userId,
              full_name: cleanName,
              phone: cleanPhone,
            },
            {
              onConflict: "id",
            }
          );

      if (profileError) {
        setErrorMessage(
          "تعذر حفظ بيانات الملف الشخصي."
        );

        return;
      }

      const { error: userError } =
        await supabase.auth.updateUser({
          data: {
            full_name: cleanName,
            phone: cleanPhone,
          },
        });

      if (userError) {
        setErrorMessage(
          "تم حفظ البيانات، لكن تعذر تحديث بيانات الحساب الأساسية."
        );

        return;
      }

      setFullName(cleanName);
      setPhone(cleanPhone);

      setSuccessMessage(
        "تم تحديث بيانات الحساب بنجاح."
      );

      router.refresh();
    } catch {
      setErrorMessage(
        "حدث خطأ غير متوقع. حاول مرة أخرى."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-white/10 px-6 py-16">
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-purple-600/15 blur-[140px]" />

        <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[140px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-5xl">
          <p className="text-sm font-bold text-purple-400">
            إعدادات الحساب
          </p>

          <h1 className="mt-3 text-4xl font-black md:text-5xl">
            الملف الشخصي
          </h1>

          <p className="mt-4 max-w-2xl leading-8 text-zinc-400">
            يمكنك مراجعة بيانات حسابك وتحديث الاسم
            ورقم الهاتف.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[280px_1fr]">
          <GlassCard
            hover={false}
            className="h-fit p-7"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
              <UserRound size={38} />
            </div>

            <h2 className="mt-6 text-2xl font-black">
              {fullName || "حساب الطالب"}
            </h2>

            <p className="mt-2 break-all text-sm text-zinc-500">
              {email}
            </p>

            <div className="mt-7 border-t border-white/10 pt-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-bold text-purple-400 transition hover:text-purple-300"
              >
                <ArrowRight size={18} />
                العودة إلى لوحة التحكم
              </Link>
            </div>
          </GlassCard>

          <GlassCard
            hover={false}
            className="p-7 md:p-9"
          >
            <h2 className="text-2xl font-black">
              البيانات الشخصية
            </h2>

            <p className="mt-3 text-sm leading-7 text-zinc-400">
              عدّل بياناتك ثم اضغط على زر حفظ
              التغييرات.
            </p>

            {isLoading ? (
              <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-6 py-12 text-zinc-400">
                <LoaderCircle
                  size={23}
                  className="animate-spin text-purple-400"
                />

                جارٍ تحميل البيانات...
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-9 space-y-6"
              >
                <div>
                  <label
                    htmlFor="full-name"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    الاسم بالكامل
                  </label>

                  <div className="flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500">
                    <UserRound
                      size={20}
                      className="shrink-0 text-zinc-500"
                    />

                    <input
                      id="full-name"
                      name="fullName"
                      type="text"
                      autoComplete="name"
                      required
                      minLength={3}
                      value={fullName}
                      onChange={(event) => {
                        setFullName(
                          event.target.value
                        );

                        setErrorMessage("");
                        setSuccessMessage("");
                      }}
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

                  <div className="flex items-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 opacity-70">
                    <Mail
                      size={20}
                      className="shrink-0 text-zinc-500"
                    />

                    <input
                      id="email"
                      type="email"
                      value={email}
                      readOnly
                      className="w-full cursor-not-allowed bg-transparent px-4 py-4 text-zinc-400 outline-none"
                    />
                  </div>

                  <p className="mt-2 text-xs text-zinc-600">
                    لا يمكن تغيير البريد الإلكتروني من
                    هذه الصفحة.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="phone"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    رقم الهاتف
                  </label>

                  <div className="flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500">
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
                      value={phone}
                      onChange={(event) => {
                        setPhone(
                          event.target.value
                        );

                        setErrorMessage("");
                        setSuccessMessage("");
                      }}
                      placeholder="01xxxxxxxxx"
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
                  disabled={isSaving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-black text-white shadow-lg shadow-purple-950/30 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {isSaving ? (
                    <>
                      <LoaderCircle
                        size={19}
                        className="animate-spin"
                      />

                      جارٍ حفظ التغييرات...
                    </>
                  ) : (
                    <>
                      <Save size={19} />
                      حفظ التغييرات
                    </>
                  )}
                </button>
              </form>
            )}
          </GlassCard>
        </div>
      </section>

      <Footer />
    </main>
  );
}
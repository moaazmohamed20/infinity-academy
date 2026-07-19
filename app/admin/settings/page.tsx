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
  KeyRound,
  LoaderCircle,
  Mail,
  Phone,
  Save,
  Settings,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import Navbar from "../../../components/layout/Navbar";
import Footer from "../../../components/layout/Footer";
import GlassCard from "../../../components/ui/GlassCard";
import { createClient } from "../../../lib/supabase/client";

export default function AdminSettingsPage() {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] =
    useState("");
  const [phone, setPhone] = useState("");

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadAdminProfile =
      async () => {
        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (!isMounted) {
          return;
        }

        if (userError || !user) {
          router.replace("/login");
          router.refresh();
          return;
        }

        const {
          data: profile,
          error: profileError,
        } = await supabase
          .from("profiles")
          .select(
            "full_name, phone, role"
          )
          .eq("id", user.id)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        if (profileError) {
          setErrorMessage(
            "تعذر تحميل بيانات المدير."
          );

          setIsLoading(false);
          return;
        }

        if (
          !profile ||
          profile.role !== "admin"
        ) {
          router.replace("/dashboard");
          router.refresh();
          return;
        }

        const metadata =
          user.user_metadata;

        setUserId(user.id);
        setEmail(user.email ?? "");

        setFullName(
          profile.full_name ??
            metadata?.full_name ??
            ""
        );

        setPhone(
          profile.phone ??
            metadata?.phone ??
            ""
        );

        setIsLoading(false);
      };

    void loadAdminProfile();

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

    const cleanName =
      fullName.trim();

    const cleanPhone =
      phone.trim();

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
      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .update({
          full_name: cleanName,
          phone: cleanPhone,
        })
        .eq("id", userId);

      if (profileError) {
        console.error(
          "تعذر تحديث ملف المدير:",
          profileError
        );

        setErrorMessage(
          "تعذر حفظ بيانات المدير."
        );

        return;
      }

      const {
        error: userError,
      } =
        await supabase.auth.updateUser({
          data: {
            full_name: cleanName,
            phone: cleanPhone,
          },
        });

      if (userError) {
        console.error(
          "تعذر تحديث بيانات الحساب:",
          userError
        );

        setErrorMessage(
          "تم حفظ بيانات الملف، لكن تعذر تحديث بيانات الحساب الأساسية."
        );

        return;
      }

      setFullName(cleanName);
      setPhone(cleanPhone);

      setSuccessMessage(
        "تم تحديث إعدادات المدير بنجاح."
      );

      router.refresh();
    } catch (error) {
      console.error(
        "حدث خطأ أثناء الحفظ:",
        error
      );

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
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <div className="relative mx-auto max-w-6xl">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm font-bold text-zinc-400 transition hover:text-purple-400"
          >
            <ArrowRight size={17} />
            العودة إلى لوحة الإدارة
          </Link>

          <div className="mt-7 flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
              <Settings size={31} />
            </div>

            <div>
              <p className="text-sm font-bold text-purple-400">
                لوحة الإدارة
              </p>

              <h1 className="mt-2 text-3xl font-black md:text-5xl">
                إعدادات المدير
              </h1>

              <p className="mt-3 max-w-2xl leading-7 text-zinc-400">
                راجع بيانات حساب المدير وحدّث
                الاسم ورقم الهاتف وإعدادات
                الأمان.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
                <ShieldCheck size={38} />
              </div>

              <h2 className="mt-6 text-2xl font-black">
                {fullName ||
                  "مدير المنصة"}
              </h2>

              <p className="mt-2 break-all text-sm text-zinc-500">
                {email}
              </p>

              <span className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-300">
                <ShieldCheck size={15} />
                صلاحية Admin مفعّلة
              </span>

              <div className="mt-7 border-t border-white/10 pt-6">
                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-sm font-bold text-purple-400 transition hover:text-purple-300"
                >
                  <ArrowRight size={18} />
                  العودة إلى لوحة الإدارة
                </Link>
              </div>
            </GlassCard>

            <GlassCard
              hover={false}
              className="p-7"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <KeyRound size={24} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                أمان الحساب
              </h2>

              <p className="mt-3 text-sm leading-7 text-zinc-400">
                يمكنك تحديث كلمة المرور الخاصة
                بحساب المدير.
              </p>

              <Link
                href="/update-password"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-zinc-300 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
              >
                <KeyRound size={18} />
                تغيير كلمة المرور
              </Link>
            </GlassCard>
          </div>

          <GlassCard
            hover={false}
            className="p-7 md:p-9"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                <UserRound size={23} />
              </div>

              <div>
                <h2 className="text-2xl font-black">
                  بيانات المدير
                </h2>

                <p className="mt-1 text-sm leading-7 text-zinc-400">
                  عدّل البيانات ثم اضغط على
                  حفظ التغييرات.
                </p>
              </div>
            </div>

            {isLoading ? (
              <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-6 py-16 text-zinc-400">
                <LoaderCircle
                  size={23}
                  className="animate-spin text-purple-400"
                />

                جارٍ تحميل بيانات المدير...
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-9 space-y-6"
              >
                <div>
                  <label
                    htmlFor="admin-full-name"
                    className="mb-3 block text-sm font-bold text-zinc-300"
                  >
                    اسم المدير
                  </label>

                  <div className="flex items-center rounded-2xl border border-white/10 bg-black/20 px-4 transition focus-within:border-purple-500">
                    <UserRound
                      size={20}
                      className="shrink-0 text-zinc-500"
                    />

                    <input
                      id="admin-full-name"
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
                      placeholder="اكتب اسم المدير"
                      className="w-full bg-transparent px-4 py-4 text-white outline-none placeholder:text-zinc-600"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-email"
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
                      id="admin-email"
                      type="email"
                      value={email}
                      readOnly
                      className="w-full cursor-not-allowed bg-transparent px-4 py-4 text-zinc-400 outline-none"
                    />
                  </div>

                  <p className="mt-2 text-xs text-zinc-600">
                    لا يمكن تغيير البريد
                    الإلكتروني من هذه الصفحة.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="admin-phone"
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
                      id="admin-phone"
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
                  disabled={
                    isSaving || isLoading
                  }
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
"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  AlertCircle,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

type CheckoutFormProps = {
  plan: "monthly" | "yearly";
};

type PaymentResponse = {
  success?: boolean;
  checkoutUrl?: string;
  reference?: string;
  error?: string;
};

export default function CheckoutForm({
  plan,
}: CheckoutFormProps) {
  const [fullName, setFullName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [phone, setPhone] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const [isLoading, setIsLoading] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(
        "/api/paymob/create-intention",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            plan,
            fullName,
            email,
            phone,
          }),
        }
      );

      const data =
        (await response.json()) as PaymentResponse;

      if (
        !response.ok ||
        !data.success ||
        !data.checkoutUrl
      ) {
        setErrorMessage(
          data.error ||
            "تعذر إنشاء عملية الدفع. حاول مرة أخرى."
        );

        return;
      }

      window.location.assign(
        data.checkoutUrl
      );
    } catch (error) {
      console.error(
        "Checkout request error:",
        error
      );

      setErrorMessage(
        "تعذر الاتصال بخدمة الدفع. تأكد من اتصالك بالإنترنت وحاول مرة أخرى."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 md:p-9">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
          <CreditCard size={25} />
        </span>

        <div>
          <h2 className="text-2xl font-black">
            بيانات الدفع
          </h2>

          <p className="mt-1 text-sm text-zinc-500">
            أدخل بياناتك لإتمام الاشتراك.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 space-y-6"
      >
        <div>
          <label
            htmlFor="fullName"
            className="mb-2 block text-sm font-bold text-zinc-300"
          >
            الاسم بالكامل
          </label>

          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            required
            minLength={3}
            value={fullName}
            onChange={(event) =>
              setFullName(
                event.target.value
              )
            }
            disabled={isLoading}
            placeholder="اكتب اسمك بالكامل"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="mb-2 block text-sm font-bold text-zinc-300"
          >
            البريد الإلكتروني
          </label>

          <input
            id="email"
            name="email"
            type="email"
            dir="ltr"
            autoComplete="email"
            required
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            disabled={isLoading}
            placeholder="name@example.com"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-left text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <div>
          <label
            htmlFor="phone"
            className="mb-2 block text-sm font-bold text-zinc-300"
          >
            رقم الهاتف
          </label>

          <input
            id="phone"
            name="phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            required
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value
              )
            }
            disabled={isLoading}
            placeholder="01xxxxxxxxx"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-4 text-left text-white outline-none transition placeholder:text-zinc-600 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-300"
          >
            <AlertCircle
              size={20}
              className="mt-0.5 shrink-0"
            />

            <p className="leading-7">
              {errorMessage}
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-purple-500/20 bg-purple-500/[0.06] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={23}
              className="mt-1 shrink-0 text-purple-400"
            />

            <div>
              <p className="font-bold">
                دفع آمن ومحمي
              </p>

              <p className="mt-1 text-sm leading-7 text-zinc-400">
                لن يتم تخزين بيانات بطاقتك داخل الموقع،
                وسيتم تحويلك إلى بوابة Paymob الآمنة.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-lg font-black transition hover:scale-[1.01] hover:shadow-xl hover:shadow-purple-950/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {isLoading ? (
            <>
              <LoaderCircle
                size={22}
                className="animate-spin"
              />

              جاري تحويلك للدفع...
            </>
          ) : (
            "متابعة للدفع"
          )}
        </button>

        <p className="text-center text-xs leading-6 text-zinc-500">
          بالمتابعة أنت توافق على شروط الاستخدام
          وسياسة الخصوصية.
        </p>
      </form>
    </div>
  );
}
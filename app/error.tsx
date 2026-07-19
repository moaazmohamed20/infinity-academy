"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  AlertTriangle,
  Home,
  RotateCcw,
} from "lucide-react";

type ErrorPageProps = {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
};

export default function ErrorPage({
  error,
  reset,
}: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090B] px-6 py-20 text-white">
      <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-red-600/10 blur-[140px]" />

      <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-purple-600/10 blur-[140px]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl shadow-purple-950/30 backdrop-blur-xl md:p-14">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-red-500/30 bg-red-500/10 text-red-400">
          <AlertTriangle size={40} />
        </div>

        <h1 className="mt-8 text-3xl font-black md:text-5xl">
          حدث خطأ غير متوقع
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-zinc-400">
          تعذر تحميل الصفحة بشكل صحيح. يمكنك المحاولة مرة أخرى أو
          العودة إلى الصفحة الرئيسية.
        </p>

        {error.digest && (
          <p className="mt-4 text-xs text-zinc-600">
            رقم الخطأ: {error.digest}
          </p>
        )}

        <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-7 py-4 font-bold text-white transition duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-600/30"
          >
            <RotateCcw size={19} />
            حاول مرة أخرى
          </button>

          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-4 font-bold text-white transition duration-300 hover:border-purple-500/50 hover:bg-purple-500/10"
          >
            <Home size={19} />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}
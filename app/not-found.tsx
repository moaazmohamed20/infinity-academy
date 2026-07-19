import {
  BookOpen,
  FileQuestion,
  Home,
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Button from "../components/ui/Button";
import GlassCard from "../components/ui/GlassCard";

export default function NotFoundPage() {
  return (
    <main className="min-h-screen bg-[#09090B] text-white">
      <Navbar />

      <section className="relative flex min-h-[75vh] items-center justify-center overflow-hidden px-6 py-20">
        <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/15 blur-[140px]" />

        <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[140px]" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />

        <GlassCard
          hover={false}
          className="relative w-full max-w-3xl overflow-hidden p-8 text-center shadow-2xl shadow-purple-950/30 md:p-14"
        >
          <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-purple-600/10 blur-[80px]" />

          <div className="relative">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-950/40">
              <FileQuestion size={40} />
            </div>

            <p className="mt-8 bg-gradient-to-l from-purple-400 via-fuchsia-400 to-blue-400 bg-clip-text text-7xl font-black text-transparent md:text-9xl">
              404
            </p>

            <h1 className="mt-5 text-3xl font-black md:text-5xl">
              الصفحة غير موجودة
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-zinc-400 md:text-lg">
              الرابط الذي تحاول الوصول إليه غير صحيح، أو ربما تم
              نقل الصفحة إلى مكان آخر.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                href="/"
                className="px-7 py-4"
              >
                <Home size={19} />
                العودة للرئيسية
              </Button>

              <Button
                href="/courses"
                variant="secondary"
                className="px-7 py-4"
              >
                <BookOpen size={19} />
                استكشف الكورسات
              </Button>
            </div>
          </div>
        </GlassCard>
      </section>

      <Footer />
    </main>
  );
}
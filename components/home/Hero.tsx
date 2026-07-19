"use client";

import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

import Button from "../ui/Button";
import ProgressBar from "../ui/ProgressBar";
import RatingStars from "../ui/RatingStars";
import StatCard from "../ui/StatCard";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#09090B] px-6 pb-20 pt-16 text-white lg:pb-28 lg:pt-24">
      <div className="absolute -right-40 top-0 h-[450px] w-[450px] rounded-full bg-purple-600/20 blur-[140px]" />

      <div className="absolute -left-40 bottom-0 h-[450px] w-[450px] rounded-full bg-blue-600/20 blur-[140px]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:55px_55px]" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-2">
        <div className="text-center lg:text-right">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300 backdrop-blur-xl">
            <Sparkles size={17} />
            مستقبلك يبدأ بخطوة تعلم واحدة
          </div>

          <h1 className="text-4xl font-black leading-[1.2] md:text-6xl lg:text-7xl">
            طوّر مهاراتك

            <span className="mt-2 block bg-gradient-to-l from-purple-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
              واصنع مستقبلك
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg lg:mx-0">
            منصة تعليمية تجمع لك أفضل الكورسات والمسارات الاحترافية في
            البرمجة، الذكاء الاصطناعي، اللغات، التسويق، صناعة المحتوى
            والمزيد.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-zinc-300 lg:justify-start">
            <span className="flex items-center gap-2">
              <CheckCircle2
                size={18}
                className="text-green-400"
              />

              تعلم في أي وقت
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2
                size={18}
                className="text-green-400"
              />

              محتوى عملي
            </span>

            <span className="flex items-center gap-2">
              <CheckCircle2
                size={18}
                className="text-green-400"
              />

              شهادة إتمام
            </span>
          </div>

          <div className="mx-auto mt-9 flex max-w-2xl items-center rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-purple-950/20 backdrop-blur-xl lg:mx-0">
            <Search
              className="mr-3 shrink-0 text-zinc-500"
              size={21}
            />

            <input
              type="text"
              placeholder="ابحث عن الكورس الذي تريد تعلمه..."
              className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-500"
            />

            <Link
              href="/courses"
              className="shrink-0 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-bold transition hover:brightness-110"
            >
              بحث
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
            <Button
              href="/courses"
              className="px-7 py-4"
            >
              استكشف الكورسات
              <ArrowLeft size={19} />
            </Button>

            <Button
              variant="secondary"
              className="px-7 py-4"
            >
              <PlayCircle size={20} />
              شاهد كيف تعمل المنصة
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-3 gap-3 md:gap-4">
            <StatCard
              icon={BookOpen}
              value="1000+"
              label="كورس"
            />

            <StatCard
              icon={Users}
              value="5000+"
              label="طالب"
            />

            <StatCard
              icon={Award}
              value="100+"
              label="مدرب"
            />
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-purple-600/30 to-blue-600/20 blur-3xl" />

          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-4 shadow-2xl backdrop-blur-2xl md:p-5">
            <div className="rounded-[26px] bg-[#111118] p-4 md:p-5">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-500">
                    الكورس الأكثر مشاهدة
                  </p>

                  <h3 className="mt-1 text-lg font-bold md:text-xl">
                    احتراف الذكاء الاصطناعي
                  </h3>
                </div>

                <span className="shrink-0 rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                  الأكثر طلبًا
                </span>
              </div>

              <div className="relative h-64 overflow-hidden rounded-2xl md:h-80">
                <Image
                  src="/images/courses/ai.jpg"
                  alt="كورس احتراف الذكاء الاصطناعي"
                  fill
                  priority
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                <button
                  type="button"
                  aria-label="تشغيل الفيديو"
                  className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-purple-600 shadow-xl transition duration-300 hover:scale-110"
                >
                  <PlayCircle size={32} />
                </button>

                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/50 px-4 py-3 backdrop-blur-xl">
                    <RatingStars rating={4.9} />

                    <span className="text-sm text-zinc-300">
                      12,500 طالب
                    </span>

                    <span className="text-sm text-zinc-300">
                      85 درس
                    </span>
                  </div>
                </div>
              </div>

              <ProgressBar
                value={75}
                label="معدل إكمال الطلاب"
                className="mt-5"
              />

              <Link
                href="/courses/ai"
                className="mt-6 block rounded-xl border border-purple-500/30 bg-purple-500/10 py-3 text-center font-bold text-purple-300 transition duration-300 hover:bg-purple-600 hover:text-white"
              >
                عرض تفاصيل الكورس
              </Link>
            </div>
          </div>

          <div className="absolute -bottom-6 -right-4 hidden rounded-2xl border border-white/10 bg-[#15151d]/90 p-4 shadow-2xl backdrop-blur-xl md:block">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/10">
                <Award
                  className="text-green-400"
                  size={22}
                />
              </div>

              <div>
                <p className="text-sm font-bold">
                  شهادة معتمدة
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  بعد إتمام الكورس
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
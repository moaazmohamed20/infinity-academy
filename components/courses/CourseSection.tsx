"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Flame,
  Layers3,
} from "lucide-react";

import {
  Swiper,
  SwiperSlide,
} from "swiper/react";

import {
  Autoplay,
  Navigation,
  Pagination,
} from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Button from "../ui/Button";
import GlassCard from "../ui/GlassCard";
import SectionTitle from "../ui/SectionTitle";

import CourseCard from "./CourseCard";

import { courses } from "../../data/courses";

const allCategory = "الكل";

export default function CourseSection() {
  const [activeCategory, setActiveCategory] =
    useState(allCategory);

  const categories = useMemo(() => {
    const courseCategories = courses.map(
      (course) => course.category
    );

    return [
      allCategory,
      ...Array.from(new Set(courseCategories)),
    ];
  }, []);

  const filteredCourses = useMemo(() => {
    if (activeCategory === allCategory) {
      return courses;
    }

    return courses.filter(
      (course) =>
        course.category === activeCategory
    );
  }, [activeCategory]);

  return (
    <section className="relative overflow-hidden bg-[#09090B] px-6 py-24 text-white">
      <div className="absolute -right-40 top-10 h-96 w-96 rounded-full bg-purple-600/10 blur-[130px]" />

      <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[130px]" />

      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:60px_60px]" />

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <SectionTitle
            badge="كورسات مختارة لك"
            title="اكتشف أحدث"
            highlightedText="الكورسات"
            description="ابدأ رحلتك التعليمية مع كورسات عملية تساعدك على تطوير مهاراتك والوصول إلى أهدافك."
          />

          <Button
            href="/courses"
            variant="secondary"
            className="hidden px-6 py-4 lg:inline-flex"
          >
            عرض جميع الكورسات
            <ArrowLeft size={19} />
          </Button>
        </div>

        <div className="mt-10 flex gap-3 overflow-x-auto pb-3">
          {categories.map((category) => {
            const isActive =
              activeCategory === category;

            return (
              <button
                key={category}
                type="button"
                onClick={() =>
                  setActiveCategory(category)
                }
                className={`shrink-0 rounded-xl border px-5 py-3 text-sm font-bold transition ${
                  isActive
                    ? "border-purple-500 bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/40"
                    : "border-white/10 bg-white/[0.04] text-zinc-400 hover:border-purple-500/40 hover:bg-purple-500/10 hover:text-purple-300"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        <GlassCard
          hover={false}
          className="mt-8 flex items-center justify-between gap-4 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Layers3 size={20} />
            </div>

            <div>
              <p className="text-sm font-bold">
                {activeCategory === allCategory
                  ? "جميع الكورسات"
                  : activeCategory}
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                {filteredCourses.length} كورس متاح
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 text-sm text-zinc-500 sm:flex">
            <Flame
              size={18}
              className="text-orange-400"
            />

            اسحب لاستكشاف المزيد
          </div>
        </GlassCard>

        <div className="mt-8">
          {filteredCourses.length > 0 ? (
            <Swiper
              key={activeCategory}
              modules={[
                Navigation,
                Pagination,
                Autoplay,
              ]}
              dir="rtl"
              navigation
              pagination={{
                clickable: true,
              }}
              autoplay={{
                delay: 3500,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={filteredCourses.length > 4}
              spaceBetween={24}
              breakpoints={{
                0: {
                  slidesPerView: 1.08,
                  spaceBetween: 16,
                },
                640: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 3,
                  spaceBetween: 24,
                },
                1280: {
                  slidesPerView: 4,
                  spaceBetween: 24,
                },
              }}
              className="course-swiper pb-14"
            >
              {filteredCourses.map((course) => (
                <SwiperSlide key={course.slug}>
                  <CourseCard
                    slug={course.slug}
                    title={course.title}
                    instructor={course.instructor}
                    category={course.category}
                    image={course.image}
                    rating={course.rating}
                    students={course.students}
                    duration={course.duration}
                    lessons={course.lessons}
                  />
                </SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <GlassCard
              hover={false}
              className="px-6 py-16 text-center"
            >
              <Layers3
                size={42}
                className="mx-auto text-purple-400"
              />

              <h3 className="mt-5 text-xl font-bold">
                لا توجد كورسات حاليًا
              </h3>

              <p className="mt-3 text-zinc-500">
                سيتم إضافة كورسات جديدة قريبًا.
              </p>
            </GlassCard>
          )}
        </div>

        <Button
          href="/courses"
          variant="secondary"
          className="mt-3 flex w-full lg:hidden"
        >
          عرض جميع الكورسات
          <ArrowLeft size={19} />
        </Button>
      </div>
    </section>
  );
}
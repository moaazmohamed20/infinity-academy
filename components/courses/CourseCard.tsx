import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Clock3,
  Users,
} from "lucide-react";

import Button from "../ui/Button";
import GlassCard from "../ui/GlassCard";
import RatingStars from "../ui/RatingStars";

type CourseProps = {
  slug: string;
  title: string;
  instructor: string;
  category: string;
  image: string;
  rating: number;
  students: string;
  duration: string;
  lessons: number;
};

export default function CourseCard({
  slug,
  title,
  instructor,
  category,
  image,
  rating,
  students,
  duration,
  lessons,
}: CourseProps) {
  return (
    <GlassCard
      as="article"
      className="group h-full overflow-hidden p-0"
    >
      <Link href={`/courses/${slug}`}>
        <div className="relative h-52 overflow-hidden">
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover transition duration-500 group-hover:scale-110"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          <span className="absolute right-4 top-4 rounded-full bg-purple-600/90 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
            {category}
          </span>
        </div>
      </Link>

      <div className="p-6 text-white">
        <div className="flex items-center justify-between">
          <RatingStars rating={rating} />

          <span className="flex items-center gap-1 text-sm text-zinc-400">
            <Users size={16} />
            {students}
          </span>
        </div>

        <Link href={`/courses/${slug}`}>
          <h3 className="mt-4 min-h-14 text-xl font-bold leading-7 transition hover:text-purple-400">
            {title}
          </h3>
        </Link>

        <p className="mt-2 text-sm text-zinc-400">
          {instructor}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5 text-sm text-zinc-400">
          <span className="flex items-center gap-2">
            <Clock3 size={16} />
            {duration}
          </span>

          <span className="flex items-center gap-2">
            <BookOpen size={16} />
            {lessons} درس
          </span>
        </div>

        <Button
          href={`/courses/${slug}`}
          className="mt-6 w-full"
        >
          عرض الكورس
        </Button>
      </div>
    </GlassCard>
  );
}
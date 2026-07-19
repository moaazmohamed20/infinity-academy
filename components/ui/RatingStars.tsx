import { Star } from "lucide-react";

type RatingStarsProps = {
  rating: number;
  max?: number;
  size?: number;
};

export default function RatingStars({
  rating,
  max = 5,
  size = 17,
}: RatingStarsProps) {
  return (
    <div
      className="flex gap-1"
      aria-label={`التقييم ${rating} من ${max}`}
    >
      {Array.from({ length: max }).map((_, index) => {
        const active = index < rating;

        return (
          <Star
            key={index}
            size={size}
            fill={active ? "currentColor" : "none"}
            className={
              active
                ? "text-yellow-400"
                : "text-zinc-700"
            }
          />
        );
      })}
    </div>
  );
}
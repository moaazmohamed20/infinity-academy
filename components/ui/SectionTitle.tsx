import { LucideIcon, Sparkles } from "lucide-react";

type SectionTitleProps = {
  badge: string;
  title: string;
  highlightedText?: string;
  description: string;
  icon?: LucideIcon;
  align?: "right" | "center";
  className?: string;
};

export default function SectionTitle({
  badge,
  title,
  highlightedText,
  description,
  icon: Icon = Sparkles,
  align = "right",
  className = "",
}: SectionTitleProps) {
  const center = align === "center";

  return (
    <div
      className={[
        "flex max-w-3xl flex-col",
        center
          ? "mx-auto items-center text-center"
          : "items-start text-right",
        className,
      ].join(" ")}
    >
      <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300">
        <Icon size={16} />
        <span>{badge}</span>
      </div>

      <h2 className="mt-5 text-3xl font-black leading-tight text-white md:text-5xl">
        {title}

        {highlightedText && (
          <span className="mr-3 bg-gradient-to-l from-purple-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
            {highlightedText}
          </span>
        )}
      </h2>

      <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400 md:text-lg">
        {description}
      </p>
    </div>
  );
}
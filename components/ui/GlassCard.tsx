import type {
  HTMLAttributes,
  ReactNode,
} from "react";

type GlassCardProps =
  HTMLAttributes<HTMLElement> & {
    children: ReactNode;
    as?: "div" | "article" | "section";
    hover?: boolean;
  };

export default function GlassCard({
  children,
  as: Tag = "div",
  hover = true,
  className = "",
  ...props
}: GlassCardProps) {
  const baseClasses =
    "rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl";

  const hoverClasses = hover
    ? "transition duration-300 hover:-translate-y-2 hover:border-purple-500/40 hover:bg-white/[0.07] hover:shadow-2xl hover:shadow-purple-950/30"
    : "";

  const classes = `
    ${baseClasses}
    ${hoverClasses}
    ${className}
  `;

  return (
    <Tag className={classes} {...props}>
      {children}
    </Tag>
  );
}
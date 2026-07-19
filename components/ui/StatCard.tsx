import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  value: string;
  label: string;
};

export default function StatCard({
  icon: Icon,
  value,
  label,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-purple-500/40">
      <Icon className="mx-auto mb-3 text-purple-400 lg:mx-0" />

      <h3 className="text-xl font-black md:text-2xl">
        {value}
      </h3>

      <p className="mt-1 text-xs text-zinc-500 md:text-sm">
        {label}
      </p>
    </div>
  );
}
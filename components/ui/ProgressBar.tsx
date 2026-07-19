type ProgressBarProps = {
  value: number;
  label?: string;
  className?: string;
};

export default function ProgressBar({
  value,
  label = "اكتمال",
  className = "",
}: ProgressBarProps) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-zinc-500">
          {label}
        </span>

        <span className="font-bold text-purple-400">
          {value}%
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all duration-500"
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
}
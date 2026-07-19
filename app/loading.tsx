import {
  Infinity as InfinityIcon,
} from "lucide-react";

export default function Loading() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#09090B] px-6 text-white">
      <div className="absolute -right-40 top-0 h-96 w-96 rounded-full bg-purple-600/15 blur-[140px]" />

      <div className="absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-blue-600/10 blur-[140px]" />

      <div className="relative text-center">
        <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-3xl bg-purple-600/30" />

          <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-2xl shadow-purple-600/30">
            <InfinityIcon size={40} />
          </div>
        </div>

        <h1 className="mt-7 text-2xl font-black">
          Infinity Academy
        </h1>

        <p className="mt-3 text-sm text-zinc-500">
          جاري تحميل المحتوى...
        </p>

        <div className="mx-auto mt-6 h-1.5 w-48 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-purple-600 to-indigo-600" />
        </div>
      </div>
    </main>
  );
}
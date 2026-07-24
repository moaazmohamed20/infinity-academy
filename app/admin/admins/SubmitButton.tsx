"use client";

import { useFormStatus } from "react-dom";
import {
  LoaderCircle,
  UserMinus,
  UserPlus,
} from "lucide-react";

type SubmitButtonProps = {
  actionType: "promote" | "demote";
};

export default function SubmitButton({
  actionType,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  const isPromote =
    actionType === "promote";

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={
        isPromote
          ? "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-3 font-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          : "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 font-bold text-red-300 transition hover:border-red-500/50 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
      }
    >
      {pending ? (
        <LoaderCircle
          size={18}
          className="animate-spin"
        />
      ) : isPromote ? (
        <UserPlus size={18} />
      ) : (
        <UserMinus size={18} />
      )}

      {pending
        ? "جارٍ التنفيذ..."
        : isPromote
          ? "منحه صلاحية الأدمن"
          : "إلغاء صلاحية الأدمن"}
    </button>
  );
}
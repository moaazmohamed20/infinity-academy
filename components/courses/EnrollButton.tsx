"use client";

import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  BookOpen,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

type EnrollButtonProps = {
  courseId: string;
  slug: string;
  className?: string;
};

export default function EnrollButton({
  courseId,
  slug,
  className = "",
}: EnrollButtonProps) {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [userId, setUserId] = useState("");
  const [isChecking, setIsChecking] =
    useState(true);
  const [isEnrolled, setIsEnrolled] =
    useState(false);
  const [isEnrolling, setIsEnrolling] =
    useState(false);
  const [errorMessage, setErrorMessage] =
    useState("");

  useEffect(() => {
    let isMounted = true;

    const checkEnrollment = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (!user) {
        setIsChecking(false);
        return;
      }

      setUserId(user.id);

      const { data, error } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error(
          "تعذر التحقق من الاشتراك:",
          error
        );
      }

      setIsEnrolled(Boolean(data));
      setIsChecking(false);
    };

    void checkEnrollment();

    return () => {
      isMounted = false;
    };
  }, [courseId, supabase]);

  const handleEnrollment = async () => {
    setErrorMessage("");

    if (!userId) {
      router.push("/login");
      return;
    }

    if (isEnrolled) {
      router.push(`/learn/${slug}`);
      return;
    }

    setIsEnrolling(true);

    try {
      const { error } = await supabase
        .from("enrollments")
        .insert({
          user_id: userId,
          course_id: courseId,
        });

      if (error && error.code !== "23505") {
        setErrorMessage(
          "تعذر بدء الكورس حاليًا. حاول مرة أخرى."
        );

        return;
      }

      setIsEnrolled(true);

      router.push(`/learn/${slug}`);
      router.refresh();
    } catch {
      setErrorMessage(
        "حدث خطأ غير متوقع. حاول مرة أخرى."
      );
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleEnrollment}
        disabled={isChecking || isEnrolling}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 font-black text-white shadow-lg shadow-purple-950/30 transition hover:scale-[1.02] hover:shadow-purple-600/30 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
      >
        {isChecking || isEnrolling ? (
          <>
            <LoaderCircle
              size={19}
              className="animate-spin"
            />

            {isChecking
              ? "جارٍ التحقق..."
              : "جارٍ بدء الكورس..."}
          </>
        ) : isEnrolled ? (
          <>
            <CheckCircle2 size={19} />
            متابعة الكورس
          </>
        ) : (
          <>
            <BookOpen size={19} />
            ابدأ الكورس الآن
          </>
        )}
      </button>

      {errorMessage && (
        <p
          role="alert"
          className="mt-3 text-center text-sm font-semibold text-red-400"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
}
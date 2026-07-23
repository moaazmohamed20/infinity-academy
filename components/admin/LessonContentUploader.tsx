"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  FileArchive,
  FileText,
  LoaderCircle,
  PlayCircle,
  ShieldCheck,
  Trash2,
  Upload,
  Video,
} from "lucide-react";

import { createClient } from "../../lib/supabase/client";

type ContentKind =
  | "video"
  | "summary"
  | "resources";

type ContentState = {
  video: string | null;
  summary: string | null;
  resources: string | null;
};

type SignedContentState = {
  videoUrl: string | null;
  summaryUrl: string | null;
  resourcesUrl: string | null;
};

type LessonContentUploaderProps = {
  lessonId: string;
  courseId: string;
  initialContent: ContentState;
};

type ContentConfig = {
  title: string;
  description: string;
  accept: string;
  icon: typeof Video;
};

const BUCKET_NAME = "course-content";
const MAX_FILE_SIZE_BYTES =
  50 * 1024 * 1024;

const contentConfig: Record<
  ContentKind,
  ContentConfig
> = {
  video: {
    title: "فيديو الدرس",
    description:
      "MP4 أو WebM أو MOV بحد أقصى 50 ميجابايت.",
    accept:
      "video/mp4,video/webm,video/quicktime",
    icon: Video,
  },
  summary: {
    title: "ملخص الدرس",
    description:
      "ملف PDF بحد أقصى 50 ميجابايت.",
    accept: "application/pdf,.pdf",
    icon: FileText,
  },
  resources: {
    title: "ملفات التطبيق",
    description:
      "ملف ZIP بحد أقصى 50 ميجابايت.",
    accept:
      "application/zip,application/x-zip-compressed,.zip",
    icon: FileArchive,
  },
};

function getErrorMessage(
  error: unknown,
  fallback: string
) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return fallback;
}

export default function LessonContentUploader({
  lessonId,
  courseId,
  initialContent,
}: LessonContentUploaderProps) {
  const router = useRouter();

  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [content, setContent] =
    useState<ContentState>(
      initialContent
    );

  const [signedContent, setSignedContent] =
    useState<SignedContentState>({
      videoUrl: null,
      summaryUrl: null,
      resourcesUrl: null,
    });

  const [busyKind, setBusyKind] =
    useState<ContentKind | null>(null);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadSignedContent =
    useCallback(async () => {
      try {
        const response = await fetch(
          `/api/admin/lessons/${lessonId}/content`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as {
            content?: ContentState;
            signed?: SignedContentState;
            error?: string;
          };

        if (!response.ok) {
          throw new Error(
            data.error ||
              "تعذر تحميل محتوى الدرس."
          );
        }

        if (data.content) {
          setContent(data.content);
        }

        if (data.signed) {
          setSignedContent(data.signed);
        }
      } catch (error) {
        setErrorMessage(
          getErrorMessage(
            error,
            "تعذر تحميل محتوى الدرس."
          )
        );
      }
    }, [lessonId]);

  useEffect(() => {
    void loadSignedContent();
  }, [loadSignedContent]);

  const uploadFile = async (
    kind: ContentKind,
    file: File
  ) => {
    setBusyKind(kind);
    setMessage("");
    setErrorMessage("");

    try {
      if (file.size <= 0) {
        throw new Error(
          "الملف المختار فارغ."
        );
      }

      if (
        file.size >
        MAX_FILE_SIZE_BYTES
      ) {
        throw new Error(
          "حجم الملف أكبر من 50 ميجابايت."
        );
      }

      const createResponse =
        await fetch(
          `/api/admin/lessons/${lessonId}/content`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              kind,
              fileName: file.name,
              contentType:
                file.type ||
                "application/octet-stream",
              fileSize: file.size,
            }),
          }
        );

      const createData =
        (await createResponse.json()) as {
          path?: string;
          token?: string;
          error?: string;
        };

      if (
        !createResponse.ok ||
        !createData.path ||
        !createData.token
      ) {
        throw new Error(
          createData.error ||
            "تعذر تجهيز رفع الملف."
        );
      }

      const {
        error: uploadError,
      } = await supabase.storage
        .from(BUCKET_NAME)
        .uploadToSignedUrl(
          createData.path,
          createData.token,
          file,
          {
            contentType:
              file.type ||
              "application/octet-stream",
            upsert: false,
          }
        );

      if (uploadError) {
        throw uploadError;
      }

      const finalizeResponse =
        await fetch(
          `/api/admin/lessons/${lessonId}/content`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              kind,
              path: createData.path,
              courseId,
            }),
          }
        );

      const finalizeData =
        (await finalizeResponse.json()) as {
          error?: string;
        };

      if (!finalizeResponse.ok) {
        throw new Error(
          finalizeData.error ||
            "تم رفع الملف لكن تعذر ربطه بالدرس."
        );
      }

      await loadSignedContent();

      setMessage(
        "تم رفع الملف وحفظه داخل التخزين الخاص بنجاح."
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "تعذر رفع الملف."
        )
      );
    } finally {
      setBusyKind(null);
    }
  };

  const handleFileChange = async (
    kind: ContentKind,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const input = event.currentTarget;
    const file =
      input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    await uploadFile(kind, file);
    input.value = "";
  };

  const removeContent = async (
    kind: ContentKind
  ) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا الملف من الدرس؟"
    );

    if (!confirmed) {
      return;
    }

    setBusyKind(kind);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch(
        `/api/admin/lessons/${lessonId}/content`,
        {
          method: "DELETE",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            kind,
          }),
        }
      );

      const data =
        (await response.json()) as {
          error?: string;
        };

      if (!response.ok) {
        throw new Error(
          data.error ||
            "تعذر حذف الملف."
        );
      }

      await loadSignedContent();

      setMessage(
        "تم حذف الملف من الدرس."
      );

      router.refresh();
    } catch (error) {
      setErrorMessage(
        getErrorMessage(
          error,
          "تعذر حذف الملف."
        )
      );
    } finally {
      setBusyKind(null);
    }
  };

  const previewUrlByKind: Record<
    ContentKind,
    string | null
  > = {
    video: signedContent.videoUrl,
    summary: signedContent.summaryUrl,
    resources:
      signedContent.resourcesUrl,
  };

  return (
    <section className="mt-10 border-t border-white/10 pt-9">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
          <ShieldCheck size={24} />
        </div>

        <div>
          <p className="text-sm font-bold text-emerald-400">
            تخزين خاص وآمن
          </p>

          <h3 className="mt-2 text-2xl font-black">
            فيديو وملفات الدرس
          </h3>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
            يتم رفع الملفات مباشرة إلى
            Bucket خاص. الطالب يحصل على رابط
            مؤقت بعد التحقق من صلاحية الوصول.
          </p>
        </div>
      </div>

      {message && (
        <div
          role="status"
          className="mt-6 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-300"
        >
          <CheckCircle2 size={19} />
          {message}
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-bold leading-7 text-red-300"
        >
          {errorMessage}
        </div>
      )}

      <div className="mt-7 grid gap-5">
        {(
          Object.keys(
            contentConfig
          ) as ContentKind[]
        ).map((kind) => {
          const config =
            contentConfig[kind];

          const Icon = config.icon;

          const hasFile =
            Boolean(content[kind]);

          const isBusy =
            busyKind === kind;

          const previewUrl =
            previewUrlByKind[kind];

          return (
            <div
              key={kind}
              className="rounded-2xl border border-white/10 bg-black/20 p-5"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                    <Icon size={21} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h4 className="font-black">
                        {config.title}
                      </h4>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          hasFile
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-white/5 text-zinc-500"
                        }`}
                      >
                        {hasFile
                          ? "تمت إضافته"
                          : "غير مضاف"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-zinc-500">
                      {config.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {hasFile &&
                    previewUrl && (
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold transition hover:border-purple-500/50 hover:bg-purple-500/10"
                      >
                        {kind ===
                        "video" ? (
                          <PlayCircle
                            size={18}
                          />
                        ) : (
                          <FileText
                            size={18}
                          />
                        )}
                        معاينة
                      </a>
                    )}

                  <label
                    className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-sm font-black text-white transition hover:brightness-110 ${
                      isBusy
                        ? "pointer-events-none opacity-60"
                        : ""
                    }`}
                  >
                    {isBusy ? (
                      <LoaderCircle
                        size={18}
                        className="animate-spin"
                      />
                    ) : (
                      <Upload size={18} />
                    )}

                    {hasFile
                      ? "استبدال الملف"
                      : "رفع الملف"}

                    <input
                      type="file"
                      accept={
                        config.accept
                      }
                      disabled={isBusy}
                      onChange={(event) =>
                        void handleFileChange(
                          kind,
                          event
                        )
                      }
                      className="hidden"
                    />
                  </label>

                  {hasFile && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        void removeContent(
                          kind
                        )
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                      حذف
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-xs leading-6 text-zinc-600">
        ملاحظة: الحد الحالي في مشروع Supabase
        المجاني هو 50 ميجابايت تقريبًا لكل ملف.
      </p>
    </section>
  );
}

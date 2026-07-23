import {
  NextRequest,
  NextResponse,
} from "next/server";

import { createClient } from "../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET_NAME = "course-content";

const SIGNED_URL_EXPIRES_IN_SECONDS =
  60 * 60 * 2;

type LessonContentRecord = {
  id: string;
  course_id: string;
  is_preview: boolean;
  is_published: boolean;
  video_url: string | null;
  summary_file_url: string | null;
  resources_file_url: string | null;
};

function getStoredPath(
  value: string | null
) {
  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return null;
  }

  const normalizedValue =
    value.replace(/^\/+/, "");

  if (
    normalizedValue.startsWith(
      `${BUCKET_NAME}/`
    )
  ) {
    return normalizedValue.slice(
      BUCKET_NAME.length + 1
    );
  }

  return normalizedValue;
}

async function createSignedReadUrl(
  value: string | null
) {
  if (!value) {
    return null;
  }

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  const storedPath =
    getStoredPath(value);

  if (!storedPath) {
    return null;
  }

  const adminSupabase =
    createAdminClient();

  const {
    data,
    error,
  } = await adminSupabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(
      storedPath,
      SIGNED_URL_EXPIRES_IN_SECONDS
    );

  if (
    error ||
    !data?.signedUrl
  ) {
    return null;
  }

  return data.signedUrl;
}

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const supabase =
    await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  if (
    claimsError ||
    !claimsData?.claims
  ) {
    return NextResponse.json(
      {
        error:
          "يجب تسجيل الدخول أولًا.",
      },
      {
        status: 401,
      }
    );
  }

  const claims =
    claimsData.claims as Record<
      string,
      unknown
    >;

  const userId =
    typeof claims.sub === "string"
      ? claims.sub
      : "";

  if (!userId) {
    return NextResponse.json(
      {
        error:
          "تعذر التعرف على المستخدم.",
      },
      {
        status: 401,
      }
    );
  }

  const { id } =
    await context.params;

  const adminSupabase =
    createAdminClient();

  const {
    data: lessonData,
    error: lessonError,
  } = await adminSupabase
    .from("lessons")
    .select(
      `
        id,
        course_id,
        is_preview,
        is_published,
        video_url,
        summary_file_url,
        resources_file_url
      `
    )
    .eq("id", id)
    .maybeSingle();

  if (
    lessonError ||
    !lessonData
  ) {
    return NextResponse.json(
      {
        error:
          "لم يتم العثور على الدرس.",
      },
      {
        status: 404,
      }
    );
  }

  const lesson: LessonContentRecord = {
    id: String(lessonData.id),
    course_id: String(
      lessonData.course_id
    ),
    is_preview: Boolean(
      lessonData.is_preview
    ),
    is_published: Boolean(
      lessonData.is_published
    ),
    video_url:
      lessonData.video_url === null
        ? null
        : String(
            lessonData.video_url
          ),
    summary_file_url:
      lessonData.summary_file_url ===
      null
        ? null
        : String(
            lessonData.summary_file_url
          ),
    resources_file_url:
      lessonData.resources_file_url ===
      null
        ? null
        : String(
            lessonData.resources_file_url
          ),
  };

  if (!lesson.is_published) {
    return NextResponse.json(
      {
        error:
          "الدرس غير منشور.",
      },
      {
        status: 404,
      }
    );
  }

  if (!lesson.is_preview) {
    const {
      data: hasAccessData,
      error: hasAccessError,
    } = await supabase.rpc(
      "has_course_access",
      {
        p_course_id:
          lesson.course_id,
      }
    );

    if (
      hasAccessError ||
      hasAccessData !== true
    ) {
      return NextResponse.json(
        {
          error:
            "ليس لديك صلاحية الوصول إلى محتوى هذا الدرس.",
        },
        {
          status: 403,
        }
      );
    }
  }

  const [
    videoUrl,
    summaryUrl,
    resourcesUrl,
  ] = await Promise.all([
    createSignedReadUrl(
      lesson.video_url
    ),
    createSignedReadUrl(
      lesson.summary_file_url
    ),
    createSignedReadUrl(
      lesson.resources_file_url
    ),
  ]);

  return NextResponse.json(
    {
      videoUrl,
      summaryUrl,
      resourcesUrl,
      expiresInSeconds:
        SIGNED_URL_EXPIRES_IN_SECONDS,
    },
    {
      headers: {
        "Cache-Control":
          "private, no-store",
      },
    }
  );
}

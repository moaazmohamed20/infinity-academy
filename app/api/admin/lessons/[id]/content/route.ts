import { randomUUID } from "node:crypto";
import path from "node:path";

import {
  NextRequest,
  NextResponse,
} from "next/server";
import { revalidatePath } from "next/cache";

import { createClient } from "../../../../../../lib/supabase/server";
import { createAdminClient } from "../../../../../../lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET_NAME = "course-content";

const MAX_FILE_SIZE_BYTES =
  50 * 1024 * 1024;

const SIGNED_URL_EXPIRES_IN_SECONDS =
  60 * 60;

type ContentKind =
  | "video"
  | "summary"
  | "resources";

type LessonContentRecord = {
  id: string;
  course_id: string;
  video_url: string | null;
  summary_file_url: string | null;
  resources_file_url: string | null;
};

const contentColumns: Record<
  ContentKind,
  | "video_url"
  | "summary_file_url"
  | "resources_file_url"
> = {
  video: "video_url",
  summary: "summary_file_url",
  resources: "resources_file_url",
};

function isContentKind(
  value: unknown
): value is ContentKind {
  return (
    value === "video" ||
    value === "summary" ||
    value === "resources"
  );
}

function sanitizeExtension(
  fileName: string
) {
  const extension =
    path.extname(fileName).toLowerCase();

  if (
    !extension ||
    extension.length > 10 ||
    !/^\.[a-z0-9]+$/.test(extension)
  ) {
    return "";
  }

  return extension;
}

function validateMimeType(
  kind: ContentKind,
  contentType: string
) {
  const normalizedType =
    contentType.toLowerCase();

  if (kind === "video") {
    return (
      normalizedType === "video/mp4" ||
      normalizedType === "video/webm" ||
      normalizedType ===
        "video/quicktime"
    );
  }

  if (kind === "summary") {
    return (
      normalizedType ===
      "application/pdf"
    );
  }

  return (
    normalizedType ===
      "application/zip" ||
    normalizedType ===
      "application/x-zip-compressed" ||
    normalizedType ===
      "application/octet-stream"
  );
}

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

async function authorizeAdmin() {
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
    return {
      error: NextResponse.json(
        {
          error:
            "يجب تسجيل الدخول أولًا.",
        },
        {
          status: 401,
        }
      ),
    };
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
    return {
      error: NextResponse.json(
        {
          error:
            "تعذر التعرف على المستخدم.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {
    return {
      error: NextResponse.json(
        {
          error:
            "ليس لديك صلاحية إدارة محتوى الدروس.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return {
    error: null,
  };
}

async function loadLesson(
  lessonId: string
) {
  const adminSupabase =
    createAdminClient();

  const {
    data,
    error,
  } = await adminSupabase
    .from("lessons")
    .select(
      `
        id,
        course_id,
        video_url,
        summary_file_url,
        resources_file_url
      `
    )
    .eq("id", lessonId)
    .maybeSingle();

  if (error || !data) {
    return {
      lesson: null,
      adminSupabase,
    };
  }

  return {
    lesson: {
      id: String(data.id),
      course_id: String(
        data.course_id
      ),
      video_url:
        data.video_url === null
          ? null
          : String(data.video_url),
      summary_file_url:
        data.summary_file_url ===
        null
          ? null
          : String(
              data.summary_file_url
            ),
      resources_file_url:
        data.resources_file_url ===
        null
          ? null
          : String(
              data.resources_file_url
            ),
    } satisfies LessonContentRecord,
    adminSupabase,
  };
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

  if (error || !data?.signedUrl) {
    return null;
  }

  return data.signedUrl;
}

function revalidateLessonPaths(
  lessonId: string
) {
  revalidatePath("/admin/lessons");
  revalidatePath(
    `/admin/lessons/${lessonId}`
  );
  revalidatePath("/dashboard");
}

export async function GET(
  _request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const authorization =
    await authorizeAdmin();

  if (authorization.error) {
    return authorization.error;
  }

  const { id } =
    await context.params;

  const {
    lesson,
  } = await loadLesson(id);

  if (!lesson) {
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
      content: {
        video: lesson.video_url,
        summary:
          lesson.summary_file_url,
        resources:
          lesson.resources_file_url,
      },
      signed: {
        videoUrl,
        summaryUrl,
        resourcesUrl,
      },
    },
    {
      headers: {
        "Cache-Control":
          "private, no-store",
      },
    }
  );
}

export async function POST(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const authorization =
    await authorizeAdmin();

  if (authorization.error) {
    return authorization.error;
  }

  const { id } =
    await context.params;

  const {
    lesson,
    adminSupabase,
  } = await loadLesson(id);

  if (!lesson) {
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

  let body: {
    kind?: unknown;
    fileName?: unknown;
    contentType?: unknown;
    fileSize?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "بيانات الملف غير صحيحة.",
      },
      {
        status: 400,
      }
    );
  }

  if (!isContentKind(body.kind)) {
    return NextResponse.json(
      {
        error:
          "نوع محتوى الدرس غير صحيح.",
      },
      {
        status: 400,
      }
    );
  }

  const fileName =
    typeof body.fileName ===
    "string"
      ? body.fileName.trim()
      : "";

  const contentType =
    typeof body.contentType ===
    "string"
      ? body.contentType.trim()
      : "";

  const fileSize =
    Number(body.fileSize);

  if (!fileName) {
    return NextResponse.json(
      {
        error:
          "اسم الملف غير موجود.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !Number.isFinite(fileSize) ||
    fileSize <= 0 ||
    fileSize >
      MAX_FILE_SIZE_BYTES
  ) {
    return NextResponse.json(
      {
        error:
          "حجم الملف يجب ألا يتجاوز 50 ميجابايت.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !validateMimeType(
      body.kind,
      contentType
    )
  ) {
    return NextResponse.json(
      {
        error:
          "نوع الملف غير مسموح لهذا الحقل.",
      },
      {
        status: 400,
      }
    );
  }

  const extension =
    sanitizeExtension(fileName);

  const objectPath =
    `${lesson.course_id}/` +
    `${lesson.id}/` +
    `${body.kind}/` +
    `${randomUUID()}${extension}`;

  const {
    data: uploadData,
    error: uploadError,
  } = await adminSupabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(
      objectPath,
      {
        upsert: false,
      }
    );

  if (
    uploadError ||
    !uploadData?.token
  ) {
    console.error(
      "Create signed upload URL error:",
      uploadError
    );

    return NextResponse.json(
      {
        error:
          "تعذر تجهيز رابط رفع الملف.",
      },
      {
        status: 500,
      }
    );
  }

  return NextResponse.json({
    path: objectPath,
    token: uploadData.token,
  });
}

export async function PATCH(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const authorization =
    await authorizeAdmin();

  if (authorization.error) {
    return authorization.error;
  }

  const { id } =
    await context.params;

  const {
    lesson,
    adminSupabase,
  } = await loadLesson(id);

  if (!lesson) {
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

  let body: {
    kind?: unknown;
    path?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "بيانات الملف غير صحيحة.",
      },
      {
        status: 400,
      }
    );
  }

  if (!isContentKind(body.kind)) {
    return NextResponse.json(
      {
        error:
          "نوع المحتوى غير صحيح.",
      },
      {
        status: 400,
      }
    );
  }

  const objectPath =
    typeof body.path === "string"
      ? body.path.trim()
      : "";

  const expectedPrefix =
    `${lesson.course_id}/` +
    `${lesson.id}/` +
    `${body.kind}/`;

  if (
    !objectPath ||
    !objectPath.startsWith(
      expectedPrefix
    )
  ) {
    return NextResponse.json(
      {
        error:
          "مسار الملف غير صالح.",
      },
      {
        status: 400,
      }
    );
  }

  const {
    data: objectList,
    error: objectListError,
  } = await adminSupabase.storage
    .from(BUCKET_NAME)
    .list(
      path.posix.dirname(
        objectPath
      ),
      {
        search:
          path.posix.basename(
            objectPath
          ),
        limit: 1,
      }
    );

  if (
    objectListError ||
    !objectList?.some(
      (item) =>
        item.name ===
        path.posix.basename(
          objectPath
        )
    )
  ) {
    return NextResponse.json(
      {
        error:
          "لم يتم العثور على الملف المرفوع.",
      },
      {
        status: 400,
      }
    );
  }

  const column =
    contentColumns[body.kind];

  const previousValue =
    lesson[column];

  const {
    error: updateError,
  } = await adminSupabase
    .from("lessons")
    .update({
      [column]: objectPath,
    })
    .eq("id", lesson.id);

  if (updateError) {
    console.error(
      "Finalize lesson content error:",
      updateError
    );

    return NextResponse.json(
      {
        error:
          "تعذر ربط الملف بالدرس.",
      },
      {
        status: 500,
      }
    );
  }

  const previousPath =
    getStoredPath(previousValue);

  if (
    previousPath &&
    previousPath !== objectPath
  ) {
    await adminSupabase.storage
      .from(BUCKET_NAME)
      .remove([previousPath]);
  }

  revalidateLessonPaths(
    lesson.id
  );

  return NextResponse.json({
    success: true,
  });
}

export async function DELETE(
  request: NextRequest,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  const authorization =
    await authorizeAdmin();

  if (authorization.error) {
    return authorization.error;
  }

  const { id } =
    await context.params;

  const {
    lesson,
    adminSupabase,
  } = await loadLesson(id);

  if (!lesson) {
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

  let body: {
    kind?: unknown;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "بيانات الحذف غير صحيحة.",
      },
      {
        status: 400,
      }
    );
  }

  if (!isContentKind(body.kind)) {
    return NextResponse.json(
      {
        error:
          "نوع المحتوى غير صحيح.",
      },
      {
        status: 400,
      }
    );
  }

  const column =
    contentColumns[body.kind];

  const currentValue =
    lesson[column];

  const {
    error: updateError,
  } = await adminSupabase
    .from("lessons")
    .update({
      [column]: null,
    })
    .eq("id", lesson.id);

  if (updateError) {
    return NextResponse.json(
      {
        error:
          "تعذر حذف الملف من بيانات الدرس.",
      },
      {
        status: 500,
      }
    );
  }

  const storedPath =
    getStoredPath(currentValue);

  if (storedPath) {
    await adminSupabase.storage
      .from(BUCKET_NAME)
      .remove([storedPath]);
  }

  revalidateLessonPaths(
    lesson.id
  );

  return NextResponse.json({
    success: true,
  });
}

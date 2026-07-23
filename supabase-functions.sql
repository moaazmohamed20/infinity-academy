-- =========================================================
-- Infinity Academy - Database Functions
-- =========================================================


-- =========================================================
-- 1. Check whether the current user is an admin
-- =========================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (SELECT auth.uid())
      AND role = 'admin'
  );
$function$;


-- =========================================================
-- 2. Create a course enrollment from the admin dashboard
-- =========================================================

CREATE OR REPLACE FUNCTION public.admin_create_enrollment(
  p_user_id uuid,
  p_course_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_enrollment_id uuid;
BEGIN
  IF NOT COALESCE(
    (SELECT public.is_admin()),
    false
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بإضافة اشتراكات';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = p_user_id
  ) THEN
    RAISE EXCEPTION 'حساب المستخدم غير موجود';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.courses
    WHERE id = p_course_id
  ) THEN
    RAISE EXCEPTION 'الكورس غير موجود';
  END IF;

  SELECT id
  INTO v_enrollment_id
  FROM public.enrollments
  WHERE user_id = p_user_id
    AND course_id = p_course_id
  LIMIT 1;

  IF v_enrollment_id IS NOT NULL THEN
    RETURN v_enrollment_id;
  END IF;

  INSERT INTO public.enrollments (
    user_id,
    course_id,
    progress,
    status,
    enrolled_at,
    updated_at,
    completed_at
  )
  VALUES (
    p_user_id,
    p_course_id,
    0,
    'active',
    now(),
    now(),
    null
  )
  RETURNING id INTO v_enrollment_id;

  RETURN v_enrollment_id;
END;
$function$;


-- =========================================================
-- 3. Update a course enrollment from the admin dashboard
-- =========================================================

CREATE OR REPLACE FUNCTION public.admin_update_enrollment(
  p_enrollment_id uuid,
  p_progress integer,
  p_status text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  v_progress integer;
  v_status text;
BEGIN
  IF NOT COALESCE(
    (SELECT public.is_admin()),
    false
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بتعديل الاشتراكات';
  END IF;

  IF p_progress IS NULL THEN
    RAISE EXCEPTION 'نسبة التقدم مطلوبة';
  END IF;

  IF p_status NOT IN (
    'active',
    'completed'
  ) THEN
    RAISE EXCEPTION 'حالة الاشتراك غير صحيحة';
  END IF;

  v_progress := GREATEST(
    0,
    LEAST(100, p_progress)
  );

  v_status :=
    CASE
      WHEN p_status = 'completed'
        OR v_progress = 100
      THEN 'completed'
      ELSE 'active'
    END;

  IF v_status = 'completed' THEN
    v_progress := 100;
  END IF;

  UPDATE public.enrollments
  SET
    progress = v_progress,
    status = v_status,

    completed_at =
      CASE
        WHEN v_status = 'completed'
        THEN COALESCE(
          completed_at,
          now()
        )
        ELSE null
      END,

    updated_at = now()

  WHERE id = p_enrollment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الاشتراك غير موجود';
  END IF;

  RETURN true;
END;
$function$;


-- =========================================================
-- 4. Delete a course enrollment from the admin dashboard
-- =========================================================

CREATE OR REPLACE FUNCTION public.admin_delete_enrollment(
  p_enrollment_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NOT COALESCE(
    (SELECT public.is_admin()),
    false
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بحذف الاشتراكات';
  END IF;

  DELETE FROM public.enrollments
  WHERE id = p_enrollment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'الاشتراك غير موجود';
  END IF;

  RETURN true;
END;
$function$;


-- =========================================================
-- 5. Return students and their enrollment statistics
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_admin_students()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  role text,
  joined_at timestamp with time zone,
  enrollments_count bigint,
  active_enrollments bigint,
  completed_enrollments bigint,
  average_progress integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NOT COALESCE(
    (SELECT public.is_admin()),
    false
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض بيانات الطلاب';
  END IF;

  RETURN QUERY
  SELECT
    users.id AS user_id,

    COALESCE(
      profiles.full_name,

      NULLIF(
        split_part(
          COALESCE(users.email, ''),
          '@',
          1
        ),
        ''
      ),

      'طالب'
    )::text AS full_name,

    COALESCE(
      users.email,
      ''
    )::text AS email,

    COALESCE(
      profiles.role::text,
      'student'
    )::text AS role,

    users.created_at AS joined_at,

    COUNT(
      enrollments.id
    )::bigint AS enrollments_count,

    COUNT(
      enrollments.id
    ) FILTER (
      WHERE enrollments.status = 'active'
    )::bigint AS active_enrollments,

    COUNT(
      enrollments.id
    ) FILTER (
      WHERE enrollments.status = 'completed'
    )::bigint AS completed_enrollments,

    COALESCE(
      ROUND(
        AVG(enrollments.progress)
      )::integer,
      0
    ) AS average_progress

  FROM auth.users AS users

  LEFT JOIN public.profiles AS profiles
    ON profiles.id = users.id

  LEFT JOIN public.enrollments AS enrollments
    ON enrollments.user_id = users.id

  GROUP BY
    users.id,
    users.email,
    users.created_at,
    profiles.full_name,
    profiles.role

  ORDER BY users.created_at DESC;
END;
$function$;


-- =========================================================
-- 6. Return course enrollments for the admin dashboard
-- =========================================================

CREATE OR REPLACE FUNCTION public.get_admin_enrollments()
RETURNS TABLE (
  enrollment_id uuid,
  user_id uuid,
  course_id uuid,
  course_title text,
  course_slug text,
  status text,
  progress integer,
  enrolled_at timestamp with time zone,
  completed_at timestamp with time zone
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF NOT COALESCE(
    (SELECT public.is_admin()),
    false
  ) THEN
    RAISE EXCEPTION 'غير مصرح لك بعرض الاشتراكات';
  END IF;

  RETURN QUERY
  SELECT
    enrollments.id AS enrollment_id,
    enrollments.user_id,
    enrollments.course_id,

    courses.title::text AS course_title,
    courses.slug::text AS course_slug,

    enrollments.status::text,
    enrollments.progress::integer,
    enrollments.enrolled_at,
    enrollments.completed_at

  FROM public.enrollments AS enrollments

  JOIN public.courses AS courses
    ON courses.id = enrollments.course_id

  ORDER BY enrollments.enrolled_at DESC;
END;
$function$;


-- =========================================================
-- 7. Public certificate verification
-- =========================================================

CREATE OR REPLACE FUNCTION public.verify_certificate(
  search_code text
)
RETURNS TABLE (
  certificate_number text,
  verification_code text,
  student_name text,
  course_title text,
  instructor_name text,
  course_category text,
  completion_date timestamp with time zone,
  course_duration text,
  lessons_count integer,
  course_slug text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO ''
AS $function$
  SELECT
    'IA-' ||
      UPPER(
        LEFT(
          REPLACE(
            e.id::text,
            '-',
            ''
          ),
          12
        )
      ) AS certificate_number,

    UPPER(
      RIGHT(
        REPLACE(
          e.id::text,
          '-',
          ''
        ),
        8
      )
      ||
      '-'
      ||
      LEFT(
        REPLACE(
          e.user_id::text,
          '-',
          ''
        ),
        8
      )
    ) AS verification_code,

    COALESCE(
      NULLIF(
        TRIM(p.full_name),
        ''
      ),
      'طالب Infinity Academy'
    ) AS student_name,

    c.title AS course_title,
    c.instructor AS instructor_name,
    c.category AS course_category,

    COALESCE(
      e.completed_at,
      e.enrolled_at
    ) AS completion_date,

    c.duration AS course_duration,
    c.lessons_count,
    c.slug AS course_slug

  FROM public.enrollments AS e

  INNER JOIN public.courses AS c
    ON c.id = e.course_id

  LEFT JOIN public.profiles AS p
    ON p.id = e.user_id

  WHERE
    e.status = 'completed'

    AND UPPER(
      TRIM(search_code)
    ) IN (
      'IA-' ||
        UPPER(
          LEFT(
            REPLACE(
              e.id::text,
              '-',
              ''
            ),
            12
          )
        ),

      UPPER(
        RIGHT(
          REPLACE(
            e.id::text,
            '-',
            ''
          ),
          8
        )
        ||
        '-'
        ||
        LEFT(
          REPLACE(
            e.user_id::text,
            '-',
            ''
          ),
          8
        )
      )
    )

  ORDER BY
    COALESCE(
      e.completed_at,
      e.enrolled_at
    ) DESC

  LIMIT 1;
$function$;


-- =========================================================
-- Function permissions
-- =========================================================

REVOKE ALL
ON FUNCTION public.is_admin()
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.admin_create_enrollment(uuid, uuid)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.admin_update_enrollment(uuid, integer, text)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.admin_delete_enrollment(uuid)
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.get_admin_students()
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.get_admin_enrollments()
FROM PUBLIC;

REVOKE ALL
ON FUNCTION public.verify_certificate(text)
FROM PUBLIC;


GRANT EXECUTE
ON FUNCTION public.is_admin()
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.admin_create_enrollment(uuid, uuid)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.admin_update_enrollment(uuid, integer, text)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.admin_delete_enrollment(uuid)
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.get_admin_students()
TO authenticated;

GRANT EXECUTE
ON FUNCTION public.get_admin_enrollments()
TO authenticated;


GRANT EXECUTE
ON FUNCTION public.verify_certificate(text)
TO anon, authenticated;
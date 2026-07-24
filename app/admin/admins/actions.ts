"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getCurrentAdminId() {
  const supabase = await createClient();

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const claims = claimsData?.claims as
    | Record<string, unknown>
    | undefined;

  const currentUserId =
    typeof claims?.sub === "string"
      ? claims.sub
      : "";

  if (claimsError || !currentUserId) {
    redirect("/login");
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", currentUserId)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin"
  ) {
    redirect("/");
  }

  return currentUserId;
}

function getUserId(formData: FormData) {
  return String(
    formData.get("userId") ?? ""
  ).trim();
}

export async function promoteToAdmin(
  formData: FormData
) {
  await getCurrentAdminId();

  const userId = getUserId(formData);

  if (!userId) {
    redirect(
      "/admin/admins?error=invalid_user"
    );
  }

  const adminClient =
    createAdminClient();

  const {
    data: targetProfile,
    error: targetError,
  } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (
    targetError ||
    !targetProfile
  ) {
    redirect(
      "/admin/admins?error=user_not_found"
    );
  }

  if (targetProfile.role === "admin") {
    redirect(
      "/admin/admins?error=already_admin"
    );
  }

  const { error: updateError } =
    await adminClient
      .from("profiles")
      .update({
        role: "admin",
      })
      .eq("id", userId);

  if (updateError) {
    console.error(
      "Promote admin error:",
      updateError
    );

    redirect(
      "/admin/admins?error=promote_failed"
    );
  }

  revalidatePath("/admin/admins");
  revalidatePath("/admin/students");
  revalidatePath("/admin");

  redirect(
    "/admin/admins?success=promoted"
  );
}

export async function demoteAdmin(
  formData: FormData
) {
  const currentAdminId =
    await getCurrentAdminId();

  const userId = getUserId(formData);

  if (!userId) {
    redirect(
      "/admin/admins?error=invalid_user"
    );
  }

  if (userId === currentAdminId) {
    redirect(
      "/admin/admins?error=cannot_demote_self"
    );
  }

  const adminClient =
    createAdminClient();

  const {
    count: adminsCount,
    error: countError,
  } = await adminClient
    .from("profiles")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("role", "admin");

  if (countError) {
    console.error(
      "Admin count error:",
      countError
    );

    redirect(
      "/admin/admins?error=count_failed"
    );
  }

  if (
    typeof adminsCount !== "number" ||
    adminsCount <= 1
  ) {
    redirect(
      "/admin/admins?error=last_admin"
    );
  }

  const {
    data: targetProfile,
    error: targetError,
  } = await adminClient
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (
    targetError ||
    !targetProfile
  ) {
    redirect(
      "/admin/admins?error=user_not_found"
    );
  }

  if (targetProfile.role !== "admin") {
    redirect(
      "/admin/admins?error=not_admin"
    );
  }

  const { error: updateError } =
    await adminClient
      .from("profiles")
      .update({
        role: "student",
      })
      .eq("id", userId);

  if (updateError) {
    console.error(
      "Demote admin error:",
      updateError
    );

    redirect(
      "/admin/admins?error=demote_failed"
    );
  }

  revalidatePath("/admin/admins");
  revalidatePath("/admin/students");
  revalidatePath("/admin");

  redirect(
    "/admin/admins?success=demoted"
  );
}
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function getCurrentOwnerId() {
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
    .select("role, is_owner")
    .eq("id", currentUserId)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.role !== "admin" ||
    profile.is_owner !== true
  ) {
    redirect(
      "/admin?error=owner_permission_required"
    );
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
  await getCurrentOwnerId();

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
    .select("id, role, is_owner")
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
      .eq("id", userId)
      .eq("is_owner", false);

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
  const currentOwnerId =
    await getCurrentOwnerId();

  const userId = getUserId(formData);

  if (!userId) {
    redirect(
      "/admin/admins?error=invalid_user"
    );
  }

  if (userId === currentOwnerId) {
    redirect(
      "/admin/admins?error=cannot_demote_owner"
    );
  }

  const adminClient =
    createAdminClient();

  const {
    data: targetProfile,
    error: targetError,
  } = await adminClient
    .from("profiles")
    .select("id, role, is_owner")
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

  if (targetProfile.is_owner === true) {
    redirect(
      "/admin/admins?error=cannot_demote_owner"
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
      .eq("id", userId)
      .eq("is_owner", false);

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
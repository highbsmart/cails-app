"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

function fail(message: string): never {
  redirect("/settings?tab=accounts&error=" + encodeURIComponent(message));
}

function done(message: string): never {
  revalidatePath("/settings");
  redirect("/settings?tab=accounts&notice=" + encodeURIComponent(message));
}

/** Creating accounts is a MANAGE_USERS action; the service key has no opinion, so we check. */
async function requireUserAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_permission", { perm_code: "MANAGE_USERS" });
  if (error || !data) {
    fail("You need the Manage Users permission to create accounts.");
  }
}

type CreateResult = { email: string; ok: boolean; detail: string };

/**
 * Creates the auth account. The database trigger on auth.users creates the
 * matching profile row, so we only pass full_name through user metadata and
 * let it land there. If a staff record already carries this email, we link it
 * so the person's leave, appraisals and documents attach to their login.
 */
async function createOne(
  admin: ReturnType<typeof createAdminClient>,
  fullName: string,
  email: string,
  password: string,
  roleId?: string | null
): Promise<CreateResult> {
  if (!email || !password) {
    return { email: email || "(blank)", ok: false, detail: "Email and password are both required." };
  }
  if (password.length < 8) {
    return { email, ok: false, detail: "Password must be at least 8 characters." };
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || email },
  });

  if (error) {
    const detail = error.message.includes("already been registered")
      ? "An account with this email already exists."
      : error.message;
    return { email, ok: false, detail };
  }

  const userId = data.user?.id;
  if (!userId) return { email, ok: false, detail: "Account created but no id was returned." };

  const notes: string[] = ["account created"];

  // Link to an existing staff record with the same email, if there is one.
  const { data: staffMatch } = await admin
    .from("staff")
    .select("id")
    .eq("email", email)
    .is("deleted_at", null)
    .maybeSingle();

  if (staffMatch) {
    await admin.from("staff").update({ user_id: userId }).eq("id", staffMatch.id);
    notes.push("linked to staff record");
  } else {
    // Not staff — try the student register, so students reach their own results.
    const { data: studentMatch } = await admin
      .from("students")
      .select("id")
      .eq("email", email)
      .is("deleted_at", null)
      .maybeSingle();

    if (studentMatch) {
      await admin.from("students").update({ user_id: userId }).eq("id", studentMatch.id);
      notes.push("linked to student record");
    }
  }

  if (roleId) {
    const { error: roleError } = await admin.from("user_roles").insert({
      user_id: userId,
      role_id: roleId,
      scope_type: "institution",
    });
    notes.push(roleError ? `role not assigned (${roleError.message})` : "role assigned");
  }

  return { email, ok: true, detail: notes.join(", ") };
}

export async function createUserAccount(formData: FormData) {
  await requireUserAdmin();
  const admin = createAdminClient();

  const result = await createOne(
    admin,
    str(formData, "full_name"),
    str(formData, "email").toLowerCase(),
    str(formData, "password"),
    str(formData, "role_id") || null
  );

  if (!result.ok) fail(`${result.email}: ${result.detail}`);
  done(`Account created for ${result.email} — ${result.detail}. Give them the password you set and ask them to change it after signing in.`);
}

/**
 * Bulk import from pasted CSV: full_name,email,password[,role_code]
 * Processed row by row so one bad line doesn't abandon the rest, and the
 * summary reports which lines failed and why.
 */
export async function bulkCreateAccounts(formData: FormData) {
  await requireUserAdmin();
  const admin = createAdminClient();

  const raw = String(formData.get("csv") ?? "").trim();
  if (!raw) fail("Paste at least one row before importing.");

  const { data: roles } = await admin.from("roles").select("id, code");
  const roleByCode = new Map((roles ?? []).map((r) => [r.code.toUpperCase(), r.id]));

  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((l) => !/^full_?name\s*,/i.test(l)); // tolerate a header row

  if (lines.length > 200) fail("Import at most 200 rows at a time.");

  const results: CreateResult[] = [];
  for (const line of lines) {
    const cells = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [fullName, email, password, roleCode] = cells;

    if (roleCode && !roleByCode.has(roleCode.toUpperCase())) {
      results.push({ email: email || line, ok: false, detail: `Unknown role code "${roleCode}".` });
      continue;
    }

    results.push(
      await createOne(
        admin,
        fullName,
        (email ?? "").toLowerCase(),
        password,
        roleCode ? roleByCode.get(roleCode.toUpperCase()) : null
      )
    );
  }

  const created = results.filter((r) => r.ok).length;
  const failures = results.filter((r) => !r.ok);

  const summary =
    `${created} of ${results.length} accounts created.` +
    (failures.length
      ? " Failed: " + failures.map((f) => `${f.email} (${f.detail})`).join("; ")
      : "");

  done(summary);
}

export async function resetUserPassword(formData: FormData) {
  await requireUserAdmin();
  const admin = createAdminClient();

  const userId = str(formData, "user_id");
  const password = str(formData, "password");
  if (password.length < 8) fail("The new password must be at least 8 characters.");

  const { error } = await admin.auth.admin.updateUserById(userId, { password });
  if (error) fail(error.message);

  done("Password reset. Pass it to the user and ask them to change it after signing in.");
}

/**
 * Suspension uses a very long ban rather than deleting the account: the
 * person's memos, approvals and minutes must keep their author.
 */
export async function setAccountActive(formData: FormData) {
  await requireUserAdmin();
  const admin = createAdminClient();

  const userId = str(formData, "user_id");
  const makeActive = str(formData, "value") === "true";

  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: makeActive ? "none" : "876000h",
  });
  if (error) fail(error.message);

  await admin.from("profiles").update({ is_active: makeActive }).eq("id", userId);

  done(makeActive ? "Account re-enabled." : "Account suspended — the user can no longer sign in.");
}

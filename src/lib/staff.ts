import { createClient } from "@/lib/supabase/server";

export type StaffListRow = {
  id: string;
  staff_id_number: string | null;
  title: string | null;
  first_name: string;
  middle_name: string | null;
  surname: string;
  rank: string | null;
  employment_type: string | null;
  status: string;
  department: { id: string; name: string } | null;
  school: { id: string; name: string } | null;
};

export type StaffProfile = StaffListRow & {
  gender: string | null;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  appointment_date: string | null;
  confirmation_date: string | null;
  next_of_kin_name: string | null;
  next_of_kin_phone: string | null;
};

/**
 * Fetches the staff directory visible to the current user.
 * No manual filtering by department/school happens here — RLS on the
 * `staff` table (Step 3) already restricts rows to what this user's
 * roles entitle them to see. This function just shapes the result.
 */
export async function listStaff(search?: string): Promise<StaffListRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("staff")
    .select(
      "id, staff_id_number, title, first_name, middle_name, surname, rank, employment_type, status, department:departments(id, name), school:schools(id, name)"
    )
    .is("deleted_at", null)
    .order("surname", { ascending: true });

  if (search && search.trim().length > 0) {
    const term = search.trim();
    query = query.or(
      `first_name.ilike.%${term}%,surname.ilike.%${term}%,staff_id_number.ilike.%${term}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as StaffListRow[];
}

export async function getStaffById(id: string): Promise<StaffProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("staff")
    .select(
      "id, staff_id_number, title, first_name, middle_name, surname, gender, date_of_birth, phone, email, address, rank, employment_type, status, appointment_date, confirmation_date, next_of_kin_name, next_of_kin_phone, department:departments(id, name), school:schools(id, name)"
    )
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // no matching row visible to this user
    throw error;
  }
  return data as unknown as StaffProfile;
}

export type Posting = {
  id: string;
  department: { id: string; name: string } | null;
  school: { id: string; name: string } | null;
  rank_at_posting: string | null;
  reason: string | null;
  effective_start: string;
  effective_end: string | null;
};

export async function getPostingHistory(staffId: string): Promise<Posting[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_postings")
    .select(
      "id, department:departments(id, name), school:schools(id, name), rank_at_posting, reason, effective_start, effective_end"
    )
    .eq("staff_id", staffId)
    .order("effective_start", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as Posting[];
}

export async function currentUserCan(permissionCode: string): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("has_permission", {
    perm_code: permissionCode,
  });
  if (error) return false;
  return Boolean(data);
}

export async function listDepartments() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, school_id")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

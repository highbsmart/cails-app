import { createClient } from "@/lib/supabase/server";

export const REPORT_KEYS = [
  "students-by-programme",
  "grade-distribution",
  "leave-summary",
  "staff-register",
] as const;

export type ReportKey = (typeof REPORT_KEYS)[number];

export type ReportTable = {
  title: string;
  description: string;
  columns: string[];
  rows: (string | number)[][];
};

export const REPORT_LABELS: Record<ReportKey, string> = {
  "students-by-programme": "Students by Programme",
  "grade-distribution": "Grade Distribution",
  "leave-summary": "Leave Summary",
  "staff-register": "Staff Register",
};

export function isReportKey(value: string): value is ReportKey {
  return (REPORT_KEYS as readonly string[]).includes(value);
}

/**
 * Grouping happens here rather than in SQL: PostgREST has no GROUP BY, and at
 * institution scale these tables are small enough that pulling the rows and
 * counting them in one pass is cheaper than adding a view per report. If the
 * register grows into six figures, move these to database views.
 */
function tally<T>(rows: T[], keys: ((row: T) => string)[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = keys.map((k) => k(row) || "Unspecified").join("\u0000");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function expand(counts: Map<string, number>): (string | number)[][] {
  return [...counts.entries()]
    .map(([key, count]) => [...key.split("\u0000"), count])
    .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
}

async function studentsByProgramme(): Promise<ReportTable> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("level, status, programme:programmes(name)")
    .is("deleted_at", null);
  if (error) throw error;

  type Row = { level: number | null; status: string; programme: { name: string } | null };
  const rows = (data ?? []) as unknown as Row[];

  return {
    title: REPORT_LABELS["students-by-programme"],
    description: "Enrolment counted by programme, level and status.",
    columns: ["Programme", "Level", "Status", "Students"],
    rows: expand(
      tally(rows, [
        (r) => r.programme?.name ?? "",
        (r) => (r.level === null ? "" : String(r.level)),
        (r) => r.status,
      ])
    ),
  };
}

async function gradeDistribution(sessionId?: string): Promise<ReportTable> {
  const supabase = await createClient();
  let query = supabase
    .from("examination_results")
    .select("grade, status, course:courses(code), academic_session:academic_sessions(name)");
  if (sessionId && sessionId !== "all") {
    query = query.eq("academic_session_id", sessionId);
  }
  const { data, error } = await query;
  if (error) throw error;

  type Row = {
    grade: string | null;
    status: string;
    course: { code: string } | null;
    academic_session: { name: string } | null;
  };
  const rows = (data ?? []) as unknown as Row[];

  return {
    title: REPORT_LABELS["grade-distribution"],
    description:
      "Grades awarded per course and session. Results still working through approval are included, with their status shown.",
    columns: ["Session", "Course", "Grade", "Status", "Results"],
    rows: expand(
      tally(rows, [
        (r) => r.academic_session?.name ?? "",
        (r) => r.course?.code ?? "",
        (r) => r.grade ?? "Ungraded",
        (r) => r.status,
      ])
    ),
  };
}

async function leaveSummary(): Promise<ReportTable> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff_leave")
    .select(
      "days_requested, status, leave_type:leave_types(name), staff:staff(department:departments(name))"
    );
  if (error) throw error;

  type Row = {
    days_requested: number;
    status: string;
    leave_type: { name: string } | null;
    staff: { department: { name: string } | null } | null;
  };
  const rows = (data ?? []) as unknown as Row[];

  // Two numbers per group, so this one counts days as well as requests.
  const grouped = new Map<string, { requests: number; days: number }>();
  for (const r of rows) {
    const key = [
      r.staff?.department?.name || "Unspecified",
      r.leave_type?.name || "Unspecified",
      r.status,
    ].join("\u0000");
    const current = grouped.get(key) ?? { requests: 0, days: 0 };
    grouped.set(key, {
      requests: current.requests + 1,
      days: current.days + (r.days_requested ?? 0),
    });
  }

  return {
    title: REPORT_LABELS["leave-summary"],
    description: "Leave requests and days, grouped by department, type and approval status.",
    columns: ["Department", "Leave Type", "Status", "Requests", "Days"],
    rows: [...grouped.entries()]
      .map(([key, v]) => [...key.split("\u0000"), v.requests, v.days])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0]))),
  };
}

async function staffRegister(): Promise<ReportTable> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("staff")
    .select(
      "staff_id_number, first_name, surname, rank, employment_type, status, appointment_date, department:departments(name)"
    )
    .is("deleted_at", null)
    .order("surname");
  if (error) throw error;

  type Row = {
    staff_id_number: string | null;
    first_name: string;
    surname: string;
    rank: string | null;
    employment_type: string | null;
    status: string;
    appointment_date: string | null;
    department: { name: string } | null;
  };

  return {
    title: REPORT_LABELS["staff-register"],
    description: "The full staff register, one row per person.",
    columns: ["Staff ID", "Name", "Department", "Rank", "Employment Type", "Status", "Appointed"],
    rows: ((data ?? []) as unknown as Row[]).map((s) => [
      s.staff_id_number ?? "—",
      `${s.first_name} ${s.surname}`,
      s.department?.name ?? "—",
      s.rank ?? "—",
      s.employment_type ?? "—",
      s.status,
      s.appointment_date ?? "—",
    ]),
  };
}

export async function buildReport(key: ReportKey, sessionId?: string): Promise<ReportTable> {
  switch (key) {
    case "students-by-programme":
      return studentsByProgramme();
    case "grade-distribution":
      return gradeDistribution(sessionId);
    case "leave-summary":
      return leaveSummary();
    case "staff-register":
      return staffRegister();
  }
}

/** RFC 4180 quoting: wrap every field, double any quote inside it. */
export function toCsv(table: ReportTable): string {
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  return [table.columns, ...table.rows].map((row) => row.map(escape).join(",")).join("\r\n");
}

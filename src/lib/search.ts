import { createClient } from "@/lib/supabase/server";

export type SearchHit = {
  id: string;
  title: string;
  detail: string;
  href: string;
};

export type SearchGroup = { label: string; hits: SearchHit[] };

/**
 * Every query runs under the signed-in user's own session, so row-level
 * security decides what can be found. A clerk searching "Provost" gets the
 * meetings and memos they're entitled to and nothing else — search doesn't
 * become a way around the permissions the rest of the system enforces.
 *
 * A refused query returns nothing rather than throwing, so one inaccessible
 * table doesn't empty the whole page.
 */
async function safe<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch {
    return fallback;
  }
}

export async function searchEverything(rawQuery: string): Promise<SearchGroup[]> {
  const q = rawQuery.trim();
  if (q.length < 2) return [];
  const like = `%${q}%`;

  const supabase = await createClient();

  const [staff, students, memos, documents, meetings, tasks] = await Promise.all([
    safe(async () => {
      const { data } = await supabase
        .from("staff")
        .select("id, title, first_name, surname, rank, staff_id_number")
        .is("deleted_at", null)
        .or(`first_name.ilike.${like},surname.ilike.${like},staff_id_number.ilike.${like}`)
        .limit(8);
      return (data ?? []) as {
        id: string; title: string | null; first_name: string; surname: string;
        rank: string | null; staff_id_number: string | null;
      }[];
    }, []),
    safe(async () => {
      const { data } = await supabase
        .from("students")
        .select("id, matric_number, first_name, surname, level")
        .is("deleted_at", null)
        .or(`first_name.ilike.${like},surname.ilike.${like},matric_number.ilike.${like}`)
        .limit(8);
      return (data ?? []) as {
        id: string; matric_number: string; first_name: string; surname: string; level: number | null;
      }[];
    }, []),
    safe(async () => {
      const { data } = await supabase
        .from("memos")
        .select("id, subject, reference_number, status")
        .or(`subject.ilike.${like},reference_number.ilike.${like}`)
        .limit(8);
      return (data ?? []) as {
        id: string; subject: string; reference_number: string | null; status: string;
      }[];
    }, []),
    safe(async () => {
      const { data } = await supabase
        .from("documents")
        .select("id, title, category, entity_type")
        .eq("is_active", true)
        .ilike("title", like)
        .limit(8);
      return (data ?? []) as {
        id: string; title: string; category: string | null; entity_type: string;
      }[];
    }, []),
    safe(async () => {
      const { data } = await supabase
        .from("meetings")
        .select("id, title, scheduled_at, venue")
        .ilike("title", like)
        .limit(8);
      return (data ?? []) as {
        id: string; title: string; scheduled_at: string; venue: string | null;
      }[];
    }, []),
    safe(async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, status, priority")
        .ilike("title", like)
        .limit(8);
      return (data ?? []) as {
        id: string; title: string; status: string; priority: string;
      }[];
    }, []),
  ]);

  const groups: SearchGroup[] = [
    {
      label: "Staff",
      hits: staff.map((s) => ({
        id: s.id,
        title: `${s.title ? s.title + " " : ""}${s.first_name} ${s.surname}`,
        detail: [s.rank, s.staff_id_number].filter(Boolean).join(" · ") || "Staff record",
        href: `/staff/${s.id}`,
      })),
    },
    {
      label: "Students",
      hits: students.map((s) => ({
        id: s.id,
        title: `${s.first_name} ${s.surname}`,
        detail: [s.matric_number, s.level ? `Level ${s.level}` : null].filter(Boolean).join(" · "),
        href: `/students/${s.id}`,
      })),
    },
    {
      label: "Memos",
      hits: memos.map((m) => ({
        id: m.id,
        title: m.subject,
        detail: [m.reference_number, m.status].filter(Boolean).join(" · "),
        href: `/communication`,
      })),
    },
    {
      label: "Documents",
      hits: documents.map((d) => ({
        id: d.id,
        title: d.title,
        detail: [d.category, d.entity_type].filter(Boolean).join(" · "),
        href: `/documents`,
      })),
    },
    {
      label: "Meetings",
      hits: meetings.map((m) => ({
        id: m.id,
        title: m.title,
        detail: [new Date(m.scheduled_at).toLocaleDateString(), m.venue].filter(Boolean).join(" · "),
        href: `/meetings/${m.id}`,
      })),
    },
    {
      label: "Tasks",
      hits: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        detail: `${t.priority} · ${t.status.replace("_", " ")}`,
        href: `/tasks/${t.id}`,
      })),
    },
  ];

  return groups.filter((g) => g.hits.length > 0);
}

import Link from "next/link";
import { searchEverything } from "@/lib/search";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const groups = await searchEverything(query);
  const total = groups.reduce((n, g) => n + g.hits.length, 0);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">Search</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          {query.length < 2
            ? "Type at least two characters in the search box above."
            : `${total} ${total === 1 ? "result" : "results"} for “${query}”`}
        </p>
      </div>

      {query.length >= 2 && total === 0 && (
        <p className="rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-ink-soft)]">
          Nothing matched. Searches cover staff, students, memos, documents, meetings and tasks —
          and only what your role allows you to see, so a result you expected may simply be outside
          your access.
        </p>
      )}

      {groups.map((group) => (
        <section key={group.label} className="space-y-2">
          <h2 className="font-serif text-sm text-[var(--color-green-deep)]">
            {group.label} ({group.hits.length})
          </h2>
          <ul className="rounded-sm border border-[var(--color-line)] bg-white/50 p-3">
            {group.hits.map((hit) => (
              <li key={hit.id} className="border-b border-[var(--color-line)] py-2 last:border-0">
                <Link href={hit.href} className="text-sm text-[var(--color-green-deep)] hover:underline">
                  {hit.title}
                </Link>
                <span className="ml-2 text-xs text-[var(--color-ink-soft)]">{hit.detail}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

/** Skeleton shown while a dashboard page's queries resolve. */
export default function DashboardLoading() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="h-6 w-52 animate-pulse rounded-sm bg-[var(--color-line)]" />
        <div className="h-4 w-72 animate-pulse rounded-sm bg-[var(--color-line)]/60" />
      </div>
      <div className="space-y-2 rounded-sm border border-[var(--color-line)] p-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-4 animate-pulse rounded-sm bg-[var(--color-line)]/60"
            style={{ width: `${90 - i * 12}%` }}
          />
        ))}
      </div>
    </div>
  );
}

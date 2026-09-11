"use client";

import { useState } from "react";

export function ProfileTabs({
  tabs,
  initialIndex = 0,
}: {
  tabs: { label: string; content: React.ReactNode }[];
  initialIndex?: number;
}) {
  const [active, setActive] = useState(
    initialIndex >= 0 && initialIndex < tabs.length ? initialIndex : 0
  );

  return (
    <div>
      <div className="flex flex-wrap gap-1 border-b border-[var(--color-line)]">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={`border-b-2 px-4 py-2.5 text-sm transition-colors ${
              active === i
                ? "border-[var(--color-brass)] font-medium text-[var(--color-green-deep)]"
                : "border-transparent text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-5">{tabs[active].content}</div>
    </div>
  );
}

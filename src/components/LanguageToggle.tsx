"use client";

import { useLanguage } from "@/lib/language-context";

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 rounded-full border border-[var(--color-line)] p-0.5 text-sm">
      <button
        onClick={() => setLanguage("en")}
        aria-pressed={language === "en"}
        className={`rounded-full px-3 py-1 transition-colors ${
          language === "en"
            ? "bg-[var(--color-green-deep)] text-[var(--color-paper)]"
            : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        }`}
      >
        English
      </button>
      <button
        onClick={() => setLanguage("ar")}
        aria-pressed={language === "ar"}
        className={`rounded-full px-3 py-1 font-serif transition-colors ${
          language === "ar"
            ? "bg-[var(--color-green-deep)] text-[var(--color-paper)]"
            : "text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        }`}
      >
        العربية
      </button>
    </div>
  );
}

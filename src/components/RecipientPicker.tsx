"use client";

import { useState } from "react";
import type { OfficeOption } from "@/lib/messages";

export function RecipientPicker({ offices }: { offices: OfficeOption[] }) {
  const [type, setType] = useState<"office" | "person">("office");

  return (
    <div>
      <div className="mb-2 flex gap-4">
        <label className="flex items-center gap-1.5 text-sm text-[var(--color-ink)]">
          <input
            type="radio"
            name="recipient_type"
            value="office"
            checked={type === "office"}
            onChange={() => setType("office")}
          />
          An Office
        </label>
        <label className="flex items-center gap-1.5 text-sm text-[var(--color-ink)]">
          <input
            type="radio"
            name="recipient_type"
            value="person"
            checked={type === "person"}
            onChange={() => setType("person")}
          />
          A Person
        </label>
      </div>

      {type === "office" ? (
        <select
          name="recipient_office_id"
          required
          defaultValue=""
          className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
        >
          <option value="" disabled>
            Select office…
          </option>
          {offices.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      ) : (
        <input
          name="recipient_email"
          type="email"
          required
          placeholder="colleague@cails.edu.ng"
          className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
        />
      )}
    </div>
  );
}

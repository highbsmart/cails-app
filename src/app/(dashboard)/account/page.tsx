import { createClient } from "@/lib/supabase/server";
import { changeOwnPassword } from "./actions";
import { LabeledField } from "@/components/LabeledField";

const input =
  "w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brass)]";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <h1 className="font-serif text-xl text-[var(--color-green-deep)]">My Account</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">{user?.email}</p>
      </div>

      {notice && (
        <p className="rounded-sm border border-[var(--color-green-deep)]/30 bg-[var(--color-green-deep)]/5 px-3 py-2.5 text-sm text-[var(--color-green-deep)]">
          {notice}
        </p>
      )}
      {error && (
        <p className="rounded-sm border-2 border-[var(--color-clay)]/50 bg-[var(--color-clay)]/10 px-3 py-2.5 text-sm font-medium text-[var(--color-clay)]">
          {error}
        </p>
      )}

      <form action={changeOwnPassword} className="space-y-4">
        <p className="text-sm text-[var(--color-ink-soft)]">
          If an administrator set up your account, change the password they gave you to one only you
          know.
        </p>
        <LabeledField label="New password">
          <input name="password" type="password" minLength={8} required className={input} />
        </LabeledField>
        <LabeledField label="Confirm new password">
          <input name="confirm" type="password" minLength={8} required className={input} />
        </LabeledField>
        <button
          type="submit"
          className="rounded-sm bg-[var(--color-green-deep)] px-4 py-2 text-sm font-medium text-[var(--color-paper)] hover:bg-[var(--color-green-mid)]"
        >
          Change Password
        </button>
      </form>
    </div>
  );
}

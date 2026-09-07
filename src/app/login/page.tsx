import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-paper)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-sm bg-[var(--color-green-deep)] font-serif text-2xl text-[var(--color-brass-soft)]">
            C
          </div>
          <h1 className="font-serif text-xl text-[var(--color-green-deep)]">
            CAILS Institutional Portal
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            Kwara State College of Arabic and Islamic Legal Studies
          </p>
        </div>

        <form
          action={login}
          className="space-y-4 rounded-sm border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
        >
          {error && (
            <p className="rounded-sm border border-[var(--color-clay)]/30 bg-[var(--color-clay)]/10 px-3 py-2 text-sm text-[var(--color-clay)]">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-[var(--color-ink-soft)]">
              Institutional email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-[var(--color-ink-soft)]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-sm border border-[var(--color-line)] bg-white px-3 py-2 text-sm focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-sm bg-[var(--color-green-deep)] py-2 text-sm font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-green-mid)]"
          >
            Sign in
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-[var(--color-ink-soft)]">
          New staff accounts are created by your System Administrator.
        </p>
      </div>
    </div>
  );
}

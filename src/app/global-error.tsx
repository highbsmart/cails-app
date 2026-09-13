"use client";

/** Last resort: catches failures in the root layout itself, so it has to
 *  render its own <html> and <body>. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "3rem", color: "#1c1c1c" }}>
        <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>Something went wrong</h1>
        <p style={{ fontSize: "0.875rem", color: "#5c5c5c", marginBottom: "1rem" }}>
          The application failed to start. If this keeps happening, contact your System
          Administrator.
          {error.digest ? ` Reference: ${error.digest}` : ""}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1rem",
            fontSize: "0.875rem",
            border: "1px solid #1c1c1c",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}

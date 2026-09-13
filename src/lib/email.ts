/**
 * Transactional email via Resend's HTTP API.
 *
 * Deliberately fails soft: if RESEND_API_KEY isn't set, or the send fails,
 * this logs and returns false rather than throwing. A leave request must never
 * fail to submit because the mail server had a bad day — the notification is a
 * courtesy on top of the record, not part of it.
 */
export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string[];
  subject: string;
  body: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "CAILS Portal <onboarding@resend.dev>";
  const recipients = to.filter(Boolean);

  if (!key || recipients.length === 0) return false;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: recipients, subject, html: wrap(subject, body) }),
    });

    if (!response.ok) {
      console.error("Email send failed:", response.status, await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Email send threw:", error);
    return false;
  }
}

export function emailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const PORTAL_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://cails-app.vercel.app";

function wrap(heading: string, body: string): string {
  return `
  <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1c1c1c">
    <p style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#6b6b6b;margin:0 0 4px">
      CAILS Institutional Portal
    </p>
    <h1 style="font-size:18px;margin:0 0 16px;color:#14532d">${heading}</h1>
    ${body}
    <p style="margin-top:24px">
      <a href="${PORTAL_URL}" style="color:#14532d">Open the portal</a>
    </p>
    <p style="font-size:12px;color:#6b6b6b;margin-top:24px;border-top:1px solid #e5e5e5;padding-top:12px">
      Kwara State College of Arabic and Islamic Legal Studies, Ilorin.
      This is an automated message — please don't reply to it.
    </p>
  </div>`;
}

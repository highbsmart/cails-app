import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAILS Institutional Portal",
  description:
    "Kwara State College of Arabic and Islamic Legal Studies - Integrated Management System",
};

// NOTE: this sandbox cannot reach fonts.googleapis.com, so we use system
// font stacks below instead of next/font/google. On Vercel (which has
// normal internet access) you can switch back to next/font/google for
// Fraunces + Inter with zero other changes - see globals.css comment.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

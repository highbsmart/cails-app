import { NextResponse } from "next/server";
import { buildReport, toCsv, isReportKey } from "@/lib/reports";

/**
 * CSV download for a report. Every query inside buildReport runs through the
 * user's own Supabase session, so RLS decides what lands in the file — this
 * route adds no privileges of its own.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  if (!isReportKey(key)) {
    return NextResponse.json({ error: "Unknown report" }, { status: 404 });
  }

  const sessionId = new URL(request.url).searchParams.get("session") ?? undefined;

  try {
    const table = await buildReport(key, sessionId);
    const stamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(toCsv(table), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${key}-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Could not build that report. You may not have access to the underlying records." },
      { status: 403 }
    );
  }
}

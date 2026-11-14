import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/account";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(_request: NextRequest) {
  try {
    const sql = db();
    await sql`CREATE TABLE IF NOT EXISTS ritmo_announcements (id UUID PRIMARY KEY, title VARCHAR(100) NOT NULL, message VARCHAR(1000) NOT NULL, starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE)`;
    const rows = await sql`SELECT id, title, message, ends_at FROM ritmo_announcements WHERE active = TRUE AND starts_at <= NOW() AND ends_at > NOW() ORDER BY starts_at DESC LIMIT 1`;
    return NextResponse.json({ announcement: rows[0] || null });
  } catch { return NextResponse.json({ announcement: null }); }
}

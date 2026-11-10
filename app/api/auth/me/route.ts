import { NextRequest, NextResponse } from "next/server";
import { currentUserId, ensureAccountTables } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const id = currentUserId(request);
  if (!id) return NextResponse.json({ user: null });
  try {
    const sql = await ensureAccountTables();
    const rows = await sql`SELECT username, email FROM ritmo_users WHERE id = ${id}::uuid AND verified = TRUE LIMIT 1`;
    return NextResponse.json({ user: rows[0] ? { username: rows[0].username, email: rows[0].email } : null });
  } catch {
    return NextResponse.json({ user: null }, { status: 503 });
  }
}

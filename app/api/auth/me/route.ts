import { NextRequest, NextResponse } from "next/server";
import { currentUserId, ensureAccountTables } from "@/lib/account";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const id = currentUserId(request);
  if (!id) return NextResponse.json({ user: null });
  try {
    const sql = await ensureAccountTables();
    const rows = await sql`SELECT username, email, account_status FROM ritmo_users WHERE id = ${id}::uuid AND verified = TRUE LIMIT 1`;
    if (!rows[0] || rows[0].account_status !== "active") {
      const response = NextResponse.json({ user: null, error: rows[0]?.account_status === "banned" ? "Conta banida." : "Conta bloqueada." }, { status: 403 });
      response.cookies.set("ritmo_uid", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
      return response;
    }
    return NextResponse.json({ user: { username: rows[0].username, email: rows[0].email } });
  } catch { return NextResponse.json({ user: null }, { status: 503 }); }
}

import { NextRequest, NextResponse } from "next/server";
import { ensureAccountTables, hashToken, setUserCookie } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  if (!/^[a-f0-9]{64}$/.test(token)) return NextResponse.redirect(new URL("/conta?erro=link_invalido", request.url));
  try {
    const sql = await ensureAccountTables();
    const rows = await sql`SELECT v.user_id, u.legacy_id FROM ritmo_email_verifications v
      JOIN ritmo_users u ON u.id = v.user_id
      WHERE v.token_hash = ${hashToken(token)} AND v.expires_at > NOW() AND u.verified = FALSE LIMIT 1`;
    if (!rows.length) return NextResponse.redirect(new URL("/conta?erro=link_expirado", request.url));
    const userId = String(rows[0].user_id);
    const legacyId = rows[0].legacy_id ? String(rows[0].legacy_id) : null;
    await sql`UPDATE ritmo_users SET verified = TRUE WHERE id = ${userId}::uuid`;
    await sql`DELETE FROM ritmo_email_verifications WHERE user_id = ${userId}::uuid`;
    if (legacyId && legacyId !== userId) {
      await sql`INSERT INTO ritmo_user_data (user_id, data, updated_at)
        SELECT ${userId}::uuid, data, NOW() FROM ritmo_user_data WHERE user_id = ${legacyId}::uuid
        ON CONFLICT (user_id) DO NOTHING`;
      await sql`DELETE FROM ritmo_user_data WHERE user_id = ${legacyId}::uuid`;
    }
    const response = NextResponse.redirect(new URL("/?conta=confirmada", request.url));
    return setUserCookie(response, userId);
  } catch {
    return NextResponse.redirect(new URL("/conta?erro=confirmacao", request.url));
  }
}

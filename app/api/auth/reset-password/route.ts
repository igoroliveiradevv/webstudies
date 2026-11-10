import { NextRequest, NextResponse } from "next/server";
import { ensureAccountTables, hashPassword, hashToken, passwordIsStrong } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = String(body.token ?? "");
    const password = String(body.password ?? "");
    if (!/^[a-f0-9]{64}$/.test(token)) return NextResponse.json({ error: "Link inválido ou expirado." }, { status: 400 });
    if (!passwordIsStrong(password)) return NextResponse.json({ error: "A senha precisa ter 12–128 caracteres, maiúscula, minúscula, número e símbolo." }, { status: 400 });
    const sql = await ensureAccountTables();
    const rows = await sql`SELECT user_id FROM ritmo_password_resets WHERE token_hash = ${hashToken(token)} AND expires_at > NOW() LIMIT 1`;
    if (!rows.length) return NextResponse.json({ error: "Link inválido ou expirado. Solicite outro e-mail." }, { status: 400 });
    const userId = String(rows[0].user_id);
    const passwordHash = await hashPassword(password);
    await sql`UPDATE ritmo_users SET password_hash = ${passwordHash} WHERE id = ${userId}::uuid AND verified = TRUE`;
    await sql`DELETE FROM ritmo_password_resets WHERE user_id = ${userId}::uuid`;
    return NextResponse.json({ ok: true, message: "Senha alterada. Agora você já pode entrar." });
  } catch {
    return NextResponse.json({ error: "Não foi possível redefinir a senha." }, { status: 500 });
  }
}

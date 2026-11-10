import { NextRequest, NextResponse } from "next/server";
import { currentUserId, ensureAccountTables, hashPassword, passwordIsStrong, validUsername, verifyPassword } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  try {
    const id = currentUserId(request);
    if (!id) return NextResponse.json({ error: "Faça login para alterar sua conta." }, { status: 401 });
    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const currentPassword = String(body.currentPassword ?? "");
    const newPassword = String(body.newPassword ?? "");
    if (!validUsername(username)) return NextResponse.json({ error: "Username: use de 3 a 20 caracteres, letras, números e _." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    if (!currentPassword) return NextResponse.json({ error: "Informe sua senha atual para confirmar as alterações." }, { status: 400 });
    if (newPassword && !passwordIsStrong(newPassword)) return NextResponse.json({ error: "A nova senha precisa ter 12–128 caracteres, maiúscula, minúscula, número e símbolo." }, { status: 400 });
    const sql = await ensureAccountTables();
    const rows = await sql`SELECT password_hash FROM ritmo_users WHERE id = ${id}::uuid AND verified = TRUE LIMIT 1`;
    if (!rows.length || !(await verifyPassword(currentPassword, String(rows[0].password_hash)))) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 403 });
    try {
      const passwordHash = newPassword ? await hashPassword(newPassword) : null;
      await sql`UPDATE ritmo_users SET username = ${username}, email = ${email}, password_hash = COALESCE(${passwordHash}, password_hash) WHERE id = ${id}::uuid`;
    } catch {
      return NextResponse.json({ error: "Esse username ou e-mail já está em uso." }, { status: 409 });
    }
    return NextResponse.json({ ok: true, user: { username, email }, message: "Configurações atualizadas." });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar sua conta agora." }, { status: 500 });
  }
}
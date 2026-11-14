import { NextRequest, NextResponse } from "next/server";
import { ensureAccountTables, setUserCookie, verifyPassword } from "@/lib/account";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const login = String(body.login ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const sql = await ensureAccountTables();
    const rows = await sql`SELECT id, username, email, password_hash, verified, account_status FROM ritmo_users
      WHERE LOWER(email) = ${login} OR LOWER(username) = ${login} LIMIT 1`;
    if (!rows.length || !(await verifyPassword(password, String(rows[0].password_hash)))) {
      return NextResponse.json({ error: "Usuário/e-mail ou senha incorretos." }, { status: 401 });
    }
    if (rows[0].account_status === "banned") return NextResponse.json({ error: "Esta conta foi banida e não pode acessar a plataforma." }, { status: 403 });
    if (rows[0].account_status === "blocked") return NextResponse.json({ error: "Esta conta está temporariamente bloqueada. Entre em contato com o suporte." }, { status: 403 });
    if (!rows[0].verified) return NextResponse.json({ error: "Confirme seu e-mail antes de entrar." }, { status: 403 });
    const response = NextResponse.json({ ok: true, user: { username: rows[0].username, email: rows[0].email } });
    return setUserCookie(response, String(rows[0].id));
  } catch { return NextResponse.json({ error: "Não foi possível entrar agora." }, { status: 500 }); }
}

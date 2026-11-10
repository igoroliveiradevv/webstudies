import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { ensureAccountTables, hashToken } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const generic = { ok: true, message: "Se existir uma conta verificada com esse e-mail, enviaremos um link para redefinir a senha." };
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "Serviço de e-mail indisponível." }, { status: 503 });
    const sql = await ensureAccountTables();
    const users = await sql`SELECT id FROM ritmo_users WHERE email = ${email} AND verified = TRUE LIMIT 1`;
    if (!users.length) return NextResponse.json(generic);
    const userId = String(users[0].id);
    const token = randomBytes(32).toString("hex");
    await sql`DELETE FROM ritmo_password_resets WHERE user_id = ${userId}::uuid`;
    await sql`INSERT INTO ritmo_password_resets (token_hash, user_id, expires_at)
      VALUES (${hashToken(token)}, ${userId}::uuid, NOW() + INTERVAL '30 minutes')`;
    const resetUrl = new URL("/redefinir-senha?token=" + token, request.url).toString();
    const from = process.env.RESEND_FROM || "Ritmo PAS <onboarding@resend.dev>";
    const mail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [email], subject: "Redefina sua senha · Ritmo PAS",
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#202334"><h1>Redefinir senha</h1><p>Recebemos um pedido para alterar a senha da sua conta Ritmo PAS.</p><p><a href="${resetUrl}" style="display:inline-block;padding:13px 20px;background:#8b6cf0;color:white;text-decoration:none;border-radius:8px">Criar nova senha</a></p><p>O link expira em 30 minutos. Se não foi você, ignore este e-mail.</p></div>`
      })
    });
    if (!mail.ok) return NextResponse.json({ error: "Não foi possível enviar o e-mail de redefinição." }, { status: 502 });
    return NextResponse.json(generic);
  } catch {
    return NextResponse.json({ error: "Não foi possível processar o pedido." }, { status: 500 });
  }
}

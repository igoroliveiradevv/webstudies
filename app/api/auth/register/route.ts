import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, ensureAccountTables, hashPassword, hashToken, passwordIsStrong, validUsername, currentUserId } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!validUsername(username)) return NextResponse.json({ error: "Username: use de 3 a 20 caracteres, apenas letras, números e _." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    if (!passwordIsStrong(password)) return NextResponse.json({ error: "A senha precisa ter 12–128 caracteres, maiúscula, minúscula, número e símbolo." }, { status: 400 });
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "O serviço de e-mail ainda não está configurado." }, { status: 503 });

    const sql = await ensureAccountTables();
    const id = randomUUID();
    const legacyId = currentUserId(request);
    const passwordHash = await hashPassword(password);
    try {
      await sql`INSERT INTO ritmo_users (id, username, email, password_hash, legacy_id)
        VALUES (${id}::uuid, ${username}, ${email}, ${passwordHash}, ${legacyId}::uuid)`;
    } catch {
      return NextResponse.json({ error: "Esse username ou e-mail já está em uso." }, { status: 409 });
    }

    const token = randomBytes(32).toString("hex");
    await sql`INSERT INTO ritmo_email_verifications (token_hash, user_id, expires_at)
      VALUES (${hashToken(token)}, ${id}::uuid, NOW() + INTERVAL '24 hours')`;
    const origin = new URL(request.url).origin;
    const verifyUrl = origin + "/api/auth/verify?token=" + token;
    const from = process.env.RESEND_FROM || "Ritmo PAS <onboarding@resend.dev>";
    const mail = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        from, to: [email], subject: "Confirme seu e-mail · Ritmo PAS",
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#202334"><h1>Bem-vindo ao Ritmo PAS!</h1><p>Falta só confirmar seu e-mail para ativar sua conta.</p><p><a href="${verifyUrl}" style="display:inline-block;padding:13px 20px;background:#8b6cf0;color:white;text-decoration:none;border-radius:8px">Confirmar meu e-mail</a></p><p>O link expira em 24 horas. Se você não criou esta conta, ignore esta mensagem.</p></div>`
      })
    });
    if (!mail.ok) {
      await sql`DELETE FROM ritmo_users WHERE id = ${id}::uuid`;
      return NextResponse.json({ error: "Não foi possível enviar o e-mail. Confira o domínio remetente configurado no Resend." }, { status: 502 });
    }
    return NextResponse.json({ ok: true, message: "Conta criada! Confira sua caixa de entrada para confirmar o e-mail." });
  } catch {
    return NextResponse.json({ error: "Não foi possível criar a conta agora." }, { status: 500 });
  }
}

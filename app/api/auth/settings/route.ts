import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { currentUserId, ensureAccountTables, hashPassword, hashToken, passwordIsStrong, validUsername, verifyPassword } from "@/lib/account";

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
    if (!process.env.RESEND_API_KEY) return NextResponse.json({ error: "O serviço de e-mail ainda não está configurado." }, { status: 503 });
    const sql = await ensureAccountTables();
    const rows = await sql`SELECT email, password_hash FROM ritmo_users WHERE id = ${id}::uuid AND verified = TRUE LIMIT 1`;
    if (!rows.length || !(await verifyPassword(currentPassword, String(rows[0].password_hash)))) return NextResponse.json({ error: "Senha atual incorreta." }, { status: 403 });
    const currentEmail = String(rows[0].email).toLowerCase();
    const emailChanged = email !== currentEmail;
    if (emailChanged) {
      const duplicate = await sql`SELECT id FROM ritmo_users WHERE LOWER(email) = ${email} AND id <> ${id}::uuid LIMIT 1`;
      if (duplicate.length) return NextResponse.json({ error: "Esse e-mail já está vinculado a outra conta." }, { status: 409 });
    }
    const passwordHash = newPassword ? await hashPassword(newPassword) : null;
    if (emailChanged) {
      const token = randomBytes(32).toString("hex");
      const origin = new URL(request.url).origin;
      const verifyUrl = origin + "/api/auth/verify?token=" + token;
      const from = process.env.RESEND_FROM || "Ritmo PAS <onboarding@resend.dev>";
      const mail = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from, to: [email], subject: "Confirme seu novo e-mail · Ritmo PAS",
          html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#202334"><h1>Confirme seu novo e-mail</h1><p>Recebemos uma solicitação para alterar o e-mail da sua conta Ritmo PAS.</p><p><a href="${verifyUrl}" style="display:inline-block;padding:13px 20px;background:#8b6cf0;color:white;text-decoration:none;border-radius:8px">Confirmar novo e-mail</a></p><p>O link expira em 24 horas. Até a confirmação, seu e-mail atual continua ativo.</p></div>`
        })
      });
      if (!mail.ok) return NextResponse.json({ error: "Não foi possível enviar a confirmação. Seu e-mail não foi alterado." }, { status: 502 });
      await sql`DELETE FROM ritmo_email_verifications WHERE user_id = ${id}::uuid`;
      await sql`INSERT INTO ritmo_email_verifications (token_hash, user_id, expires_at, pending_email)
        VALUES (${hashToken(token)}, ${id}::uuid, NOW() + INTERVAL '24 hours', ${email})`;
    }
    await sql`UPDATE ritmo_users SET username = ${username}, password_hash = COALESCE(${passwordHash}, password_hash) WHERE id = ${id}::uuid`;
    return NextResponse.json({
      ok: true,
      user: { username, email: currentEmail },
      message: emailChanged
        ? "Username e senha atualizados. Enviamos um link para o novo e-mail; ele só será alterado após a confirmação."
        : "Configurações atualizadas."
    });
  } catch {
    return NextResponse.json({ error: "Não foi possível atualizar sua conta agora." }, { status: 500 });
  }
}
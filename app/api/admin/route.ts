import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db, ensureAccountTables, hashPassword, passwordIsStrong, validUsername } from "@/lib/account";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const COOKIE = "ritmo_admin";
const signature = () => createHmac("sha256", process.env.AUTH_SECRET || "missing").update("ritmo-admin-session").digest("hex");
function isAdmin(request: NextRequest) {
  const value = request.cookies.get(COOKIE)?.value || "";
  const expected = Buffer.from(signature());
  const actual = Buffer.from(value);
  return Boolean(process.env.AUTH_SECRET && value && actual.length === expected.length && timingSafeEqual(actual, expected));
}
function unauthorized() { return NextResponse.json({ error: "Acesso administrativo não autorizado." }, { status: 401 }); }

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.action === "login") {
      const supplied = String(body.key || "");
      const configured = process.env.ADMIN_ACCESS_KEY || "";
      if (!configured || supplied.length !== configured.length || !timingSafeEqual(Buffer.from(supplied), Buffer.from(configured))) {
        return NextResponse.json({ error: "Credencial inválida." }, { status: 401 });
      }
      const response = NextResponse.json({ ok: true });
      response.cookies.set(COOKIE, signature(), { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api/admin", maxAge: 60 * 60 * 8 });
      return response;
    }
    if (body.action === "logout") {
      const response = NextResponse.json({ ok: true });
      response.cookies.set(COOKIE, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/api/admin", maxAge: 0 });
      return response;
    }
    if (!isAdmin(request)) return unauthorized();
    const sql = await ensureAccountTables();
    if (body.action === "user-status") {
      const status = body.status === "active" ? "active" : body.status === "blocked" ? "blocked" : body.status === "banned" ? "banned" : null;
      if (!status || !body.id) return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
      await sql`UPDATE ritmo_users SET account_status = ${status} WHERE id = ${String(body.id)}::uuid`;
      return NextResponse.json({ ok: true });
    }
    if (body.action === "create-user") {
      const username = String(body.username || "").trim();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");
      if (!validUsername(username)) return NextResponse.json({ error: "Username inválido (3–20 caracteres)." }, { status: 400 });
      if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) return NextResponse.json({ error: "E-mail inválido." }, { status: 400 });
      if (!passwordIsStrong(password)) return NextResponse.json({ error: "A senha precisa ter 12+ caracteres, maiúscula, minúscula, número e símbolo." }, { status: 400 });
      const id = randomUUID();
      await sql`INSERT INTO ritmo_users (id, username, email, password_hash, verified, account_status) VALUES (${id}::uuid, ${username}, ${email}, ${await hashPassword(password)}, TRUE, 'active')`;
      return NextResponse.json({ ok: true, id });
    }
    if (body.action === "announcement") {
      const title = String(body.title || "").trim();
      const message = String(body.message || "").trim();
      const duration = Math.min(604800, Math.max(5, Number(body.durationSeconds) || 30));
      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + duration * 1000);
      if (!title || title.length > 100 || !message || message.length > 1000) return NextResponse.json({ error: "Título (até 100) e mensagem (até 1000) são obrigatórios." }, { status: 400 });
      await sql`INSERT INTO ritmo_announcements (id, title, message, starts_at, ends_at, active) VALUES (${randomUUID()}::uuid, ${title}, ${message}, ${startsAt.toISOString()}::timestamptz, ${endsAt.toISOString()}::timestamptz, TRUE)`;
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Ação desconhecida." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("unique") || message.includes("duplicate")) return NextResponse.json({ error: "Username ou e-mail já cadastrado." }, { status: 409 });
    return NextResponse.json({ error: "Não foi possível concluir a operação." }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("public") === "1") {
    try {
      const sql = db();
      await sql`CREATE TABLE IF NOT EXISTS ritmo_announcements (id UUID PRIMARY KEY, title VARCHAR(100) NOT NULL, message VARCHAR(1000) NOT NULL, starts_at TIMESTAMPTZ NOT NULL, ends_at TIMESTAMPTZ NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE)`;
      const rows = await sql`SELECT id, title, message, ends_at FROM ritmo_announcements WHERE active = TRUE AND starts_at <= NOW() AND ends_at > NOW() ORDER BY starts_at DESC LIMIT 1`;
      return NextResponse.json({ announcement: rows[0] || null });
    } catch { return NextResponse.json({ announcement: null }); }
  }
  if (!isAdmin(request)) return unauthorized();
  try {
    const sql = await ensureAccountTables();
    const users = await sql`SELECT u.id, u.username, u.email, u.verified, u.account_status, u.created_at, d.updated_at AS last_activity FROM ritmo_users u LEFT JOIN ritmo_user_data d ON d.user_id = u.id ORDER BY u.created_at DESC LIMIT 500`;
    const counts = await sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE verified = TRUE)::int AS verified, COUNT(*) FILTER (WHERE account_status = 'blocked')::int AS blocked, COUNT(*) FILTER (WHERE account_status = 'banned')::int AS banned FROM ritmo_users`;
    const announcements = await sql`SELECT id, title, message, starts_at, ends_at, active FROM ritmo_announcements ORDER BY starts_at DESC LIMIT 20`;
    return NextResponse.json({ ok: true, users, counts: counts[0], announcements });
  } catch {
    return NextResponse.json({ error: "Falha ao consultar o banco. Atualize a página." }, { status: 503 });
  }
}

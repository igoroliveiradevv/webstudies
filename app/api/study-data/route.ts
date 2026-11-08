import { neon } from "@neondatabase/serverless";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE = "ritmo_uid";
const secret = () => process.env.AUTH_SECRET;
const sign = (id: string) => createHmac("sha256", secret()!).update(id).digest("hex");

function getUserId(request: NextRequest) {
  const value = request.cookies.get(COOKIE)?.value;
  if (!value || !secret()) return null;
  const [id, signature] = value.split(".");
  if (!id || !signature) return null;
  const expected = Buffer.from(sign(id), "hex");
  let received: Buffer;
  try { received = Buffer.from(signature, "hex"); } catch { return null; }
  return expected.length === received.length && timingSafeEqual(expected, received) ? id : null;
}

async function database() {
  const url = process.env.DATABASE_URL;
  if (!url || !secret()) throw new Error("Banco ou segredo não configurado.");
  const sql = neon(url);
  await sql`CREATE TABLE IF NOT EXISTS ritmo_user_data (
    user_id UUID PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{"subjects":[],"sessions":[]}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  return sql;
}

const validPayload = (data: unknown) => {
  if (!data || typeof data !== "object") return false;
  const value = data as {subjects?: unknown; sessions?: unknown};
  if (!Array.isArray(value.subjects) || !Array.isArray(value.sessions)) return false;
  if (value.subjects.length > 100 || value.sessions.length > 10000) return false;
  return value.subjects.every((s: any) =>
    s && typeof s.id === "string" && s.id.length <= 100 &&
    typeof s.name === "string" && s.name.trim().length > 0 && s.name.length <= 80 &&
    typeof s.color === "string" && /^#[0-9a-f]{6}$/i.test(s.color) &&
    Number.isFinite(s.goal) && s.goal >= 0 && s.goal <= 24
  ) && value.sessions.every((s: any) =>
    s && typeof s.id === "string" && s.id.length <= 100 &&
    typeof s.subjectId === "string" && s.subjectId.length <= 100 &&
    Number.isInteger(s.seconds) && s.seconds > 0 && s.seconds <= 86400 &&
    typeof s.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s.date)
  );
};

function attachCookie(response: NextResponse, id: string) {
  response.cookies.set(COOKIE, id + "." + sign(id), {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365
  });
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const sql = await database();
    const existing = getUserId(request);
    const id = existing ?? randomUUID();
    const rows = await sql`SELECT data FROM ritmo_user_data WHERE user_id = ${id}::uuid`;
    const response = NextResponse.json({
      ok: true,
      data: rows[0]?.data ?? { subjects: [], sessions: [] },
      saved: Boolean(rows[0])
    });
    return existing ? response : attachCookie(response, id);
  } catch {
    return NextResponse.json({ ok: false, error: "Não foi possível carregar seus dados." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const id = getUserId(request);
    if (!id) return NextResponse.json({ ok: false, error: "Sessão inválida. Atualize a página." }, { status: 401 });
    const data: unknown = await request.json();
    if (!validPayload(data)) return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
    const sql = await database();
    await sql`INSERT INTO ritmo_user_data (user_id, data, updated_at)
      VALUES (${id}::uuid, ${JSON.stringify(data)}::jsonb, NOW())
      ON CONFLICT (user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`;
    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ ok: false, error: "Não foi possível salvar seus dados." }, { status: 503 });
  }
}

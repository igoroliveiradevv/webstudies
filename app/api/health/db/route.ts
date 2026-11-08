import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    return NextResponse.json(
      { ok: false, banco: "não configurado", erro: "DATABASE_URL ausente" },
      { status: 503 }
    );
  }

  try {
    const sql = neon(connectionString);
    const rows = await sql`SELECT 1 AS conectado, current_timestamp AS verificado_em`;

    return NextResponse.json({
      ok: rows[0]?.conectado === 1,
      banco: "Neon Postgres",
      verificadoEm: rows[0]?.verificado_em,
    });
  } catch {
    return NextResponse.json(
      { ok: false, banco: "Neon Postgres", erro: "Não foi possível consultar o banco" },
      { status: 503 }
    );
  }
}

import { neon } from "@neondatabase/serverless";
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { NextRequest, NextResponse } from "next/server";

const scrypt = promisify(scryptCallback);
export const ACCOUNT_COOKIE = "ritmo_uid";

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL não configurada.");
  return neon(url);
}

export async function ensureAccountTables() {
  const sql = db();
  await sql`CREATE TABLE IF NOT EXISTS ritmo_users (
    id UUID PRIMARY KEY,
    username VARCHAR(24) NOT NULL UNIQUE,
    email VARCHAR(254) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    legacy_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS ritmo_users_username_lower_unique ON ritmo_users (LOWER(username))`;
  await sql`CREATE TABLE IF NOT EXISTS ritmo_user_data (
    user_id UUID PRIMARY KEY,
    data JSONB NOT NULL DEFAULT '{"subjects":[],"sessions":[]}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ritmo_password_resets (
    token_hash TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES ritmo_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
  )`;
  await sql`CREATE TABLE IF NOT EXISTS ritmo_email_verifications (
    token_hash TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES ritmo_users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
  )`;
  return sql;
}

export function signUserId(id: string) {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET não configurado.");
  return createHmac("sha256", secret).update(id).digest("hex");
}

export function setUserCookie(response: NextResponse, id: string) {
  response.cookies.set(ACCOUNT_COOKIE, id + "." + signUserId(id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
  return response;
}

export function currentUserId(request: NextRequest) {
  const value = request.cookies.get(ACCOUNT_COOKIE)?.value;
  if (!value || !process.env.AUTH_SECRET) return null;
  const [id, signature] = value.split(".");
  if (!id || !signature) return null;
  const expected = Buffer.from(signUserId(id), "hex");
  const received = Buffer.from(signature, "hex");
  return expected.length === received.length && timingSafeEqual(expected, received) ? id : null;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64) as Buffer;
  return salt.toString("hex") + ":" + derived.toString("hex");
}

export async function verifyPassword(password: string, stored: string) {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"), expected.length) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function passwordIsStrong(password: string) {
  return password.length >= 12 && password.length <= 128 &&
    /[a-z]/.test(password) && /[A-Z]/.test(password) &&
    /[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password);
}

export function hashToken(token: string) {
  return createHmac("sha256", process.env.AUTH_SECRET!).update(token).digest("hex");
}

export function validUsername(username: string) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

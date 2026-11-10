"use client";

import { useState } from "react";
import Link from "next/link";

export default function ContaPage() {
  const [mode, setMode] = useState<"register" | "login">("register");
  const [username, setUsername] = useState("igor0869");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/auth/" + (mode === "register" ? "register" : "login"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "register" ? { username, email, password } : { login: email, password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Algo deu errado.");
      if (mode === "register") {
        setMessage(result.message);
        setPassword("");
      } else {
        window.location.href = "/";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir.");
    } finally { setLoading(false); }
  }

  return <main className="accountPage">
    <section className="accountCard">
      <Link href="/" className="accountBrand">ritmo<span>.</span></Link>
      <p className="accountEyebrow">SUA PREPARAÇÃO, SALVA NA NUVEM</p>
      <h1>{mode === "register" ? "Crie sua conta" : "Que bom te ver de volta."}</h1>
      <p className="accountMuted">Acompanhe seu progresso em qualquer dispositivo.</p>
      <div className="accountTabs">
        <button className={mode === "register" ? "selected" : ""} onClick={() => {setMode("register");setError("");setMessage("");}}>Criar conta</button>
        <button className={mode === "login" ? "selected" : ""} onClick={() => {setMode("login");setError("");setMessage("");}}>Entrar</button>
      </div>
      <form onSubmit={submit}>
        {mode === "register" && <label>Username<input required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} placeholder="seu_usuario"/><small>3–20 caracteres: letras, números e _.</small></label>}
        <label>E-mail<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com"/></label>
        <label>Senha<input required type="password" autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder={mode === "register" ? "Crie uma senha forte" : "Sua senha"}/></label>
        {mode === "register" && <div className="passwordRules">A senha deve ter 12+ caracteres, letra maiúscula, minúscula, número e símbolo.</div>}
        {error && <div className="accountError">{error}</div>}
        {message && <div className="accountSuccess">{message}</div>}
        <button className="accountSubmit" disabled={loading}>{loading ? "Aguarde..." : mode === "register" ? "Criar conta" : "Entrar"}</button>
      </form>
      <p className="accountFoot">Ao criar sua conta, seu histórico de estudos deste dispositivo será associado a ela.</p>
      <Link href="/" className="backHome">← Voltar ao Ritmo PAS</Link>
    </section>
  </main>;
}

"use client";
import "./../conta/conta.css";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [username,setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [currentPassword,setCurrentPassword]=useState("");
  const [newPassword,setNewPassword]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  useEffect(()=>{fetch("/api/auth/me",{cache:"no-store"}).then(async r=>{const v=await r.json();if(!v.user){window.location.href="/conta";return;}setUsername(v.user.username);setEmail(v.user.email);}).catch(()=>setError("Não foi possível carregar sua conta.")).finally(()=>setLoading(false));},[]);
  async function save(e:React.FormEvent){e.preventDefault();setSaving(true);setError("");setMessage("");try{const r=await fetch("/api/auth/settings",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,email,currentPassword,newPassword})});const v=await r.json();if(!r.ok)throw new Error(v.error||"Falha ao salvar.");setMessage(v.message);setCurrentPassword("");setNewPassword("");}catch(err){setError(err instanceof Error?err.message:"Falha ao salvar.");}finally{setSaving(false);}}
  async function logout(){await fetch("/api/auth/logout",{method:"POST"});window.location.href="/";}
  return <main className="accountPage"><section className="accountCard"><Link href="/" className="accountBrand">ritmo<span>.</span></Link><p className="accountEyebrow">PERFIL E SEGURANÇA</p><h1>Configurações da conta</h1><p className="accountMuted">Atualize seus dados de acesso.</p>{loading?<p className="accountMuted">Carregando...</p>:<form onSubmit={save}><label>Username<input required minLength={3} maxLength={20} pattern="[A-Za-z0-9_]+" value={username} onChange={e=>setUsername(e.target.value)}/></label><label>E-mail<input required type="email" value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Nova senha <small>Deixe em branco para manter a atual.</small><input type="password" minLength={12} autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Digite uma nova senha"/></label><div className="passwordRules">Se alterar a senha: 12+ caracteres, maiúscula, minúscula, número e símbolo.</div><label>Senha atual <input required type="password" autoComplete="current-password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Confirme que é você"/></label>{error&&<div className="accountError">{error}</div>}{message&&<div className="accountSuccess">{message}</div>}<button className="accountSubmit" disabled={saving}>{saving?"Salvando...":"Salvar alterações"}</button></form>}<button className="accountSubmit" type="button" onClick={logout} style={{width:"100%",marginTop:12,background:"#343b4b"}}>Sair da conta</button><Link href="/" className="backHome">← Voltar ao Ritmo PAS</Link></section></main>;
}
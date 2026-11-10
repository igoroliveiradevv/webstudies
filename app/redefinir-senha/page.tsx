"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import "./auth-extra.css";

export default function ResetPasswordPage() {
  const [token,setToken]=useState("");
  useEffect(()=>{setToken(new URLSearchParams(window.location.search).get("token")||"");},[]);
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  async function submit(e:React.FormEvent){
    e.preventDefault();setError("");setMessage("");
    if(password!==confirm){setError("As senhas não coincidem.");return;}
    setLoading(true);
    try{
      const res=await fetch("/api/auth/reset-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,password})});
      const data=await res.json();if(!res.ok)throw new Error(data.error||"Não foi possível redefinir.");
      setMessage(data.message);setPassword("");setConfirm("");
    }catch(err){setError(err instanceof Error?err.message:"Erro inesperado.");}
    finally{setLoading(false);}
  }
  return <main className="accountPage"><section className="accountCard"><Link href="/" className="accountBrand">ritmo<span>.</span></Link><p className="accountEyebrow">SEGURANÇA DA CONTA</p><h1>Nova senha</h1><p className="accountMuted">Crie uma senha forte para voltar ao Ritmo PAS.</p>{!token?<div className="accountError">Link ausente. Solicite uma nova recuperação.</div>:<form onSubmit={submit}><label>Nova senha<input type="password" required minLength={12} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="12+ caracteres"/></label><label>Confirme a nova senha<input type="password" required minLength={12} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repita a senha"/></label><div className="passwordRules">Use maiúscula, minúscula, número e símbolo.</div>{error&&<div className="accountError">{error}</div>}{message&&<div className="accountSuccess">{message}</div>}<button className="accountSubmit" disabled={loading}>{loading?"Salvando...":"Alterar senha"}</button></form>}<Link href="/conta" className="backHome">← Voltar para entrar</Link></section></main>;
}

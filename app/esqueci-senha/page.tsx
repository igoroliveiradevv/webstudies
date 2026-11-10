"use client";
import { useState } from "react";
import Link from "next/link";
import "../conta/conta.css";

export default function ForgotPasswordPage() {
  const [email,setEmail]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  async function submit(e:React.FormEvent){
    e.preventDefault();setLoading(true);setError("");setMessage("");
    try{
      const res=await fetch("/api/auth/forgot-password",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
      const data=await res.json();if(!res.ok)throw new Error(data.error||"Não foi possível enviar.");
      setMessage(data.message);
    }catch(err){setError(err instanceof Error?err.message:"Erro inesperado.");}
    finally{setLoading(false);}
  }
  return <main className="accountPage"><section className="accountCard"><Link href="/" className="accountBrand">ritmo<span>.</span></Link><p className="accountEyebrow">RECUPERAÇÃO DE ACESSO</p><h1>Esqueceu a senha?</h1><p className="accountMuted">Informe o e-mail da sua conta. Vamos enviar um link seguro para criar outra senha.</p><form onSubmit={submit}><label>E-mail<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="voce@email.com"/></label>{error&&<div className="accountError">{error}</div>}{message&&<div className="accountSuccess">{message}</div>}<button className="accountSubmit" disabled={loading}>{loading?"Enviando...":"Enviar link de recuperação"}</button></form><Link href="/conta" className="backHome">← Voltar para entrar</Link></section></main>;
}

"use client";
import { useEffect, useState } from "react";
import { X, Megaphone } from "lucide-react";
type Notice={id:string;title:string;message:string;ends_at:string};
export default function AnnouncementPopup(){
 const [notice,setNotice]=useState<Notice|null>(null);
 const [visible,setVisible]=useState(false);
 useEffect(()=>{
  let active=true;
  const load=async()=>{try{const r=await fetch("/api/announcement",{cache:"no-store"});const v=await r.json();if(!active||!v.announcement)return;const n=v.announcement as Notice;if(localStorage.getItem("ritmo-dismissed-announcement")===n.id)return;setNotice(n);setVisible(true);}catch{}};
  load();const interval=setInterval(load,30000);return()=>{active=false;clearInterval(interval)};
 },[]);
 if(!notice||!visible)return null;
 return <div style={{position:"fixed",inset:0,zIndex:1000,background:"#05070bb8",display:"grid",placeItems:"center",padding:18}} role="dialog" aria-modal="true" aria-labelledby="announcement-title"><section style={{width:"min(460px,100%)",background:"#191e29",border:"1px solid #44395f",borderRadius:16,padding:25,boxShadow:"0 24px 90px #0009",position:"relative",color:"#f4f5f8"}}><button onClick={()=>{localStorage.setItem("ritmo-dismissed-announcement",notice.id);setVisible(false)}} aria-label="Fechar aviso" style={{position:"absolute",right:14,top:14,border:0,background:"transparent",color:"#9da7b6",cursor:"pointer"}}><X size={19}/></button><div style={{width:40,height:40,borderRadius:12,background:"#332b4b",color:"#c5b5ff",display:"grid",placeItems:"center",marginBottom:16}}><Megaphone size={20}/></div><p style={{fontSize:9,letterSpacing:1.5,color:"#b7a2ff",fontWeight:700}}>AVISO DA PLATAFORMA</p><h2 id="announcement-title" style={{font:"700 21px Manrope, sans-serif",margin:"8px 0 12px"}}>{notice.title}</h2><p style={{fontSize:13,lineHeight:1.7,color:"#b8c0cd",whiteSpace:"pre-wrap"}}>{notice.message}</p><button onClick={()=>{localStorage.setItem("ritmo-dismissed-announcement",notice.id);setVisible(false)}} style={{marginTop:12,width:"100%",border:0,borderRadius:8,padding:12,background:"#8b6cf0",color:"white",fontWeight:700,cursor:"pointer"}}>Entendi</button></section></div>;
}

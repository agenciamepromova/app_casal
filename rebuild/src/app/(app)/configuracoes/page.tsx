"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Database, LogOut, Monitor, Moon, Save, ShieldCheck, Sun, UserRound } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { useDemo } from "@/features/demo/demo-store";

const themeOptions = [
  { value: "dark", label: "Escuro", description: "Profundo e sofisticado", Icon: Moon },
  { value: "light", label: "Claro", description: "Leve e acolhedor", Icon: Sun },
  { value: "system", label: "Sistema", description: "Acompanha seu dispositivo", Icon: Monitor },
] as const;

export default function SettingsPage(){
  const {state,updateProfile,logout,setTheme,online}=useDemo(),router=useRouter();
  const [notice,setNotice]=useState("");
  const selectedTheme=state.user.theme??"system";
  async function profile(form:FormData){try{await updateProfile(String(form.get("name")));setNotice("Perfil salvo com sucesso.")}catch(caught){setNotice(caught instanceof Error?caught.message:"Não foi possível salvar.")}}
  async function leave(){await logout();router.push("/login")}
  return <><PageHeading eyebrow="PREFERÊNCIAS" title="Configurações" description="Ajuste sua experiência sem perder a simplicidade."/><div className="settings-grid"><aside className="settings-nav"><a href="#perfil" className="active"><UserRound/> Perfil</a><a href="#tema"><Moon/> Tema</a><a href="#seguranca"><ShieldCheck/> Segurança</a></aside><div className="settings-content"><section className="panel settings-section" id="perfil"><header><div><span className="eyebrow">IDENTIDADE</span><h2>Seu perfil</h2><p>Informações individuais da sua conta.</p></div><b className="member-avatar large-avatar">{state.user.name.slice(0,2).toUpperCase()}</b></header><form action={profile} className="form-grid"><label>Seu nome<input name="name" defaultValue={state.user.name} required/></label><label>Seu e-mail<input type="email" value={state.user.email} readOnly/></label>{notice?<div className="security-note full">{notice}</div>:null}<div className="form-actions full"><button className="primary-button"><Save/> Salvar alterações</button></div></form></section><section className="panel settings-section" id="tema"><header><div><span className="eyebrow">APARÊNCIA INDIVIDUAL</span><h2>Tema</h2><p>Sua escolha é salva no perfil e não altera a experiência do outro integrante.</p></div></header><div className="theme-options">{themeOptions.map(({value,label,description,Icon})=><button key={value} className={`theme-choice ${selectedTheme===value?"active":""}`} onClick={()=>void setTheme(value)} aria-pressed={selectedTheme===value}><span className="theme-choice-icon"><Icon/></span><span><strong>{label}</strong><small>{description}</small></span>{selectedTheme===value?<Check className="theme-check"/>:null}</button>)}</div></section><section className="panel settings-section" id="seguranca"><header><div><span className="eyebrow">{online?"DADOS ONLINE":"DEMONSTRAÇÃO"}</span><h2>{online?"Supabase conectado":"Dados locais"}</h2><p>{online?"Dados protegidos por autenticação e isolamento por household.":"Os dados permanecem somente neste navegador."}</p></div><Database/></header><div className="security-note"><ShieldCheck/><p><strong>Isolamento validado</strong><span>Usuários externos não podem ler ou alterar o espaço do casal.</span></p></div><div className="danger-actions"><button className="secondary-button danger" onClick={leave}><LogOut/> Sair da conta</button></div></section></div></div></>;
}

"use client";
import Link from "@/components/app/app-link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, LayoutDashboard, LogOut, Menu, ReceiptText } from "lucide-react";
import { useDemo } from "@/features/demo/demo-store";
import { ContextFilter, ContextProvider } from "./context-filter";
const nav = [{ href:"/dashboard", label:"Início", icon:LayoutDashboard },{ href:"/movimentacoes", label:"Dinheiro", icon:ReceiptText },{ href:"/agenda", label:"Agenda", icon:CalendarDays },{ href:"/mais", label:"Mais", icon:Menu }];
export function AppShell({ children }: { children:React.ReactNode }) {
  const rawPath=usePathname(),path=rawPath.replace(/^\/demo(?=\/|$)/,"")||"/dashboard",router=useRouter(),{state,logout,online}=useDemo();
  useEffect(()=>{if(online&&!state.session)router.replace("/login")},[online,router,state.session]);
  async function leave(){await logout();router.push("/login")}
  if(online&&!state.session)return <main className="page-loading">Redirecionando para o login...</main>;
  const links=nav.map(({href,label,icon:Icon})=><Link key={href} href={href} aria-current={path===href?"page":undefined} className={(href==="/mais"?!nav.slice(0,3).some(item=>item.href===path):path===href)?"active":""}><Icon/><span>{label}</span></Link>);
  return <ContextProvider><div className="app-shell"><aside className="sidebar"><div className="sidebar-logo"><span className="brand-mark">PA</span><strong>Plano a Dois</strong></div><p>{state.household.name}</p><nav aria-label="Principal">{links}</nav><button className="logout-button" onClick={leave}><LogOut/> Sair da conta</button></aside><div className="app-main"><header className="app-header"><strong>Plano a Dois</strong><div className="header-actions">{!online?<span className="demo-badge">Demo local • dados fictícios</span>:null}<Link href="/configuracoes" className="secondary-button">{state.user.name}</Link></div></header><main className="page-content">{!online?<div className="notice" role="note">Modo demonstração: dados fictícios só neste navegador, sem sincronização com o casal. <Link href="/login">Voltar ao login real</Link></div>:null}<ContextFilter/>{children}</main></div><nav className="mobile-nav" aria-label="Principal no celular">{links}</nav></div></ContextProvider>;
}
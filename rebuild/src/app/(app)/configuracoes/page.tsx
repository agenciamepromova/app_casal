"use client";
import { useRouter } from "next/navigation";
import { Bell, Database, LogOut, RotateCcw, Save, ShieldCheck, UserRound } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { useDemo } from "@/features/demo/demo-store";

export default function SettingsPage() {
  const { state, save, logout, reset } = useDemo(); const router = useRouter();
  function profile(formData: FormData) { save({ ...state, user: { name: String(formData.get("name")), email: String(formData.get("email")) }, household: { ...state.household, name: String(formData.get("household")) } }); }
  function leave() { logout(); router.push("/login"); }
  return <><PageHeading eyebrow="PREFERÊNCIAS" title="Configurações" description="Ajuste sua experiência sem perder a simplicidade." />
    <div className="settings-grid"><aside className="settings-nav"><a href="#perfil" className="active"><UserRound /> Perfil e espaço</a><a href="#notificacoes"><Bell /> Notificações</a><a href="#seguranca"><ShieldCheck /> Segurança</a><a href="#demo"><Database /> Dados locais</a></aside><div className="settings-content">
      <section className="panel settings-section" id="perfil"><header><div><span className="eyebrow">IDENTIDADE</span><h2>Perfil e espaço</h2><p>Como você e seu lar aparecem no Plano a Dois.</p></div><b className="member-avatar large-avatar">{state.user.name.slice(0, 2).toUpperCase()}</b></header><form action={profile} className="form-grid"><label>Seu nome<input name="name" defaultValue={state.user.name} required /></label><label>Seu e-mail<input name="email" type="email" defaultValue={state.user.email} required /></label><label className="full">Nome do espaço<input name="household" defaultValue={state.household.name} required /></label><div className="form-actions full"><button className="primary-button"><Save /> Salvar alterações</button></div></form></section>
      <section className="panel settings-section" id="notificacoes"><header><div><span className="eyebrow">COMUNICAÇÃO</span><h2>Notificações</h2><p>Escolha os lembretes que ajudam sem gerar ruído.</p></div></header><div className="toggle-list"><label><span><strong>Resumo semanal</strong><small>Uma visão curta do ritmo financeiro do casal.</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>Movimentações do parceiro</strong><small>Avise quando uma nova entrada ou saída for registrada.</small></span><input type="checkbox" defaultChecked /></label><label><span><strong>Progresso das metas</strong><small>Comemore cada marco importante juntos.</small></span><input type="checkbox" defaultChecked /></label></div></section>
      <section className="panel settings-section" id="seguranca"><header><div><span className="eyebrow">PRIVACIDADE</span><h2>Segurança</h2><p>Na versão conectada, cada dado será protegido por autenticação e isolamento por household.</p></div><ShieldCheck className="positive" /></header><div className="security-note"><ShieldCheck /><p><strong>Fundação validada</strong><span>Os testes locais de isolamento RLS da Fase 1 foram aprovados. Este modo demonstrativo não transmite dados.</span></p></div></section>
      <section className="panel settings-section" id="demo"><header><div><span className="eyebrow">MODO DEMONSTRAÇÃO</span><h2>Dados locais</h2><p>Tudo que você altera fica apenas neste navegador.</p></div><Database /></header><div className="danger-actions"><button className="secondary-button" onClick={() => confirm("Restaurar todos os dados da demonstração?") && reset()}><RotateCcw /> Restaurar demonstração</button><button className="secondary-button danger" onClick={leave}><LogOut /> Sair da conta</button></div></section>
    </div></div>
  </>;
}

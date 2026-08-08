"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarClock, Heart, Mail, ShieldAlert, Users } from "lucide-react";
import type { InvitationPreview } from "@/domain/types";
import { dateBR } from "@/lib/format";
import { acceptInvitation } from "@/app/aceitar-convite/actions";

const messages = {
  invalid:["Convite não encontrado","O link está incorreto ou foi substituído por um link mais recente."],
  expired:["Este convite venceu","Peça ao responsável pelo espaço para gerar um novo convite."],
  cancelled:["Este convite foi cancelado","Por segurança, somente um novo convite poderá liberar o acesso."],
  accepted:["Convite já utilizado","Este link já cumpriu sua finalidade e não pode ser usado por outra conta."],
} as const;

export function InvitationAcceptCard({preview,token,authenticatedEmail}:{preview:InvitationPreview;token:string;authenticatedEmail?:string}) {
  const router=useRouter();const[pending,startTransition]=useTransition();const[error,setError]=useState("");
  const next=`/aceitar-convite?token=${encodeURIComponent(token)}`;
  const authQuery=`next=${encodeURIComponent(next)}&email=${encodeURIComponent(preview.invitedEmail??"")}`;
  if(preview.status!=="pending") { const [title,description]=messages[preview.status];return <StateCard title={title} description={description}/> }
  const mismatch=Boolean(authenticatedEmail&&preview.invitedEmail&&authenticatedEmail.toLowerCase()!==preview.invitedEmail.toLowerCase());
  function accept(){setError("");startTransition(async()=>{const result=await acceptInvitation(token);if(!result.ok){setError(result.error??"Não foi possível aceitar o convite.");return}router.replace("/nosso-espaco");router.refresh()})}
  return <main className="invitation-page"><section className="invitation-card"><span className="brand-mark">PA</span><span className="eyebrow">CONVITE PARA O PLANO A DOIS</span><h1>{preview.inviterName} convidou você</h1><p>Entre no espaço <strong>{preview.householdName}</strong> para organizar decisões financeiras em conjunto.</p><div className="invitation-details"><span><Users/><b>Espaço</b><small>{preview.householdName}</small></span><span><Mail/><b>E-mail convidado</b><small>{preview.invitedEmail}</small></span><span><Heart/><b>Função</b><small>{preview.role==="admin"?"Administrador":"Integrante"}</small></span><span><CalendarClock/><b>Expiração</b><small>{preview.expiresAt?dateBR(preview.expiresAt):"—"}</small></span></div><div className="security-note"><ShieldAlert/><p><strong>Seus dados permanecem protegidos</strong><span>Nenhuma informação financeira é exibida antes do aceite.</span></p></div>{mismatch?<div className="inline-error">Este convite foi enviado para {preview.invitedEmail}. Você está conectado como {authenticatedEmail}.</div>:null}{error?<div className="inline-error">{error}</div>:null}{!authenticatedEmail?<div className="invitation-actions"><Link className="primary-button" href={`/login?${authQuery}`}>Já possui uma conta? Entrar para aceitar</Link><Link className="secondary-button" href={`/cadastro?${authQuery}`}>Primeiro acesso? Criar conta e aceitar</Link></div>:<button className="primary-button" disabled={pending||mismatch} onClick={accept}>{pending?"Confirmando...":"Aceitar convite"}</button>}</section></main>
}

function StateCard({title,description}:{title:string;description:string}){return <main className="invitation-page"><section className="invitation-card state"><ShieldAlert/><span className="eyebrow">PLANO A DOIS</span><h1>{title}</h1><p>{description}</p><Link className="primary-button" href="/login">Ir para o login</Link></section></main>}

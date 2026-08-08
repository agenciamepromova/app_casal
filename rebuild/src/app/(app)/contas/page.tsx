"use client";
import { useState } from "react";
import { Archive, Building2, Plus, WalletCards } from "lucide-react";
import { PageHeading } from "@/components/ui/page-heading";
import { Modal } from "@/components/ui/modal";
import { useDemo } from "@/features/demo/demo-store";
import { brl, uid } from "@/lib/format";

export default function AccountsPage() {
  const { state, addAccount, updateAccount } = useDemo();
  const [open, setOpen] = useState(false);
  const total = state.accounts.filter((account) => account.active).reduce((sum, account) => {
    const flow = state.transactions.filter((item) => item.accountId === account.id && item.status === "settled").reduce((value, item) => value + (item.type === "income" ? item.amountCents : -item.amountCents), 0);
    return sum + account.openingBalanceCents + flow;
  }, 0);
  async function submit(formData: FormData) {
    await addAccount({ id: uid(), name: String(formData.get("name")), kind: String(formData.get("kind")), openingBalanceCents: Math.round(Number(formData.get("balance")) * 100), color: String(formData.get("color")), active: true });
    setOpen(false);
  }
  return <>
    <PageHeading eyebrow="ORGANIZAÇÃO" title="Contas" description="Todos os lugares onde o dinheiro de vocês vive." action={<button className="primary-button compact" onClick={() => setOpen(true)}><Plus /> Nova conta</button>} />
    <section className="hero-balance"><div><span>Patrimônio disponível</span><strong>{brl(total)}</strong><p>Somado entre {state.accounts.filter((account) => account.active).length} contas ativas</p></div><WalletCards /></section>
    <section className="cards-grid">{state.accounts.map((account) => {
      const flow = state.transactions.filter((item) => item.accountId === account.id && item.status === "settled").reduce((value, item) => value + (item.type === "income" ? item.amountCents : -item.amountCents), 0);
      return <article className={`account-card ${account.active ? "" : "muted-card"}`} key={account.id}><header><i style={{ background: account.color }}><Building2 /></i><button className="icon-button" onClick={() => updateAccount({ ...account, active: !account.active })} aria-label={account.active ? "Arquivar conta" : "Reativar conta"}><Archive /></button></header><span>{account.kind}</span><h2>{account.name}</h2><strong>{brl(account.openingBalanceCents + flow)}</strong><footer><span className={account.active ? "status active" : "status"}>{account.active ? "Ativa" : "Arquivada"}</span><small>{state.transactions.filter((item) => item.accountId === account.id).length} movimentações</small></footer></article>;
    })}</section>
    <Modal open={open} onClose={() => setOpen(false)} title="Nova conta" subtitle="Inclua uma conta sem perder o histórico das demais."><form action={submit} className="form-grid"><label className="full">Nome<input name="name" required placeholder="Ex.: Conta conjunta" /></label><label>Tipo<select name="kind"><option>Conta corrente</option><option>Conta digital</option><option>Investimento</option><option>Dinheiro</option></select></label><label>Saldo inicial<input name="balance" type="number" min="0" step="0.01" defaultValue="0" /></label><label className="full">Cor<input name="color" type="color" defaultValue="#d8ab43" /></label><div className="form-actions full"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button">Criar conta</button></div></form></Modal>
  </>;
}

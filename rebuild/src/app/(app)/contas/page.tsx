"use client";

import { useState } from "react";
import { Archive, Building2, Edit3, Plus, WalletCards } from "lucide-react";
import type { Account } from "@/domain/types";
import { PageHeading } from "@/components/ui/page-heading";
import { Modal } from "@/components/ui/modal";
import { useDemo } from "@/features/demo/demo-store";
import { inputToCents } from "@/lib/money/input";
import { brl, uid } from "@/lib/format";

const accountKindLabel: Record<string, string> = {
  checking: "Conta corrente",
  savings: "Poupança",
  investment: "Investimento",
  cash: "Dinheiro",
};

export default function AccountsPage() {
  const { state, addAccount, updateAccount } = useDemo();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Account>();
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const activeAccounts = state.accounts.filter((account) => account.active);
  const total = activeAccounts.reduce((sum, account) => {
    const flow = state.transactions
      .filter((item) => item.accountId === account.id && item.status === "settled")
      .reduce((value, item) => value + (item.type === "income" ? item.amountCents : -item.amountCents), 0);
    return sum + account.openingBalanceCents + flow;
  }, 0);

  function close() {
    setOpen(false);
    setEditing(undefined);
    setError("");
  }

  async function submit(formData: FormData) {
    setError("");
    try {
      const account: Account = {
        id: editing?.id ?? uid(),
        name: String(formData.get("name") ?? "").trim(),
        kind: String(formData.get("kind")),
        openingBalanceCents: inputToCents(String(formData.get("balance") ?? "0")),
        color: String(formData.get("color")),
        active: editing?.active ?? true,
      };
      if (editing) await updateAccount(account);
      else await addAccount(account);
      setNotice(editing ? "Conta atualizada com sucesso." : "Conta criada com sucesso.");
      close();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Não foi possível salvar a conta.");
    }
  }

  async function toggleAccount(account: Account) {
    const linkedTransactions = state.transactions.filter((item) => item.accountId === account.id).length;
    if (account.active && linkedTransactions > 0 && !window.confirm(`Arquivar esta conta? As ${linkedTransactions} movimentações vinculadas serão preservadas.`)) return;
    await updateAccount({ ...account, active: !account.active });
    setNotice(account.active ? "Conta arquivada sem apagar o histórico." : "Conta reativada.");
  }

  return <>
    <PageHeading eyebrow="ORGANIZAÇÃO" title="Contas" description="Todos os lugares onde o dinheiro de vocês vive." action={<button className="primary-button compact" onClick={() => setOpen(true)}><Plus /> Nova conta</button>} />
    {notice ? <div className="notice success" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Fechar mensagem">×</button></div> : null}
    <section className="hero-balance"><div><span>Patrimônio disponível</span><strong>{brl(total)}</strong><p>Somado entre {activeAccounts.length} {activeAccounts.length === 1 ? "conta ativa" : "contas ativas"}</p></div><WalletCards /></section>
    <section className="cards-grid">{state.accounts.map((account) => {
      const linkedTransactions = state.transactions.filter((item) => item.accountId === account.id);
      const flow = linkedTransactions.filter((item) => item.status === "settled").reduce((value, item) => value + (item.type === "income" ? item.amountCents : -item.amountCents), 0);
      return <article className={`account-card ${account.active ? "" : "muted-card"}`} key={account.id}>
        <header><i style={{ background: account.color }}><Building2 /></i><span className="row-actions"><button onClick={() => { setEditing(account); setOpen(true); }} aria-label={`Editar ${account.name}`}><Edit3 /></button><button onClick={() => void toggleAccount(account)} aria-label={account.active ? `Arquivar ${account.name}` : `Reativar ${account.name}`}><Archive /></button></span></header>
        <span>{accountKindLabel[account.kind] ?? account.kind}</span><h2>{account.name}</h2><strong>{brl(account.openingBalanceCents + flow)}</strong>
        <footer><span className={account.active ? "status active" : "status"}>{account.active ? "Ativa" : "Arquivada"}</span><small>{linkedTransactions.length} {linkedTransactions.length === 1 ? "movimentação" : "movimentações"}</small></footer>
      </article>;
    })}</section>
    <Modal open={open} onClose={close} title={editing ? "Editar conta" : "Nova conta"} subtitle="O histórico financeiro será sempre preservado.">
      <form action={submit} className="form-grid">
        <label className="full">Nome<input name="name" required placeholder="Ex.: Conta conjunta" defaultValue={editing?.name} /></label>
        <label>Tipo<select name="kind" defaultValue={editing?.kind}><option value="checking">Conta corrente</option><option value="digital">Conta digital</option><option value="investment">Investimento</option><option value="cash">Dinheiro</option></select></label>
        <label>Saldo inicial<input name="balance" inputMode="decimal" defaultValue={editing ? (editing.openingBalanceCents / 100).toFixed(2).replace(".", ",") : "0,00"} /></label>
        <label className="full">Cor<input name="color" type="color" defaultValue={editing?.color ?? "#d8ab43"} /></label>
        {error ? <div className="inline-error full" role="alert">{error}</div> : null}
        <div className="form-actions full"><button type="button" className="secondary-button" onClick={close}>Cancelar</button><button className="primary-button">{editing ? "Salvar alterações" : "Criar conta"}</button></div>
      </form>
    </Modal>
  </>;
}

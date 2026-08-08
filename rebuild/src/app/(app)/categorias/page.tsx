"use client";
import { useState } from "react";
import { Archive, Palette, Plus } from "lucide-react";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Modal } from "@/components/ui/modal";
import { PageHeading } from "@/components/ui/page-heading";
import { useDemo } from "@/features/demo/demo-store";
import { brl, uid } from "@/lib/format";

export default function CategoriesPage() {
  const { state, addCategory, updateCategory } = useDemo();
  const [open, setOpen] = useState(false);
  async function submit(formData: FormData) { await addCategory({ id: uid(), name: String(formData.get("name")), type: formData.get("type") as "income" | "expense", icon: "auto", color: String(formData.get("color")), active: true }); setOpen(false); }
  return <><PageHeading eyebrow="SEU JEITO DE ORGANIZAR" title="Categorias" description="Entenda os hábitos de vocês sem transformar a vida em planilha." action={<button className="primary-button compact" onClick={() => setOpen(true)}><Plus /> Nova categoria</button>} />
    {(["expense", "income"] as const).map((type) => <section className="category-section" key={type}><div className="section-title"><div><span className="eyebrow">{type === "expense" ? "SAÍDAS" : "ENTRADAS"}</span><h2>{type === "expense" ? "Categorias de despesas" : "Categorias de receitas"}</h2></div><span>{state.categories.filter((item) => item.type === type).length} categorias</span></div><div className="category-cards">{state.categories.filter((item) => item.type === type).map((category) => { const value = state.transactions.filter((item) => item.categoryId === category.id).reduce((sum, item) => sum + item.amountCents, 0); return <article className={category.active ? "" : "muted-card"} key={category.id}><CategoryIcon name={category.name} type={category.type} color={category.color}/><div><h3>{category.name}</h3><span>{state.transactions.filter((item) => item.categoryId === category.id).length} lançamentos · {brl(value)}</span></div><button onClick={() => updateCategory({ ...category, active: !category.active })} aria-label={category.active ? "Arquivar categoria" : "Reativar categoria"}><Archive /></button></article>; })}</div></section>)}
    <Modal open={open} onClose={() => setOpen(false)} title="Nova categoria" subtitle="Crie uma classificação que faça sentido para a rotina de vocês."><form action={submit} className="form-grid"><label className="full">Nome<input name="name" required placeholder="Ex.: Pets" /></label><label>Tipo<select name="type"><option value="expense">Despesa</option><option value="income">Receita</option></select></label><label>Cor<span className="color-field"><Palette/><input name="color" type="color" defaultValue="#d8ab43" /></span></label><p className="form-hint full">O ícone é escolhido automaticamente de acordo com o nome da categoria.</p><div className="form-actions full"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancelar</button><button className="primary-button">Criar categoria</button></div></form></Modal>
  </>;
}

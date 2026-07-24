'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { LogOut, Trash2, WalletCards } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Transaction = { id:string; type:'income'|'expense'; amount:number; description:string; transaction_date:string; category_id:string|null; accounts?:{name:string}|null; categories?:{name:string}|null }
type Account={id:string;name:string}; type Category={id:string;name:string;type:'income'|'expense'}
const money=(v:number)=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)

export default function Dashboard(){
 const router=useRouter(); const [loading,setLoading]=useState(true); const [householdId,setHouseholdId]=useState(''); const [householdName,setHouseholdName]=useState('Nosso casal'); const [transactions,setTransactions]=useState<Transaction[]>([]); const [accounts,setAccounts]=useState<Account[]>([]); const [categories,setCategories]=useState<Category[]>([]); const [error,setError]=useState(''); const [type,setType]=useState<'income'|'expense'>('expense')
 const load=useCallback(async()=>{ setError(''); const {data:{user}}=await supabase.auth.getUser(); if(!user){router.replace('/login');return}
  const {data:membership,error:memberError}=await supabase.from('household_members').select('household_id, households(name)').eq('user_id',user.id).limit(1).single(); if(memberError||!membership){setError('Não foi possível localizar o espaço do casal. Execute o SQL de configuração no Supabase.');setLoading(false);return}
  const hid=membership.household_id as string; setHouseholdId(hid); const h=membership.households as unknown as {name:string}|null; setHouseholdName(h?.name||'Nosso casal')
  const [{data:acc},{data:cat},{data:tx,error:txError}]=await Promise.all([
   supabase.from('accounts').select('id,name').eq('household_id',hid).eq('active',true).order('name'),
   supabase.from('categories').select('id,name,type').eq('household_id',hid).eq('active',true).order('name'),
   supabase.from('transactions').select('id,type,amount,description,transaction_date,category_id,accounts(name),categories(name)').eq('household_id',hid).order('transaction_date',{ascending:false}).order('created_at',{ascending:false})
  ]); if(txError)setError(txError.message); setAccounts((acc||[]) as Account[]); setCategories((cat||[]) as Category[]); setTransactions((tx||[]) as unknown as Transaction[]); setLoading(false)
 },[router])
 useEffect(()=>{load()},[load])
 const totals=useMemo(()=>{const income=transactions.filter(t=>t.type==='income').reduce((s,t)=>s+Number(t.amount),0);const expense=transactions.filter(t=>t.type==='expense').reduce((s,t)=>s+Number(t.amount),0);return{income,expense,balance:income-expense}},[transactions])
 async function add(e:FormEvent<HTMLFormElement>){e.preventDefault();setError('');const form=new FormData(e.currentTarget);const {data:{user}}=await supabase.auth.getUser();if(!user)return;const payload={household_id:householdId,created_by:user.id,type,amount:Number(String(form.get('amount')).replace(',','.')),description:String(form.get('description')),account_id:String(form.get('account_id')),category_id:String(form.get('category_id')),transaction_date:String(form.get('transaction_date'))};const {error}=await supabase.from('transactions').insert(payload);if(error){setError(error.message);return}(e.target as HTMLFormElement).reset();await load()}
 async function remove(id:string){if(!confirm('Excluir esta movimentação?'))return;const {error}=await supabase.from('transactions').delete().eq('id',id);if(error)setError(error.message);else load()}
 async function logout(){await supabase.auth.signOut();router.replace('/login')}
 if(loading)return <main className="center-screen"><div className="loader"/></main>
 return <main className="app"><header className="topbar"><div className="brand">PLANO A DOIS</div><div className="top-actions"><span style={{color:'var(--muted)',fontSize:14}}>{householdName}</span><button className="btn btn-secondary" onClick={logout}><LogOut size={16}/></button></div></header><div className="container">
  <div className="hello"><div><h1>Caixa do casal</h1><p>Registrem tudo que entra e sai. O saldo é atualizado automaticamente.</p></div><WalletCards size={38} color="var(--accent)"/></div>
  {error&&<div className="message error">{error}</div>}
  <section className="grid-cards"><article className="metric"><span>Saldo atual</span><strong>{money(totals.balance)}</strong></article><article className="metric"><span>Entradas</span><strong className="positive">{money(totals.income)}</strong></article><article className="metric"><span>Saídas</span><strong className="negative">{money(totals.expense)}</strong></article><article className="metric"><span>Movimentações</span><strong>{transactions.length}</strong></article></section>
  <section className="section"><div className="section-head"><h3>Novo lançamento</h3></div><form className="transaction-form" onSubmit={add}>
   <div className="field"><label>Tipo</label><select className="select" value={type} onChange={e=>setType(e.target.value as 'income'|'expense')}><option value="expense">Saída</option><option value="income">Entrada</option></select></div>
   <div className="field"><label>Valor</label><input className="input" name="amount" inputMode="decimal" placeholder="0,00" required/></div>
   <div className="field wide"><label>Descrição</label><input className="input" name="description" placeholder="Ex.: Supermercado" required/></div>
   <div className="field"><label>Conta</label><select className="select" name="account_id" required>{accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
   <div className="field"><label>Categoria</label><select className="select" name="category_id" required>{categories.filter(c=>c.type===type).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
   <div className="field"><label>Data</label><input className="input" type="date" name="transaction_date" defaultValue={new Date().toISOString().slice(0,10)} required/></div>
   <div className="field" style={{alignSelf:'end'}}><button className="btn btn-primary">Salvar movimentação</button></div>
  </form></section>
  <section className="section"><div className="section-head"><h3>Histórico</h3><span style={{color:'var(--muted)',fontSize:14}}>{transactions.length} registros</span></div><div className="transactions">{transactions.length===0?<div className="empty">Nenhuma movimentação ainda.</div>:transactions.map(t=><div className="tx" key={t.id}><div><div className="tx-title">{t.description}</div><div className="tx-meta">{new Date(`${t.transaction_date}T12:00:00`).toLocaleDateString('pt-BR')} · {t.categories?.name||'Sem categoria'} · {t.accounts?.name||'Conta'}</div></div><div className={`amount ${t.type==='income'?'positive':'negative'}`}>{t.type==='income'?'+':'-'} {money(Number(t.amount))}</div><button className="icon-btn" onClick={()=>remove(t.id)} aria-label="Excluir"><Trash2 size={17}/></button></div>)}</div></section>
 </div></main>
}

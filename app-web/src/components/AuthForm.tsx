'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Props = { mode: 'login' | 'signup' }

export function AuthForm({ mode }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setLoading(true); setMessage(''); setIsError(false)
    const form = new FormData(e.currentTarget)
    const email = String(form.get('email') || '').trim()
    const password = String(form.get('password') || '')
    const fullName = String(form.get('fullName') || '').trim()
    const householdName = String(form.get('householdName') || '').trim()

    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, household_name: householdName } } })

    setLoading(false)
    if (result.error) { setIsError(true); setMessage(result.error.message); return }
    if (mode === 'signup' && !result.data.session) {
      setMessage('Cadastro criado. Confirme seu e-mail para entrar.'); return
    }
    router.replace('/dashboard'); router.refresh()
  }

  return <div className="auth-shell">
    <section className="auth-art"><div className="brand">PLANO A DOIS</div><h1>Construam o futuro com decisões reais.</h1><p>Um lugar compartilhado para acompanhar o caixa, organizar escolhas e transformar planos em patrimônio.</p></section>
    <section className="auth-panel"><form className="card" onSubmit={submit}>
      <div className="brand">Plano a Dois</div><h2>{mode === 'login' ? 'Bem-vindos' : 'Criar espaço do casal'}</h2><p className="sub">{mode === 'login' ? 'Acesse sua vida financeira compartilhada.' : 'Comecem a organizar as finanças em poucos minutos.'}</p>
      {mode === 'signup' && <><div className="field"><label>Seu nome</label><input className="input" name="fullName" required /></div><div className="field"><label>Nome do espaço</label><input className="input" name="householdName" placeholder="Ex.: Nikson e Brenda" required /></div></>}
      <div className="field"><label>E-mail</label><input className="input" type="email" name="email" required /></div>
      <div className="field"><label>Senha</label><input className="input" type="password" name="password" minLength={6} required /></div>
      <button className="btn btn-primary" disabled={loading}>{loading ? 'Aguarde...' : mode === 'login' ? 'Entrar' : 'Criar conta'}</button>
      {message && <div className={`message ${isError ? 'error' : 'success'}`}>{message}</div>}
      <p className="sub" style={{marginTop:18,marginBottom:0}}>{mode === 'login' ? <>Ainda não tem conta? <Link className="link" href="/cadastro">Criar agora</Link></> : <>Já possui conta? <Link className="link" href="/login">Entrar</Link></>}</p>
    </form></section>
  </div>
}

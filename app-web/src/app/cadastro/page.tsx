import { AuthForm } from '@/components/AuthForm'
import { Suspense } from 'react'
export default function CadastroPage(){ return <Suspense fallback={<main className="center-screen"><div className="loader" /></main>}><AuthForm mode="signup" /></Suspense> }

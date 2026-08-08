import { AuthForm } from '@/components/AuthForm'
import { Suspense } from 'react'
export default function LoginPage(){ return <Suspense fallback={<main className="center-screen"><div className="loader" /></main>}><AuthForm mode="login" /></Suspense> }

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDemo } from "@/features/demo/demo-store";
export default function Home(){const{state,ready}=useDemo(),router=useRouter();useEffect(()=>{if(ready)router.replace(state.session?(state.onboarded?"/dashboard":"/onboarding"):"/login")},[ready,router,state.onboarded,state.session]);return <main className="splash"><div className="brand-mark">PA</div><div className="loader"/><p>Preparando o espaço de vocês...</p></main>}

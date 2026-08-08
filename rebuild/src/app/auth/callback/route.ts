import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth-flow";

export async function GET(request: Request) {
  const url=new URL(request.url); const code=url.searchParams.get("code"); const next=safeNext(url.searchParams.get("next")??undefined)??"/dashboard";
  if(code){const supabase=await createSupabaseServerClient();const{error}=await supabase.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL(next,url.origin))}
  const failure=new URL("/login",url.origin);failure.searchParams.set("error","Não foi possível confirmar seu acesso. Solicite um novo link.");failure.searchParams.set("next",next);return NextResponse.redirect(failure);
}

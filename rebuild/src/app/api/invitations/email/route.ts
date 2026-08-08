import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request:NextRequest){
  const supabase=await createSupabaseServerClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({sent:false,error:"Não autenticado"},{status:401});
  const body=await request.json() as {invitationId?:string;token?:string};
  if(!body.invitationId||!body.token||body.token.length<32)return NextResponse.json({sent:false,error:"Convite inválido"},{status:400});
  const {data:invitation}=await supabase.from("household_invitations").select("email_normalized,household_id,households(name)").eq("id",body.invitationId).eq("status","pending").single();
  if(!invitation)return NextResponse.json({sent:false,error:"Convite não encontrado"},{status:404});
  const apiKey=process.env.RESEND_API_KEY,from=process.env.INVITATION_EMAIL_FROM;
  if(!apiKey||!from)return NextResponse.json({sent:false,reason:"email_not_configured"});
  const household=invitation.households as unknown as {name?:string}|null;
  const link=`${request.nextUrl.origin}/aceitar-convite?token=${encodeURIComponent(body.token)}`;
  const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:`Bearer ${apiKey}`,"content-type":"application/json"},body:JSON.stringify({from,to:[invitation.email_normalized],subject:`Convite para ${household?.name??"Plano a Dois"}`,html:`<h2>Você recebeu um convite</h2><p>Abra o link seguro para conhecer e aceitar o convite.</p><p><a href="${link}">Ver convite</a></p><p>Este link expira em sete dias.</p>`})});
  if(!response.ok)return NextResponse.json({sent:false,error:"Falha no provedor de e-mail"},{status:502});
  return NextResponse.json({sent:true});
}

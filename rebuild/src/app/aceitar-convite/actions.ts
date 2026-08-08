"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AcceptInvitationResult = { ok: boolean; error?: string };

export async function acceptInvitation(token: string): Promise<AcceptInvitationResult> {
  if (!token || token.length < 32) return { ok:false, error:"Este link de convite é inválido." };
  const supabase = await createSupabaseServerClient();
  const { data:{ user } } = await supabase.auth.getUser();
  if (!user) return { ok:false, error:"Entre na sua conta antes de aceitar o convite." };
  const { data, error } = await supabase.rpc("accept_invitation", { p_token:token });
  if (error) return { ok:false, error:error.message };
  if (!data) return { ok:false, error:"Este convite venceu e não pode mais ser aceito." };
  return { ok:true };
}

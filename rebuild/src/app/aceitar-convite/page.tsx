import type { InvitationPreview } from "@/domain/types";
import { InvitationAcceptCard } from "@/components/invitations/invitation-accept-card";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AcceptInvitationPage({searchParams}:{searchParams:Promise<{token?:string}>}) {
  const token=(await searchParams).token?.trim()??"";
  const supabase=await createSupabaseServerClient();
  const [{data:rows,error},{data:{user}}]=await Promise.all([
    supabase.rpc("preview_invitation",{p_token:token}),
    supabase.auth.getUser(),
  ]);
  const row=(rows as Record<string,unknown>[]|null)?.[0];
  const preview:InvitationPreview=error||!row?{status:"invalid"}:{status:String(row.invitation_status) as InvitationPreview["status"],inviterName:String(row.inviter_name??""),householdName:String(row.household_name??""),role:row.invited_role as InvitationPreview["role"],invitedEmail:String(row.invited_email??""),expiresAt:String(row.expires_at??"")};
  return <InvitationAcceptCard preview={preview} token={token} authenticatedEmail={user?.email}/>;
}

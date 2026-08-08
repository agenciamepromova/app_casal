-- Rollback estrutural da migration 003.
-- Requer backup anterior. Aceites de convite, alteracoes de membership,
-- mudancas de household ativo e a conversao viewer -> member nao podem ser
-- reconstruidos com fidelidade por este script sem restaurar o backup.
-- Este rollback nao exclui dados financeiros, households ou usuarios.

begin;

drop policy if exists "admins_view_invitations" on public.household_invitations;
drop policy if exists "profiles_household_members" on public.profiles;

drop function if exists public.set_active_household(uuid);
drop function if exists public.get_active_household();
drop function if exists public.is_household_admin(uuid);
drop function if exists public.create_household_invitation(uuid, text, text);
drop function if exists public.cancel_household_invitation(uuid);
drop function if exists public.get_household_invitation(uuid);

-- As definicoes anteriores de accept_household_invitation e handle_new_user
-- devem ser restauradas a partir de 002 e 001, respectivamente, ou do backup.
-- Nao removemos active_household_id automaticamente para evitar perda de estado.

drop index if exists public.household_invitations_invited_by_idx;
drop index if exists public.household_invitations_accepted_by_idx;
drop index if exists public.households_owner_id_idx;
drop index if exists public.transactions_account_id_idx;
drop index if exists public.transactions_category_id_idx;
drop index if exists public.transactions_created_by_idx;
drop index if exists public.profiles_active_household_id_idx;

commit;

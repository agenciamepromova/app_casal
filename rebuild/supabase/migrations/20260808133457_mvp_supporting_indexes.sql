-- Foreign-key indexes used by authorization checks and household-scoped queries.
-- This migration is data-preserving and can be applied repeatedly by local resets.
create index if not exists household_invitations_invited_by_idx
  on public.household_invitations (invited_by);

create index if not exists household_invitations_accepted_by_idx
  on public.household_invitations (accepted_by);

create index if not exists profiles_active_household_id_idx
  on public.profiles (active_household_id)
  where active_household_id is not null;

create index if not exists projects_created_by_idx
  on public.projects (created_by);

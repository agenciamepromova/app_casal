-- Household ativo determinístico, roles compatíveis e convites seguros.
alter table public.profiles add column if not exists active_household_id uuid references public.households(id) on delete set null;
update public.household_invitations set role='member' where role='viewer';
alter table public.household_invitations drop constraint if exists household_invitations_role_check;
alter table public.household_invitations add constraint household_invitations_role_check check(role in ('admin','member'));

create or replace function public.is_household_admin(target_household uuid) returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from household_members where household_id=target_household and user_id=auth.uid() and status='active' and role in ('owner','admin'));
$$;

create or replace function public.get_active_household() returns table(household_id uuid,household_name text,member_role text) language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_household uuid;
begin
 if v_user is null then raise exception 'Usuário não autenticado.'; end if;
 select active_household_id into v_household from profiles where id=v_user;
 if not exists(select 1 from household_members where household_id=v_household and user_id=v_user and status='active') then
  select hm.household_id into v_household from household_members hm where hm.user_id=v_user and hm.status='active' order by (hm.role='owner') desc,hm.created_at,hm.household_id limit 1;
  update profiles set active_household_id=v_household where id=v_user;
 end if;
 return query select h.id,h.name,hm.role from households h join household_members hm on hm.household_id=h.id where h.id=v_household and hm.user_id=v_user and hm.status='active';
end; $$;

create or replace function public.create_household_invitation(p_household_id uuid,p_email text,p_role text default 'member') returns table(id uuid,token uuid,expires_at timestamptz) language plpgsql security definer set search_path=public as $$
declare v_email text:=lower(trim(p_email));
begin
 if not is_household_admin(p_household_id) then raise exception 'Somente o responsável ou administrador pode convidar.'; end if;
 if v_email='' or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then raise exception 'Digite um e-mail válido.'; end if;
 if p_role not in ('admin','member') then raise exception 'Papel inválido.'; end if;
 if exists(select 1 from household_members hm join auth.users u on u.id=hm.user_id where hm.household_id=p_household_id and hm.status='active' and lower(u.email)=v_email) then raise exception 'Este e-mail já pertence ao espaço.'; end if;
 return query insert into household_invitations(household_id,email,role,invited_by) values(p_household_id,v_email,p_role,auth.uid()) returning household_invitations.id,household_invitations.token,household_invitations.expires_at;
exception when unique_violation then raise exception 'Já existe um convite pendente para este e-mail.';
end; $$;

create or replace function public.cancel_household_invitation(p_invitation_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare v_household uuid;
begin
 select household_id into v_household from household_invitations where id=p_invitation_id and status='pending';
 if v_household is null then raise exception 'Convite não encontrado ou já utilizado.'; end if;
 if not is_household_admin(v_household) then raise exception 'Você não pode cancelar este convite.'; end if;
 update household_invitations set status='cancelled' where id=p_invitation_id;
end; $$;

create or replace function public.get_household_invitation(p_token uuid) returns table(invitation_id uuid,household_id uuid,household_name text,email text,role text,status text,expires_at timestamptz) language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null then raise exception 'Entre ou crie uma conta para consultar o convite.'; end if;
 return query select i.id,i.household_id,h.name,i.email,i.role,i.status,i.expires_at from household_invitations i join households h on h.id=i.household_id where i.token=p_token and lower(i.email)=lower(coalesce(auth.jwt()->>'email',''));
 if not found then raise exception 'Convite não encontrado ou vinculado a outro e-mail.'; end if;
end; $$;

create or replace function public.accept_household_invitation(p_token uuid) returns uuid language plpgsql security definer set search_path=public as $$
declare i household_invitations%rowtype; v_user uuid:=auth.uid(); v_email text:=lower(coalesce(auth.jwt()->>'email','')); v_auto uuid;
begin
 if v_user is null then raise exception 'Usuário não autenticado.'; end if;
 select * into i from household_invitations where token=p_token for update;
 if not found then raise exception 'Convite não encontrado.'; end if;
 if lower(i.email)<>v_email then raise exception 'Este convite pertence a outro e-mail.'; end if;
 if i.status='accepted' and i.accepted_by=v_user then update profiles set active_household_id=i.household_id where id=v_user; return i.household_id; end if;
 if i.status<>'pending' then raise exception 'Este convite já foi utilizado ou cancelado.'; end if;
 if i.expires_at<=now() then update household_invitations set status='expired' where id=i.id; raise exception 'Este convite expirou.'; end if;
 select h.id into v_auto from households h where h.owner_id=v_user and h.id<>i.household_id and not exists(select 1 from transactions t where t.household_id=h.id) and not exists(select 1 from household_members m where m.household_id=h.id and m.user_id<>v_user) order by h.created_at desc limit 1;
 insert into household_members(household_id,user_id,role,status) values(i.household_id,v_user,i.role,'active') on conflict(household_id,user_id) do update set role=excluded.role,status='active';
 update household_invitations set status='accepted',accepted_by=v_user,accepted_at=now() where id=i.id;
 update profiles set active_household_id=i.household_id where id=v_user;
 if v_auto is not null then delete from households where id=v_auto; end if;
 return i.household_id;
end; $$;

-- Atualiza o trigger para persistir a escolha inicial.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare hid uuid;
begin
 insert into profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''));
 insert into households(name,owner_id) values(coalesce(new.raw_user_meta_data->>'household_name','Nosso casal'),new.id) returning id into hid;
 insert into household_members(household_id,user_id,role) values(hid,new.id,'owner'); update profiles set active_household_id=hid where id=new.id;
 insert into accounts(household_id,name,type) values(hid,'Conta principal','checking');
 insert into categories(household_id,name,type) values(hid,'Salário','income'),(hid,'Renda extra','income'),(hid,'Vendas','income'),(hid,'Moradia','expense'),(hid,'Alimentação','expense'),(hid,'Transporte','expense'),(hid,'Saúde','expense'),(hid,'Lazer','expense'),(hid,'Outros','expense'); return new;
end; $$;

update profiles p set active_household_id=x.household_id from lateral(select hm.household_id from household_members hm where hm.user_id=p.id and hm.status='active' order by(hm.role='owner') desc,hm.created_at,hm.household_id limit 1)x where p.active_household_id is null;
drop policy if exists "owners_manage_invitations" on household_invitations;
drop policy if exists "members_view_invitations" on household_invitations;
drop policy if exists "invitee_can_view_invitation" on household_invitations;
create policy "admins_view_invitations" on household_invitations for select to authenticated using(is_household_admin(household_id));
drop policy if exists "profiles_household_members" on profiles;
create policy "profiles_household_members" on profiles for select to authenticated using (
  id=auth.uid() or exists (
    select 1 from household_members target
    where target.user_id=profiles.id and target.status='active' and is_household_member(target.household_id)
  )
);
revoke execute on function is_household_admin(uuid),get_active_household(),create_household_invitation(uuid,text,text),cancel_household_invitation(uuid),get_household_invitation(uuid),accept_household_invitation(uuid) from public,anon;
grant execute on function is_household_admin(uuid),get_active_household(),create_household_invitation(uuid,text,text),cancel_household_invitation(uuid),get_household_invitation(uuid),accept_household_invitation(uuid) to authenticated;

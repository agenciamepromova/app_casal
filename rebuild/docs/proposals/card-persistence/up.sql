-- REVIEW DRAFT. Only exercised in an ephemeral, in-memory PostgreSQL harness.
-- Not registered as a Supabase migration and never applied to a remote database.
begin;

create table public.credit_cards (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete restrict,
  name text not null check(length(trim(name)) between 1 and 100),
  closing_day integer not null check(closing_day between 1 and 31),
  due_day integer not null check(due_day between 1 and 31),
  active boolean not null default true,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique(id,household_id)
);
create table public.card_purchases (
  id uuid primary key,
  household_id uuid not null references public.households(id) on delete restrict,
  card_id uuid not null,
  description text not null check(length(trim(description)) between 1 and 180),
  purchased_on date not null,
  amount_cents bigint not null check(amount_cents>0),
  installment_count integer not null check(installment_count between 1 and 120),
  category_id uuid references public.categories(id) on delete restrict,
  project_id uuid references public.projects(id) on delete restrict,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  check(amount_cents>=installment_count),
  unique(id,household_id),
  foreign key(card_id,household_id) references public.credit_cards(id,household_id) on delete restrict
);
create table public.card_invoices (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete restrict,
  card_id uuid not null,
  closes_on date not null,
  due_on date not null check(due_on>=closes_on),
  unique(card_id,due_on),unique(id,household_id),
  foreign key(card_id,household_id) references public.credit_cards(id,household_id) on delete restrict
);
create table public.card_installments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete restrict,
  purchase_id uuid not null,
  invoice_id uuid not null,
  installment_number integer not null check(installment_number between 1 and 120),
  amount_cents bigint not null check(amount_cents>0),
  unique(purchase_id,installment_number),
  foreign key(purchase_id,household_id) references public.card_purchases(id,household_id) on delete restrict,
  foreign key(invoice_id,household_id) references public.card_invoices(id,household_id) on delete restrict
);
create table public.card_invoice_payments (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete restrict,
  invoice_id uuid not null unique,
  account_id uuid not null references public.accounts(id) on delete restrict,
  transaction_id uuid not null unique references public.transactions(id) on delete restrict,
  request_id uuid not null,
  paid_on date not null,
  amount_cents bigint not null check(amount_cents>0),
  created_by uuid not null references auth.users(id) on delete restrict,
  unique(household_id,request_id),
  foreign key(invoice_id,household_id) references public.card_invoices(id,household_id) on delete restrict
);
create index credit_cards_household_idx on public.credit_cards(household_id);
create index card_purchases_household_date_idx on public.card_purchases(household_id,purchased_on);
create index card_purchases_category_idx on public.card_purchases(category_id);
create index card_purchases_project_idx on public.card_purchases(project_id);
create index card_invoices_household_due_idx on public.card_invoices(household_id,due_on);
create index card_installments_invoice_idx on public.card_installments(invoice_id);
create index card_payments_household_date_idx on public.card_invoice_payments(household_id,paid_on);
create index card_payments_account_idx on public.card_invoice_payments(account_id);

alter table public.credit_cards enable row level security;
alter table public.card_purchases enable row level security;
alter table public.card_invoices enable row level security;
alter table public.card_installments enable row level security;
alter table public.card_invoice_payments enable row level security;
create policy cards_read on public.credit_cards for select to authenticated using(private.is_active_member(household_id));
create policy cards_insert on public.credit_cards for insert to authenticated with check(private.is_active_member(household_id) and created_by=(select auth.uid()));
create policy cards_update on public.credit_cards for update to authenticated using(private.is_active_member(household_id)) with check(private.is_active_member(household_id));
create policy purchases_read on public.card_purchases for select to authenticated using(private.is_active_member(household_id));
create policy invoices_read on public.card_invoices for select to authenticated using(private.is_active_member(household_id));
create policy installments_read on public.card_installments for select to authenticated using(private.is_active_member(household_id));
create policy payments_read on public.card_invoice_payments for select to authenticated using(private.is_active_member(household_id));
revoke all on public.credit_cards,public.card_purchases,public.card_invoices,public.card_installments,public.card_invoice_payments from public,anon,authenticated;
grant select on public.credit_cards,public.card_purchases,public.card_invoices,public.card_installments,public.card_invoice_payments to authenticated;
grant insert on public.credit_cards to authenticated;
-- Prevent reassignment of household, author, ID or cycle settings through direct updates.
grant update(name,active) on public.credit_cards to authenticated;

create function private.card_month_day(p_month date,p_day integer) returns date
language sql immutable set search_path='' as $$
  select (date_trunc('month',p_month)::date + (least(p_day,extract(day from date_trunc('month',p_month)+interval '1 month - 1 day')::integer)-1));
$$;

create function private.record_card_purchase(p_id uuid,p_card uuid,p_description text,p_date date,p_amount bigint,p_count integer,p_category uuid default null,p_project uuid default null) returns uuid
language plpgsql security definer set search_path='' as $$
declare
  v_user uuid:=auth.uid(); v_card public.credit_cards%rowtype; v_existing public.card_purchases%rowtype;
  v_close_month date; v_due_month date; v_close date; v_due date; v_invoice uuid; v_index integer;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_card from public.credit_cards where id=p_card for update;
  if not found or not private.is_active_member(v_card.household_id) then raise exception 'Card unavailable'; end if;
  if not v_card.active then raise exception 'Card archived'; end if;
  if p_id is null or p_date is null or p_amount is null or p_count is null or p_amount<=0 or p_count not between 1 and 120 or p_amount<p_count or nullif(trim(p_description),'') is null then raise exception 'Invalid purchase'; end if;
  if p_category is not null and not exists(select 1 from public.categories where id=p_category and household_id=v_card.household_id and type='expense' and active) then raise exception 'Invalid category'; end if;
  if p_project is not null and not exists(select 1 from public.projects where id=p_project and household_id=v_card.household_id) then raise exception 'Invalid project'; end if;
  select * into v_existing from public.card_purchases where id=p_id;
  if found then
    if v_existing.card_id=p_card and v_existing.household_id=v_card.household_id and v_existing.description=trim(p_description) and v_existing.purchased_on=p_date and v_existing.amount_cents=p_amount and v_existing.installment_count=p_count and v_existing.category_id is not distinct from p_category and v_existing.project_id is not distinct from p_project then return p_id; end if;
    raise exception 'Idempotency payload conflict';
  end if;
  insert into public.card_purchases(id,household_id,card_id,description,purchased_on,amount_cents,installment_count,category_id,project_id,created_by)
  values(p_id,v_card.household_id,p_card,trim(p_description),p_date,p_amount,p_count,p_category,p_project,v_user);
  v_close_month:=date_trunc('month',p_date)::date;
  if p_date>=private.card_month_day(v_close_month,v_card.closing_day) then v_close_month:=(v_close_month+interval '1 month')::date; end if;
  v_due_month:=v_close_month;
  if v_card.due_day<=v_card.closing_day then v_due_month:=(v_due_month+interval '1 month')::date; end if;
  for v_index in 0..p_count-1 loop
    v_close:=private.card_month_day((v_close_month+make_interval(months=>v_index))::date,v_card.closing_day);
    v_due:=private.card_month_day((v_due_month+make_interval(months=>v_index))::date,v_card.due_day);
    insert into public.card_invoices(household_id,card_id,closes_on,due_on) values(v_card.household_id,p_card,v_close,v_due) on conflict(card_id,due_on) do nothing;
    select id into v_invoice from public.card_invoices where card_id=p_card and due_on=v_due for update;
    if exists(select 1 from public.card_invoice_payments where invoice_id=v_invoice) then raise exception 'Invoice already paid; reconciliation required'; end if;
    insert into public.card_installments(household_id,purchase_id,invoice_id,installment_number,amount_cents)
    values(v_card.household_id,p_id,v_invoice,v_index+1,p_amount/p_count+case when v_index<p_amount%p_count then 1 else 0 end);
  end loop;
  return p_id;
end $$;

create function private.pay_card_invoice(p_invoice uuid,p_account uuid,p_date date,p_request uuid,p_expected_amount bigint) returns uuid
language plpgsql security definer set search_path='' as $$
declare v_user uuid:=auth.uid();v_invoice public.card_invoices%rowtype;v_payment public.card_invoice_payments%rowtype;v_amount bigint;v_tx uuid;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  select * into v_invoice from public.card_invoices where id=p_invoice for update;
  if not found or not private.is_active_member(v_invoice.household_id) then raise exception 'Invoice unavailable'; end if;
  if p_request is null or p_date is null then raise exception 'Invalid payment'; end if;
  if not exists(select 1 from public.accounts where id=p_account and household_id=v_invoice.household_id and active) then raise exception 'Invalid cash account'; end if;
  select * into v_payment from public.card_invoice_payments where invoice_id=p_invoice;
  if found then
    if v_payment.account_id=p_account and v_payment.paid_on=p_date and v_payment.amount_cents=p_expected_amount then return v_payment.transaction_id; end if;
    raise exception 'Payment payload conflict';
  end if;
  select sum(amount_cents) into v_amount from public.card_installments where invoice_id=p_invoice;
  if v_amount is null or v_amount<=0 or p_expected_amount is null or v_amount<>p_expected_amount then raise exception 'Invoice amount changed'; end if;
  insert into public.transactions(household_id,account_id,created_by,type,amount_cents,description,notes,transaction_date,status,settled_at)
  values(v_invoice.household_id,p_account,v_user,'expense',v_amount,'Pagamento de fatura','Saída de caixa; compras detalhadas no cartão',p_date,'settled',p_date) returning id into v_tx;
  insert into public.card_invoice_payments(household_id,invoice_id,account_id,transaction_id,request_id,paid_on,amount_cents,created_by)
  values(v_invoice.household_id,p_invoice,p_account,v_tx,p_request,p_date,v_amount,v_user);
  return v_tx;
end $$;

-- Public entrypoints are invokers; privileged implementations live in private,
-- enforce auth.uid + active membership, and accept no user/household claims from callers.
create function public.record_card_purchase(p_id uuid,p_card uuid,p_description text,p_date date,p_amount bigint,p_count integer,p_category uuid default null,p_project uuid default null) returns uuid
language sql security invoker set search_path='' as $$select private.record_card_purchase(p_id,p_card,p_description,p_date,p_amount,p_count,p_category,p_project)$$;
create function public.pay_card_invoice(p_invoice uuid,p_account uuid,p_date date,p_request uuid,p_expected_amount bigint) returns uuid
language sql security invoker set search_path='' as $$select private.pay_card_invoice(p_invoice,p_account,p_date,p_request,p_expected_amount)$$;
revoke all on function private.card_month_day(date,integer),private.record_card_purchase(uuid,uuid,text,date,bigint,integer,uuid,uuid),private.pay_card_invoice(uuid,uuid,date,uuid,bigint),public.record_card_purchase(uuid,uuid,text,date,bigint,integer,uuid,uuid),public.pay_card_invoice(uuid,uuid,date,uuid,bigint) from public,anon,authenticated;
grant execute on function private.record_card_purchase(uuid,uuid,text,date,bigint,integer,uuid,uuid),private.pay_card_invoice(uuid,uuid,date,uuid,bigint),public.record_card_purchase(uuid,uuid,text,date,bigint,integer,uuid,uuid),public.pay_card_invoice(uuid,uuid,date,uuid,bigint) to authenticated;

-- Preserve per-project cash filtering for a bill containing several activities.
-- A payment is one bank movement; allocations sum to that payment, not extra movements.
create view public.card_cash_allocations with(security_invoker=true) as
select pay.household_id,pay.transaction_id,pay.paid_on,part.id installment_id,pur.project_id,pur.category_id,part.amount_cents
from public.card_invoice_payments pay join public.card_installments part on part.invoice_id=pay.invoice_id and part.household_id=pay.household_id
join public.card_purchases pur on pur.id=part.purchase_id and pur.household_id=part.household_id;
revoke all on public.card_cash_allocations from public,anon;
grant select on public.card_cash_allocations to authenticated;
commit;

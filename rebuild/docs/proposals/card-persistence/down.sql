-- REVIEW DRAFT. Safe schema reversal only while all new tables are empty.
-- With financial data present, fail atomically and keep it. Archive/export and
-- a separate approved reversal plan would be required; never cascade-delete.
begin;
do $$begin
  if exists(select 1 from public.credit_cards) or exists(select 1 from public.card_purchases) or exists(select 1 from public.card_invoices) or exists(select 1 from public.card_installments) or exists(select 1 from public.card_invoice_payments) then
    raise exception 'Rollback blocked: card data must be preserved';
  end if;
end $$;
drop view public.card_cash_allocations;
drop function public.record_card_purchase(uuid,uuid,text,date,bigint,integer,uuid,uuid);
drop function public.pay_card_invoice(uuid,uuid,date,uuid,bigint);
drop function private.record_card_purchase(uuid,uuid,text,date,bigint,integer,uuid,uuid);
drop function private.pay_card_invoice(uuid,uuid,date,uuid,bigint);
drop function private.card_month_day(date,integer);
drop table public.card_invoice_payments;
drop table public.card_installments;
drop table public.card_invoices;
drop table public.card_purchases;
drop table public.credit_cards;
commit;

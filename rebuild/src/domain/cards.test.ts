import { describe,it,expect } from "vitest";
import { invoiceParts,cardInvoices,payInvoice,type CardConfig,type CardPurchase } from "./cards";
const card:CardConfig={id:"c",name:"Teste",closingDay:20,dueDay:28};
const purchase=(overrides:Partial<CardPurchase>={}):CardPurchase=>({id:"p",cardId:"c",description:"Compra",date:"2026-10-19",amountCents:10000,installments:3,...overrides});
describe("previsão isolada de cartão",()=>{
  it("divide centavos sem perder ou criar dinheiro",()=>{const items=invoiceParts(card,purchase());expect(items.map(item=>item.amountCents)).toEqual([3334,3333,3333]);expect(items.reduce((sum,item)=>sum+item.amountCents,0)).toBe(10000)});
  it("compra no fechamento vai para o próximo ciclo",()=>{expect(invoiceParts(card,purchase({date:"2026-10-20"}))[0].dueDate).toBe("2026-11-28")});
  it("vencimento anterior ao fechamento ocorre no mês seguinte",()=>{expect(invoiceParts({...card,dueDay:5},purchase())[0].dueDate).toBe("2026-11-05")});
  it("limita dias ao fim do mês sem desviar parcelas seguintes",()=>{expect(invoiceParts({...card,closingDay:25,dueDay:31},purchase({date:"2027-01-26"})).map(item=>item.dueDate)).toEqual(["2027-02-28","2027-03-31","2027-04-30"])});
  it("não duplica despesa nem pagamento de fatura",()=>{const purchases=[purchase({installments:1})],invoice=cardInvoices(card,purchases,[])[0];const first=payInvoice([],invoice.key,10000),twice=payInvoice(first,invoice.key,10000);expect(twice).toHaveLength(1);const paid=cardInvoices(card,purchases,twice)[0];expect(paid.totalCents).toBe(10000);expect(paid.remainingCents).toBe(0);expect(purchases).toHaveLength(1)});
  it("não mistura cartões",()=>{expect(cardInvoices(card,[purchase({cardId:"other"})],[])).toEqual([])});
  it("rejeita data inexistente",()=>expect(()=>invoiceParts(card,purchase({date:"2026-02-31"}))).toThrow());
  it("rejeita zero, parcelas inválidas e configuração inválida",()=>{expect(()=>invoiceParts(card,purchase({amountCents:0}))).toThrow();expect(()=>invoiceParts(card,purchase({installments:0}))).toThrow();expect(()=>invoiceParts({...card,dueDay:32},purchase())).toThrow()});
});

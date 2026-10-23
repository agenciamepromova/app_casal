import { describe,it,expect } from "vitest";
import { realizedResult,pendingOccurrences,transactionPeriodDate } from "./overview";
import { commitmentOccurrences } from "./recurrence";
import type { Transaction,Commitment } from "./types";
const transaction=(status:Transaction["status"],amountCents:number,type:Transaction["type"]="income"):Transaction=>({id:status,type,status,amountCents,date:"2026-10-01",description:"Teste",accountId:"a",categoryId:"",owner:"Brenda"});
const bill:Commitment={id:"bill",title:"Água",type:"payable",amountCents:10000,dueDate:"2026-01-31",recurrence:"monthly",status:"pending",responsibleId:"n",responsibleName:"Nikson"};
describe("resumo e agenda",()=>{
  it("usa pagamento efetivo para realizado e vencimento para previsão",()=>{expect(transactionPeriodDate({...transaction("settled",100),date:"2026-09-20",settledAt:"2026-10-02"})).toBe("2026-10-02");expect(transactionPeriodDate({...transaction("pending",100),dueDate:"2026-11-05"})).toBe("2026-11-05")});
  it("resultado inclui apenas realizado e preserva sinal negativo",()=>expect(realizedResult([transaction("settled",100),transaction("settled",200,"expense"),transaction("planned",900),transaction("pending",800),transaction("cancelled",700)])).toBe(-100));
  it("esconde ocorrências já liquidadas sem esconder o próximo mês",()=>{const paid={...transaction("settled",10000,"expense"),sourceCommitmentId:"bill",sourceOccurrenceDate:"2026-01-31"};expect(pendingOccurrences([bill],[paid],"2026-01-01","2026-02-28").map(item=>item.date)).toEqual(["2026-02-28"])});
  it("mantém dia âncora em meses curtos",()=>expect(commitmentOccurrences(bill,"2026-01-01","2026-04-30")).toEqual(["2026-01-31","2026-02-28","2026-03-31","2026-04-30"]));
  it("não exibe compromissos cancelados ou concluídos",()=>expect(pendingOccurrences([{...bill,status:"completed"},{...bill,status:"cancelled"}],[],"2026-01-01","2026-12-31")).toEqual([]));
});

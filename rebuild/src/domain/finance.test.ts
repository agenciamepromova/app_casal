import { describe, expect, it } from "vitest";
import { availableBalance, projectedBalance, projectResult } from "./finance";
import { commitmentOccurrences } from "./recurrence";
import type { Account, Commitment, Transaction } from "./types";

const account: Account = { id:"a", name:"Conta", kind:"checking", openingBalanceCents:100_00, color:"#fff", active:true };
const transaction = (overrides: Partial<Transaction>): Transaction => ({ id:"t", type:"income", amountCents:50_00, description:"Receita", date:"2026-08-01", status:"settled", accountId:"a", categoryId:"c", owner:"Nikson", ...overrides });
const commitment = (overrides: Partial<Commitment>): Commitment => ({ id:"f", title:"Aluguel", type:"payable", amountCents:30_00, dueDate:"2026-08-05", responsibleId:"u", responsibleName:"Nikson", status:"pending", recurrence:"none", ...overrides });

describe("regras financeiras", () => {
  it("não mistura valores pendentes no saldo disponível", () => {
    expect(availableBalance([account], [transaction({}), transaction({ id:"p", status:"pending", amountCents:80_00 })])).toBe(150_00);
  });
  it("projeta compromissos dentro da janela", () => {
    expect(projectedBalance([account], [], [commitment({}), commitment({ id:"r", type:"receivable", amountCents:80_00 })], "2026-08-01", "2026-08-07")).toBe(150_00);
  });
  it("nÃ£o projeta novamente uma ocorrÃªncia recorrente jÃ¡ liquidada", () => {
    const settled = transaction({ sourceCommitmentId:"f", sourceOccurrenceDate:"2026-08-05" });
    expect(projectedBalance([account], [settled], [commitment({ recurrence:"monthly" })], "2026-08-01", "2026-08-31")).toBe(150_00);
  });
  it("calcula realizado e projetado por projeto separadamente", () => {
    const result = projectResult([transaction({ projectId:"p" }), transaction({ id:"e", projectId:"p", type:"expense", amountCents:20_00 }), transaction({ id:"future", projectId:"p", status:"pending", amountCents:40_00 })], "p");
    expect(result.realized).toBe(30_00); expect(result.projected).toBe(70_00);
  });
  it("calcula recorrência mensal sem materializar registros futuros", () => {
    expect(commitmentOccurrences(commitment({ recurrence:"monthly" }), "2026-08-01", "2026-10-31")).toEqual(["2026-08-05","2026-09-05","2026-10-05"]);
  });
  it("respeita limite de ocorrências", () => {
    expect(commitmentOccurrences(commitment({ recurrence:"weekly", occurrenceLimit:2 }), "2026-08-01", "2026-12-31")).toHaveLength(2);
  });
});

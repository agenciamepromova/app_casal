import type { Account, Commitment, Transaction } from "./types";
import { commitmentOccurrences } from "./recurrence";

export function availableBalance(accounts: Account[], transactions: Transaction[]) {
  return accounts.filter(account => account.active).reduce((sum, account) => sum + account.openingBalanceCents, 0)
    + transactions.filter(item => item.status === "settled").reduce((sum, item) => sum + (item.type === "income" ? item.amountCents : -item.amountCents), 0);
}

export function projectedBalance(accounts: Account[], transactions: Transaction[], commitments: Commitment[], from: string, to: string) {
  const balance = availableBalance(accounts, transactions);
  const settledOccurrences = new Set(transactions
    .filter(item => item.status === "settled" && item.sourceCommitmentId && item.sourceOccurrenceDate)
    .map(item => `${item.sourceCommitmentId}:${item.sourceOccurrenceDate}`));
  const scheduled = commitments.flatMap(item => commitmentOccurrences(item, from, to)
    .filter(date => !settledOccurrences.has(`${item.id}:${date}`))
    .map(date => ({ item, date })));
  return balance + scheduled.reduce((sum, occurrence) => {
    const amount = occurrence.item.amountCents ?? 0;
    return sum + (occurrence.item.type === "receivable" ? amount : occurrence.item.type === "payable" ? -amount : 0);
  }, 0);
}

export function projectResult(transactions: Transaction[], projectId: string) {
  const items = transactions.filter(item => item.projectId === projectId);
  const realizedIncome = items.filter(item => item.type === "income" && item.status === "settled").reduce((sum, item) => sum + item.amountCents, 0);
  const realizedExpense = items.filter(item => item.type === "expense" && item.status === "settled").reduce((sum, item) => sum + item.amountCents, 0);
  const plannedIncome = items.filter(item => item.type === "income" && item.status !== "cancelled").reduce((sum, item) => sum + item.amountCents, 0);
  const plannedExpense = items.filter(item => item.type === "expense" && item.status !== "cancelled").reduce((sum, item) => sum + item.amountCents, 0);
  return { realizedIncome, realizedExpense, realized: realizedIncome - realizedExpense, projected: plannedIncome - plannedExpense };
}

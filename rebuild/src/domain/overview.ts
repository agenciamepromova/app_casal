import type { Commitment, Transaction } from "./types";
import { commitmentOccurrences } from "./recurrence";
export function transactionPeriodDate(item: Transaction) {
  return item.status === "settled" ? item.settledAt ?? item.date : item.dueDate ?? item.date;
}
export function realizedResult(items: Transaction[]) {
  return items.filter(item => item.status === "settled").reduce((sum, item) => sum + (item.type === "income" ? item.amountCents : -item.amountCents), 0);
}
export function pendingOccurrences(commitments: Commitment[], transactions: Transaction[], from: string, to: string) {
  const paid = new Set(transactions.filter(item => item.status === "settled" && item.sourceCommitmentId).map(item => `${item.sourceCommitmentId}:${item.sourceOccurrenceDate}`));
  return commitments.filter(item => item.status === "pending").flatMap(item => commitmentOccurrences(item, from, to).filter(date => !paid.has(`${item.id}:${date}`)).map(date => ({ item, date }))).sort((a,b) => a.date.localeCompare(b.date));
}
export function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

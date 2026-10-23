import type { Commitment } from "./types";

const iso = (date: Date) => date.toISOString().slice(0, 10);
const atNoon = (value: string) => new Date(`${value}T12:00:00`);

function addOccurrence(date: Date, commitment: Commitment, anchorDay: number) {
  const next = new Date(date);
  const months: Record<string, number> = { monthly: 1, bimonthly: 2, quarterly: 3, semiannual: 6, annual: 12 };
  if (commitment.recurrence === "weekly") next.setDate(next.getDate() + 7);
  else if (months[commitment.recurrence]) {
    next.setDate(1);
    next.setMonth(next.getMonth() + months[commitment.recurrence]);
    next.setDate(Math.min(anchorDay, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
  }
  else if (commitment.recurrence === "custom") {
    const amount = commitment.customInterval ?? 1;
    if (commitment.customUnit === "days") next.setDate(next.getDate() + amount);
    else if (commitment.customUnit === "weeks") next.setDate(next.getDate() + amount * 7);
    else {
      next.setDate(1);
      next.setMonth(next.getMonth() + amount);
      next.setDate(Math.min(anchorDay, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
    }
  }
  return next;
}

export function commitmentOccurrences(commitment: Commitment, from: string, to: string) {
  if (commitment.status !== "pending") return [];
  const start = atNoon(commitment.dueDate), min = atNoon(from), max = atNoon(to), end = commitment.recurrenceEndsAt ? atNoon(commitment.recurrenceEndsAt) : max;
  const result: string[] = [];
  let cursor = start, count = 0;
  const limit = Math.min(commitment.occurrenceLimit ?? 400, 400);
  while (cursor <= max && cursor <= end && count < limit) {
    if (cursor >= min) result.push(iso(cursor));
    count += 1;
    if (commitment.recurrence === "none") break;
    const next = addOccurrence(cursor, commitment, start.getDate());
    if (next <= cursor) break;
    cursor = next;
  }
  return result;
}


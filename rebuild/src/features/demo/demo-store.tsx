"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { demoState, freshState } from "@/domain/demo-data";
import type { Account, AppState, Category, Goal, Invite, Transaction } from "@/domain/types";

const KEY = "plano-a-dois-rebuild-v2";
type Store = { state: AppState; ready: boolean; save: (next: AppState) => void; login: (email: string) => void; signup: (name: string, email: string) => void; logout: () => void; completeOnboarding: (name: string, household: string) => void; addTransaction: (item: Transaction) => void; updateTransaction: (item: Transaction) => void; removeTransaction: (id: string) => void; addAccount: (item: Account) => void; updateAccount: (item: Account) => void; addCategory: (item: Category) => void; updateCategory: (item: Category) => void; addGoal: (item: Goal) => void; updateGoal: (item: Goal) => void; addInvite: (item: Invite) => void; removeInvite: (id: string) => void; reset: () => void };
const Context = createContext<Store | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(demoState);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { const stored = localStorage.getItem(KEY); if (stored) setState(JSON.parse(stored) as AppState); } catch { localStorage.removeItem(KEY); }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  const save = useCallback((next: AppState) => { setState(next); localStorage.setItem(KEY, JSON.stringify(next)); }, []);
  const patch = useCallback((data: Partial<AppState>) => save({ ...state, ...data }), [save, state]);
  const value = useMemo<Store>(() => ({
    state, ready, save,
    login: (email) => patch({ session: true, user: { ...state.user, email } }),
    signup: (name, email) => patch({ session: true, onboarded: false, user: { name, email }, household: { name: "", activeId: "" }, transactions: [], goals: [], invites: [] }),
    logout: () => patch({ session: false }),
    completeOnboarding: (name, household) => patch({ onboarded: true, user: { ...state.user, name }, household: { name: household, activeId: "demo-household" } }),
    addTransaction: (item) => patch({ transactions: [item, ...state.transactions] }),
    updateTransaction: (item) => patch({ transactions: state.transactions.map((current) => current.id === item.id ? item : current) }),
    removeTransaction: (id) => patch({ transactions: state.transactions.filter((item) => item.id !== id) }),
    addAccount: (item) => patch({ accounts: [...state.accounts, item] }),
    updateAccount: (item) => patch({ accounts: state.accounts.map((current) => current.id === item.id ? item : current) }),
    addCategory: (item) => patch({ categories: [...state.categories, item] }),
    updateCategory: (item) => patch({ categories: state.categories.map((current) => current.id === item.id ? item : current) }),
    addGoal: (item) => patch({ goals: [...state.goals, item] }),
    updateGoal: (item) => patch({ goals: state.goals.map((current) => current.id === item.id ? item : current) }),
    addInvite: (item) => patch({ invites: [item, ...state.invites] }),
    removeInvite: (id) => patch({ invites: state.invites.filter((item) => item.id !== id) }),
    reset: () => save({ ...freshState(), session: true }),
  }), [patch, ready, save, state]);
  return <Context.Provider value={value}>{ready ? children : <main className="page-loading">Preparando o espaço de vocês...</main>}</Context.Provider>;
}

export function useDemo() { const value = useContext(Context); if (!value) throw new Error("DemoProvider ausente"); return value; }

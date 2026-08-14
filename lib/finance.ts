'use client';

/* The finance workspace: its own store, kept separate from the recruiting
 * store on purpose. The two halves of the product share an account and
 * nothing else, so opening Recruiting should never wait on the ledger and
 * vice versa.
 *
 * Same shape as lib/store.ts — module-scope state, useSyncExternalStore,
 * every mutation goes through withBusy and reloads — so anyone who has read
 * one file already knows how this one works.
 *
 * Money is integer minor units everywhere, matching the database. It is
 * converted to and from a human string only at the edges, in `parseAmount`
 * and `formatMoney`. Nothing in between ever sees a float. */

import { useSyncExternalStore } from 'react';
import { supabase } from './supabase/client';
import { errorMessage } from './store';
import type { Tables, TablesUpdate } from './database.types';

export type FinanceKind = 'Income' | 'Direct cost' | 'Operating expense' | 'Owner capital';
export type PaymentMethod = 'Cash' | 'Bank transfer' | 'Card' | 'Cheque' | 'Other';
export type TournamentStatus = 'Planned' | 'Running' | 'Completed';

export const KINDS: readonly FinanceKind[] = [
  'Income',
  'Direct cost',
  'Operating expense',
  'Owner capital',
];

/* The three kinds an income statement is built from. Owner capital is money
 * in, but it is not earnings, so it is kept out of every profit figure. */
export const PROFIT_KINDS: readonly FinanceKind[] = ['Income', 'Direct cost', 'Operating expense'];
export const METHODS: readonly PaymentMethod[] = [
  'Cash',
  'Bank transfer',
  'Card',
  'Cheque',
  'Other',
];
export const TOURNAMENT_STATUSES: readonly TournamentStatus[] = [
  'Planned',
  'Running',
  'Completed',
];

/* The plain-English gloss shown in brackets after each accounting term. The
 * whole product is aimed at someone who has the numbers but not the
 * vocabulary, so every term that could be looked up is explained in place. */
export const KIND_HELP: Record<FinanceKind, string> = {
  Income: 'money coming in',
  'Direct cost': 'money spent on putting on a specific event',
  'Operating expense': 'money spent running the business itself',
  'Owner capital': 'money you put in yourself — kept out of profit',
};

/* True for anything that increases the bank balance, whether it was earned or
 * put in. Used for the in/out label on a row. */
export function isMoneyIn(kind: FinanceKind): boolean {
  return kind === 'Income' || kind === 'Owner capital';
}

export interface Category {
  id: string;
  name: string;
  kind: FinanceKind;
  description: string;
  sortOrder: number;
  archived: boolean;
}

export interface Tournament {
  id: string;
  name: string;
  location: string;
  startsOn: string | null;
  endsOn: string | null;
  status: TournamentStatus;
  budgetIncome: number;
  budgetExpense: number;
  notes: string;
  archivedAt: string | null;
}

export interface Txn {
  id: string;
  occurredOn: string;
  amount: number;
  categoryId: string;
  tournamentId: string | null;
  description: string;
  counterparty: string;
  method: PaymentMethod;
  settled: boolean;
  createdAt: string;
}

export interface FinanceState {
  categories: Category[];
  tournaments: Tournament[];
  txns: Txn[];
  currency: string;
  userId: string | null;
  loading: boolean;
  error: string | null;
  busy: boolean;
}

let state: FinanceState = {
  categories: [],
  tournaments: [],
  txns: [],
  currency: 'EGP',
  userId: null,
  loading: true,
  error: null,
  busy: false,
};

const listeners = new Set<() => void>();

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getState(): FinanceState {
  return state;
}

export function setFinanceState(patch: Partial<FinanceState>) {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
}

export function useFinance(): FinanceState {
  return useSyncExternalStore(subscribe, getState, getState);
}

export function resetFinance() {
  state = {
    categories: [],
    tournaments: [],
    txns: [],
    currency: 'EGP',
    userId: null,
    loading: true,
    error: null,
    busy: false,
  };
  listeners.forEach((fn) => fn());
}

/* ------------------------------------------------------------------ money */

/* "1,250.75", "1250,75", "  1250 " -> 125075 minor units. Null when the text
 * is not a number at all, so a typo is refused rather than silently filed as
 * zero. Anything beyond two decimals is rounded, because a ledger has no use
 * for a third. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[\s,]/g, '').replace(',', '.');
  if (!cleaned || !/^-?\d*\.?\d*$/.test(cleaned)) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 100);
}

/* Minor units -> "12,450.00". Grouped by thousands and always two decimals,
 * so a column of numbers lines up. */
export function formatAmount(cents: number): string {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const part = String(abs % 100).padStart(2, '0');
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (negative ? '-' : '') + grouped + '.' + part;
}

export function formatMoney(cents: number, currency: string): string {
  return currency + ' ' + formatAmount(cents);
}

/* For an input box: minor units -> "1250.75", no grouping to fight with. */
export function amountToInput(cents: number): string {
  return (cents / 100).toFixed(2);
}

/* ------------------------------------------------------------------- load */

export async function loadFinance() {
  const db = supabase();
  const { data: sessionData } = await db.auth.getSession();
  const session = sessionData.session;
  if (!session) {
    setFinanceState({ loading: false, userId: null });
    return;
  }

  const [catRes, tourRes, txnRes, settingsRes] = await Promise.all([
    db.from('finance_categories').select('*').order('sort_order', { ascending: true }),
    db.from('tournaments').select('*').order('starts_on', { ascending: false, nullsFirst: false }),
    db.from('finance_transactions').select('*').order('occurred_on', { ascending: false }),
    db.from('app_settings').select('currency').eq('id', 1).maybeSingle(),
  ]);

  const firstError = catRes.error || tourRes.error || txnRes.error || settingsRes.error;
  if (firstError) {
    setFinanceState({ loading: false, error: firstError.message });
    return;
  }

  setFinanceState({
    userId: session.user.id,
    categories: (catRes.data ?? []).map(toCategory),
    tournaments: (tourRes.data ?? []).map(toTournament),
    txns: (txnRes.data ?? []).map(toTxn),
    currency: settingsRes.data?.currency ?? 'EGP',
    loading: false,
    error: null,
  });
}

function toCategory(r: Tables<'finance_categories'>): Category {
  return {
    id: r.id,
    name: r.name,
    kind: r.kind,
    description: r.description,
    sortOrder: r.sort_order,
    archived: r.is_archived,
  };
}

function toTournament(r: Tables<'tournaments'>): Tournament {
  return {
    id: r.id,
    name: r.name,
    location: r.location,
    startsOn: r.starts_on,
    endsOn: r.ends_on,
    status: r.status,
    budgetIncome: r.budget_income_cents,
    budgetExpense: r.budget_expense_cents,
    notes: r.notes,
    archivedAt: r.archived_at,
  };
}

function toTxn(r: Tables<'finance_transactions'>): Txn {
  return {
    id: r.id,
    occurredOn: r.occurred_on,
    amount: r.amount_cents,
    categoryId: r.category_id,
    tournamentId: r.tournament_id,
    description: r.description,
    counterparty: r.counterparty,
    method: r.method,
    settled: r.is_settled,
    createdAt: r.created_at,
  };
}

async function withBusy<T>(fn: () => Promise<T>): Promise<T | null> {
  setFinanceState({ busy: true, error: null });
  try {
    const result = await fn();
    await loadFinance();
    return result;
  } catch (e) {
    setFinanceState({ error: errorMessage(e) });
    return null;
  } finally {
    setFinanceState({ busy: false });
  }
}

function requireUser(): string {
  if (!state.userId) throw new Error('Not signed in.');
  return state.userId;
}

/* -------------------------------------------------------------- selectors */

export function liveCategories(s: FinanceState): Category[] {
  return s.categories.filter((c) => !c.archived);
}

export function categoryById(s: FinanceState, id: string): Category | undefined {
  return s.categories.find((c) => c.id === id);
}

export function liveTournaments(s: FinanceState): Tournament[] {
  return s.tournaments.filter((t) => !t.archivedAt);
}

export function tournamentById(s: FinanceState, id: string): Tournament | undefined {
  return s.tournaments.find((t) => t.id === id);
}

export function kindOf(s: FinanceState, t: Txn): FinanceKind | undefined {
  return categoryById(s, t.categoryId)?.kind;
}

/* The income statement, which is the one report everything else is a slice
 * of. Every field is a running total in minor units. */
export interface Totals {
  income: number;
  directCosts: number;
  operatingExpenses: number;
  /* Revenue minus the cost of putting the events on. */
  grossProfit: number;
  /* What is left once the business's own running costs come out too. */
  netProfit: number;
  /* Net profit as a percentage of income; 0 when nothing came in. */
  margin: number;
  /* Agreed but not yet moved. */
  owedToYou: number;
  youOwe: number;
  /* Money put in from the owner's own pocket. Deliberately outside every
   * figure above: it is equity, not earnings. */
  capitalIn: number;
  count: number;
}

export function totalsFor(s: FinanceState, txns: Txn[]): Totals {
  let income = 0;
  let directCosts = 0;
  let operatingExpenses = 0;
  let owedToYou = 0;
  let youOwe = 0;
  let capitalIn = 0;

  for (const t of txns) {
    const kind = kindOf(s, t);
    if (!kind) continue;
    if (kind === 'Owner capital') {
      capitalIn += t.amount;
    } else if (kind === 'Income') {
      income += t.amount;
      if (!t.settled) owedToYou += t.amount;
    } else {
      if (kind === 'Direct cost') directCosts += t.amount;
      else operatingExpenses += t.amount;
      if (!t.settled) youOwe += t.amount;
    }
  }

  const grossProfit = income - directCosts;
  const netProfit = grossProfit - operatingExpenses;
  return {
    income,
    directCosts,
    operatingExpenses,
    grossProfit,
    netProfit,
    margin: income ? Math.round((netProfit / income) * 100) : 0,
    owedToYou,
    youOwe,
    capitalIn,
    count: txns.length,
  };
}

/* Printed at the foot of the dashboard. Stating the basis of a report is
 * ordinary practice, and here it also heads off the obvious question: why
 * these totals do not match a bank statement. */
export const totalsForTournamentHelp =
  'These figures cover everything you have recorded, including entries marked as not yet paid, ' +
  'so they show what you have earned and committed rather than what has cleared your bank. ' +
  'A tournament’s profit counts only the entries tagged to it.';

export function txnsOfTournament(s: FinanceState, tournamentId: string): Txn[] {
  return s.txns.filter((t) => t.tournamentId === tournamentId);
}

/* Money grouped by category, biggest first — the "where is it all going"
 * table. Only categories with something in them are returned. */
export interface CategoryTotal {
  category: Category;
  total: number;
  share: number;
}

export function byCategory(s: FinanceState, txns: Txn[], kind: FinanceKind): CategoryTotal[] {
  const sums = new Map<string, number>();
  let grand = 0;
  for (const t of txns) {
    const cat = categoryById(s, t.categoryId);
    if (!cat || cat.kind !== kind) continue;
    sums.set(t.categoryId, (sums.get(t.categoryId) ?? 0) + t.amount);
    grand += t.amount;
  }
  return [...sums.entries()]
    .map(([id, total]) => ({
      category: categoryById(s, id)!,
      total,
      share: grand ? Math.round((total / grand) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

/* The last `months` calendar months, oldest first, for the trend strip. */
export interface MonthPoint {
  key: string;
  label: string;
  income: number;
  spend: number;
  net: number;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function monthlySeries(s: FinanceState, months = 6): MonthPoint[] {
  const now = new Date();
  const points: MonthPoint[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    points.push({
      key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'),
      label: MONTH_NAMES[d.getMonth()],
      income: 0,
      spend: 0,
      net: 0,
    });
  }
  const index = new Map(points.map((p) => [p.key, p]));

  for (const t of s.txns) {
    const point = index.get(t.occurredOn.slice(0, 7));
    if (!point) continue;
    const kind = kindOf(s, t);
    /* Capital is left out so the trend shows how the business is trading,
     * not how much has been propped up. */
    if (!kind || kind === 'Owner capital') continue;
    if (kind === 'Income') point.income += t.amount;
    else point.spend += t.amount;
  }
  for (const p of points) p.net = p.income - p.spend;
  return points;
}

/* --------------------------------------------------------------- mutations */

export interface TxnInput {
  occurredOn: string;
  amount: number;
  categoryId: string;
  tournamentId: string | null;
  description: string;
  counterparty: string;
  method: PaymentMethod;
  settled: boolean;
}

export function addTxn(input: TxnInput) {
  return withBusy(async () => {
    const { error } = await supabase()
      .from('finance_transactions')
      .insert({
        occurred_on: input.occurredOn,
        amount_cents: input.amount,
        category_id: input.categoryId,
        tournament_id: input.tournamentId,
        description: input.description.trim(),
        counterparty: input.counterparty.trim(),
        method: input.method,
        is_settled: input.settled,
        created_by: requireUser(),
      });
    if (error) throw error;
  });
}

export function updateTxn(id: string, patch: TablesUpdate<'finance_transactions'>) {
  return withBusy(async () => {
    const { error } = await supabase().from('finance_transactions').update(patch).eq('id', id);
    if (error) throw error;
  });
}

export function toggleSettled(t: Txn) {
  return updateTxn(t.id, { is_settled: !t.settled });
}

/* A mistyped ledger line is not history worth keeping — it would corrupt
 * every total after it — so unlike a candidate, it really is deleted. */
export function deleteTxn(id: string) {
  return withBusy(async () => {
    const { error } = await supabase().from('finance_transactions').delete().eq('id', id);
    if (error) throw error;
  });
}

export interface TournamentInput {
  name: string;
  location: string;
  startsOn: string | null;
  endsOn: string | null;
  status: TournamentStatus;
  budgetIncome: number;
  budgetExpense: number;
  notes: string;
}

export function addTournament(input: TournamentInput): Promise<string | null> {
  return withBusy(async () => {
    const { data, error } = await supabase()
      .from('tournaments')
      .insert({
        name: input.name.trim(),
        location: input.location.trim(),
        starts_on: input.startsOn,
        ends_on: input.endsOn,
        status: input.status,
        budget_income_cents: input.budgetIncome,
        budget_expense_cents: input.budgetExpense,
        notes: input.notes.trim(),
        created_by: requireUser(),
      })
      .select('id')
      .single();
    if (error) throw error;
    return data.id;
  });
}

export function updateTournament(id: string, patch: TablesUpdate<'tournaments'>) {
  return withBusy(async () => {
    const { error } = await supabase().from('tournaments').update(patch).eq('id', id);
    if (error) throw error;
  });
}

export function archiveTournament(id: string) {
  return updateTournament(id, { archived_at: new Date().toISOString() });
}

export function restoreTournament(id: string) {
  return updateTournament(id, { archived_at: null });
}

/* Only reachable once archived, and the transactions survive: their
 * tournament tag is cleared by the foreign key, so the money stays in the
 * books and only the grouping is lost. */
export function deleteTournamentForever(id: string) {
  return withBusy(async () => {
    const t = tournamentById(state, id);
    if (!t) throw new Error('That tournament no longer exists.');
    if (!t.archivedAt) throw new Error('Archive it first — only archived tournaments can be deleted.');
    const { error } = await supabase().from('tournaments').delete().eq('id', id);
    if (error) throw error;
  });
}

export function addCategory(name: string, kind: FinanceKind, description: string) {
  return withBusy(async () => {
    const { error } = await supabase()
      .from('finance_categories')
      .insert({
        name: name.trim(),
        kind,
        description: description.trim(),
        sort_order: 500,
        created_by: requireUser(),
      });
    if (error) throw error;
  });
}

export function updateCategory(id: string, patch: TablesUpdate<'finance_categories'>) {
  return withBusy(async () => {
    const { error } = await supabase().from('finance_categories').update(patch).eq('id', id);
    if (error) throw error;
  });
}

/* Categories are retired, never deleted: transactions filed under one must
 * keep their meaning for as long as the books exist. */
export function setCategoryArchived(id: string, archived: boolean) {
  return updateCategory(id, { is_archived: archived });
}

export function setCurrency(currency: string) {
  return withBusy(async () => {
    const code = currency.trim().toUpperCase().slice(0, 6);
    if (!code) throw new Error('Give the currency a code, for example EGP.');
    const { error } = await supabase()
      .from('app_settings')
      .update({ currency: code, updated_by: requireUser() })
      .eq('id', 1);
    if (error) throw error;
  });
}

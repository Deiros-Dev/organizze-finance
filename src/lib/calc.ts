import type { Aporte, Operation, ProjectionParams, ProjectionResult } from '../types';
import { monthKey, todayISO } from './format';

export type Totals = {
  totalAportes: number;
  totalProfit: number;
  bankroll: number;
  aporteCount: number;
  opCount: number;
  wins: number;
  losses: number;
  winRate: number;
  bestDay: number;
  worstDay: number;
  avgDay: number;
  todayResult: number;
  currentStreak: number; // + verde seguido, - vermelho seguido
};

export function computeTotals(
  operations: Operation[],
  aportes: Aporte[],
  startingBankroll = 0,
): Totals {
  const totalAportes = aportes.reduce((s, a) => s + a.amount, 0);
  const totalProfit = operations.reduce((s, o) => s + o.result, 0);
  const wins = operations.filter((o) => o.result > 0).length;
  const losses = operations.filter((o) => o.result < 0).length;
  const results = operations.map((o) => o.result);
  const decided = wins + losses;

  const sorted = [...operations].sort((a, b) =>
    a.date === b.date ? a.createdAt.localeCompare(b.createdAt) : a.date.localeCompare(b.date),
  );
  let streak = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    const r = sorted[i].result;
    if (r === 0) break;
    if (streak === 0) streak = r > 0 ? 1 : -1;
    else if (r > 0 && streak > 0) streak++;
    else if (r < 0 && streak < 0) streak--;
    else break;
  }

  const today = todayISO();

  return {
    totalAportes,
    totalProfit,
    bankroll: startingBankroll + totalAportes + totalProfit,
    aporteCount: aportes.length,
    opCount: operations.length,
    wins,
    losses,
    winRate: decided ? (wins / decided) * 100 : 0,
    bestDay: results.length ? Math.max(...results) : 0,
    worstDay: results.length ? Math.min(...results) : 0,
    avgDay: results.length ? totalProfit / results.length : 0,
    todayResult: operations
      .filter((o) => o.date === today)
      .reduce((s, o) => s + o.result, 0),
    currentStreak: streak,
  };
}

export type SeriesPoint = { date: string; value: number; delta: number };

/** Evolucao da banca no tempo, juntando aportes + operacoes por data. */
export function bankrollSeries(
  operations: Operation[],
  aportes: Aporte[],
  startingBankroll = 0,
): SeriesPoint[] {
  type Ev = { date: string; delta: number; order: number };
  const evs: Ev[] = [
    ...aportes.map((a) => ({ date: a.date, delta: a.amount, order: 0 })),
    ...operations.map((o) => ({ date: o.date, delta: o.result, order: 1 })),
  ].sort((a, b) => (a.date === b.date ? a.order - b.order : a.date.localeCompare(b.date)));

  const byDate = new Map<string, number>();
  for (const e of evs) byDate.set(e.date, (byDate.get(e.date) ?? 0) + e.delta);

  const points: SeriesPoint[] = [];
  let running = startingBankroll;
  for (const [date, delta] of [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    running += delta;
    points.push({ date, value: running, delta });
  }
  return points;
}

export type MonthGroup = {
  key: string;
  operations: Operation[];
  net: number;
  wins: number;
  losses: number;
  winRate: number;
};

export function groupByMonth(operations: Operation[]): MonthGroup[] {
  const map = new Map<string, Operation[]>();
  for (const o of operations) {
    const k = monthKey(o.date);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(o);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, ops]) => {
      const sorted = [...ops].sort((a, b) => b.date.localeCompare(a.date));
      const wins = ops.filter((o) => o.result > 0).length;
      const losses = ops.filter((o) => o.result < 0).length;
      return {
        key,
        operations: sorted,
        net: ops.reduce((s, o) => s + o.result, 0),
        wins,
        losses,
        winRate: wins + losses ? (wins / (wins + losses)) * 100 : 0,
      };
    });
}

/* ------------------------------------------------------------------ */
/*  IMPOSTO                                                            */
/* ------------------------------------------------------------------ */

export type MonthTax = {
  key: string;
  /** resultado liquido das operacoes no mes */
  net: number;
  /** prejuizo de meses anteriores usado neste mes */
  lossUsed: number;
  /** prejuizo ainda a compensar depois deste mes */
  lossCarry: number;
  /** lucro sobre o qual incide o imposto */
  base: number;
  tax: number;
  /** lucro do mes menos o imposto (0 se o mes foi negativo) */
  withdrawable: number;
  /** vencimento: ultimo dia util do mes seguinte (yyyy-mm-dd) */
  dueDate: string;
};

/** Ultimo dia util (seg-sex) do mes seguinte a `key` (yyyy-mm). Nao considera feriados. */
export function taxDueDate(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m + 1, 0); // ultimo dia do mes seguinte
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() - 1);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Imposto mensal sobre o resultado liquido do mes (ganhos - perdas).
 * Mes negativo nao paga e, se `carryLosses`, o prejuizo abate o lucro dos
 * meses seguintes. Retorna do mes mais antigo ao mais recente.
 */
export function monthlyTaxes(
  operations: Operation[],
  rate: number,
  carryLosses: boolean,
): MonthTax[] {
  const nets = new Map<string, number>();
  for (const o of operations) {
    const k = monthKey(o.date);
    nets.set(k, (nets.get(k) ?? 0) + o.result);
  }
  let carry = 0;
  return [...nets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, rawNet]) => {
      const net = Math.round(rawNet * 100) / 100;
      let lossUsed = 0;
      if (net < 0) {
        if (carryLosses) carry += -net;
      } else if (carryLosses) {
        lossUsed = Math.min(carry, net);
        carry -= lossUsed;
      }
      const base = Math.max(0, net - lossUsed);
      const tax = Math.round(base * (rate / 100) * 100) / 100;
      return {
        key,
        net,
        lossUsed,
        lossCarry: carry,
        base,
        tax,
        withdrawable: net > 0 ? net - tax : 0,
        dueDate: taxDueDate(key),
      };
    });
}

/* ------------------------------------------------------------------ */
/*  PROJECAO                                                           */
/* ------------------------------------------------------------------ */

/**
 * Modelo estatistico simples para opcoes binarias / day trade.
 *
 *   valor por entrada  = banca * risco%
 *   valor esperado/op  = stake * (acerto% * payout% - erro%)
 *   lucro no mes       = EV/op * entradas   (ou composto entrada a entrada)
 *
 * Ponto de equilibrio (EV = 0):  acerto = 1 / (1 + payout)
 */
export function project(p: ProjectionParams, taxRate = 0): ProjectionResult {
  const bankroll = Math.max(0, p.bankroll);
  const risk = p.riskPerOp / 100;
  const win = clamp(p.winRate / 100, 0, 1);
  const payout = Math.max(0, p.payout / 100);
  const ops = Math.max(0, Math.round(p.opsPerMonth));
  const days = Math.max(1, Math.round(p.tradingDays));

  const stake = bankroll * risk;
  const edgePerOp = win * payout - (1 - win); // retorno esperado por unidade apostada
  const evPerOp = stake * edgePerOp;

  let endBankroll: number;
  let monthlyProfit: number;
  const curve: number[] = [bankroll];

  if (p.compound) {
    const growthPerOp = 1 + risk * edgePerOp;
    let b = bankroll;
    const opsPerDay = ops / days;
    let done = 0;
    for (let d = 1; d <= days; d++) {
      const target = Math.round(opsPerDay * d);
      while (done < target) {
        b = b * growthPerOp;
        done++;
      }
      curve.push(b);
    }
    endBankroll = b;
    monthlyProfit = endBankroll - bankroll;
  } else {
    monthlyProfit = evPerOp * ops;
    endBankroll = bankroll + monthlyProfit;
    for (let d = 1; d <= days; d++) curve.push(bankroll + (monthlyProfit / days) * d);
  }

  const taxOn = (profit: number) => (profit > 0 ? profit * (taxRate / 100) : 0);
  const tax = taxOn(monthlyProfit);
  const netMonthlyProfit = monthlyProfit - tax;
  // A curva acompanha o lucro liquido, pra terminar na banca ja sem imposto.
  const netScale = monthlyProfit > 0 ? netMonthlyProfit / monthlyProfit : 1;
  const netCurve = curve.map((v) => bankroll + (v - bankroll) * netScale);

  const scenarioRates = dedupe([
    Math.round(p.winRate) - 10,
    Math.round(p.winRate) - 5,
    Math.round(p.winRate),
    Math.round(p.winRate) + 5,
    Math.round(p.winRate) + 10,
  ]).filter((r) => r >= 0 && r <= 100);

  const scenarios = scenarioRates.map((r) => {
    const e = (r / 100) * payout - (1 - r / 100);
    return {
      winRate: r,
      monthlyProfit: (() => {
        const gross = p.compound
          ? bankroll * Math.pow(1 + risk * e, ops) - bankroll
          : stake * e * ops;
        return gross - taxOn(gross);
      })(),
      current: r === Math.round(p.winRate),
    };
  });

  return {
    stake,
    evPerOp,
    evPerOpPct: bankroll ? (evPerOp / bankroll) * 100 : 0,
    monthlyProfit,
    dailyProfit: monthlyProfit / days,
    monthlyRoi: bankroll ? (monthlyProfit / bankroll) * 100 : 0,
    endBankroll,
    tax,
    netMonthlyProfit,
    netDailyProfit: netMonthlyProfit / days,
    netEndBankroll: bankroll + netMonthlyProfit,
    breakEvenWinRate: payout > 0 ? (1 / (1 + payout)) * 100 : 100,
    edgePerOp,
    wins: Math.round(ops * win),
    losses: ops - Math.round(ops * win),
    curve: netCurve,
    scenarios,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
function dedupe(arr: number[]): number[] {
  return [...new Set(arr)];
}

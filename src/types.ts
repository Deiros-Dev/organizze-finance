export type Operation = {
  id: string;
  /** Data ISO (yyyy-mm-dd) */
  date: string;
  /** Resultado do dia em R$ — positivo = lucro, negativo = perda */
  result: number;
  note?: string;
  createdAt: string;
};

export type Aporte = {
  id: string;
  /** Data ISO (yyyy-mm-dd) */
  date: string;
  /** Valor aportado em R$ (positivo) */
  amount: number;
  note?: string;
  createdAt: string;
};

export type Theme = 'dark' | 'light';
export type View = 'dashboard' | 'operacoes' | 'aportes' | 'projecao' | 'ajustes';

export type Settings = {
  theme: Theme;
  monthlyGoal: number;
  currencyDisplay: 'symbol' | 'code';
  /** Banca inicial opcional (antes de qualquer aporte). Normalmente 0. */
  startingBankroll: number;
};

export type ProjectionParams = {
  bankroll: number;
  /** % da banca arriscada por entrada */
  riskPerOp: number;
  /** entradas por mes */
  opsPerMonth: number;
  /** % de acerto (assertividade) */
  winRate: number;
  /** % de retorno numa entrada vencedora (payout) */
  payout: number;
  /** dias operados no mes */
  tradingDays: number;
  /** reinveste o lucro ao longo do mes */
  compound: boolean;
};

export type ProjectionResult = {
  stake: number;
  evPerOp: number;
  evPerOpPct: number;
  monthlyProfit: number;
  dailyProfit: number;
  monthlyRoi: number;
  endBankroll: number;
  breakEvenWinRate: number;
  edgePerOp: number;
  wins: number;
  losses: number;
  /** serie de evolucao da banca ao longo do mes (por dia) */
  curve: number[];
  /** cenarios variando a assertividade */
  scenarios: { winRate: number; monthlyProfit: number; current: boolean }[];
};

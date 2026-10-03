export type Operation = {
  id: string;
  /** Data ISO (yyyy-mm-dd) */
  date: string;
  /** Resultado do dia em R$ — positivo = lucro, negativo = perda */
  result: number;
  note?: string;
  /** Paths dos prints no bucket "operation-photos" */
  photos: string[];
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
export type View = 'dashboard' | 'operacoes' | 'aportes' | 'projecao' | 'impostos' | 'ajustes';

export type Settings = {
  theme: Theme;
  monthlyGoal: number;
  currencyDisplay: 'symbol' | 'code';
  /** Banca inicial opcional (antes de qualquer aporte). Normalmente 0. */
  startingBankroll: number;
  /** Aliquota do imposto sobre o lucro mensal, em % */
  taxRate: number;
  /** Compensa prejuizo de meses anteriores no calculo do imposto */
  taxCarryLosses: boolean;
};

/** Print da banca real na corretora, com o saldo que aparece nele. */
export type BankrollProof = {
  id: string;
  /** Data ISO (yyyy-mm-dd) do print */
  date: string;
  /** Saldo mostrado no print, em R$ */
  balance: number;
  /** Path do print no bucket "operation-photos" */
  photo: string;
  note?: string;
  createdAt: string;
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
  /** imposto sobre o lucro projetado (0 se nao houver lucro) */
  tax: number;
  /** lucro do mes depois do imposto */
  netMonthlyProfit: number;
  netDailyProfit: number;
  /** banca no fim do mes ja descontado o imposto */
  netEndBankroll: number;
  breakEvenWinRate: number;
  edgePerOp: number;
  wins: number;
  losses: number;
  /** serie de evolucao da banca ao longo do mes (por dia) */
  curve: number[];
  /** cenarios variando a assertividade */
  scenarios: { winRate: number; monthlyProfit: number; current: boolean }[];
};

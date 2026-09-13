export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

const nf2 = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const nf0 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 });

/** R$ 1.234,56 */
export function brl(n: number, prefix = 'R$'): string {
  const v = Number.isFinite(n) ? n : 0;
  return `${prefix} ${nf2.format(v)}`;
}

/** +R$ 1.234,56 / -R$ 450,00 */
export function brlSigned(n: number, prefix = 'R$'): string {
  const v = Number.isFinite(n) ? n : 0;
  const sign = v > 0 ? '+' : v < 0 ? '-' : '';
  return `${sign}${prefix} ${nf2.format(Math.abs(v))}`;
}

/** R$ 12,3 mil — versao compacta para eixos de grafico */
export function brlCompact(n: number): string {
  const v = Number.isFinite(n) ? n : 0;
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}R$ ${nf2.format(abs / 1_000_000)} mi`;
  if (abs >= 1_000) return `${sign}R$ ${nf0.format(abs / 1_000)} mil`;
  return `${sign}R$ ${nf0.format(abs)}`;
}

export function pct(n: number, digits = 1): string {
  const v = Number.isFinite(n) ? n : 0;
  return `${v.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function pctSigned(n: number, digits = 1): string {
  const v = Number.isFinite(n) ? n : 0;
  const sign = v > 0 ? '+' : '';
  return `${sign}${pct(v, digits)}`;
}

/** hoje em ISO yyyy-mm-dd (fuso local) */
export function todayISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60_000).toISOString().slice(0, 10);
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** 09/09 */
export function dayMonth(iso: string): string {
  const d = parseISO(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** 09/09/2025 */
export function dateBR(iso: string): string {
  const d = parseISO(iso);
  return d.toLocaleDateString('pt-BR');
}

export function weekday(iso: string): string {
  return WEEKDAYS[parseISO(iso).getDay()];
}

const WEEKDAYS_FULL = [
  'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira',
  'quinta-feira', 'sexta-feira', 'sábado',
];

export function weekdayFull(iso: string): string {
  return WEEKDAYS_FULL[parseISO(iso).getDay()];
}

/** "set" */
export function monthAbbrev(iso: string): string {
  return MONTHS[parseISO(iso).getMonth()].slice(0, 3);
}

/** "Setembro 2025" */
export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number);
  const name = MONTHS[(m || 1) - 1];
  return `${name[0].toUpperCase()}${name.slice(1)} ${y}`;
}

/** chave de mes yyyy-mm a partir de uma data ISO */
export function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

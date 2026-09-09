import type { Aporte, Operation } from '../types';
import { uid } from './format';

/** Dados de exemplo (baseados no print de referencia). */
export function sampleData(): { operations: Operation[]; aportes: Aporte[] } {
  const now = new Date().toISOString();
  const aportes: Aporte[] = [
    { id: uid(), date: '2025-08-30', amount: 2500, note: 'Aporte inicial', createdAt: now },
    { id: uid(), date: '2025-09-01', amount: 10000, note: '', createdAt: now },
    { id: uid(), date: '2025-09-04', amount: 3000, note: '', createdAt: now },
  ];
  const raw: [string, number][] = [
    ['2025-08-31', 255.86],
    ['2025-09-01', 613.85],
    ['2025-09-02', 585.0],
    ['2025-09-03', 42.0],
    ['2025-09-04', 455.01],
    ['2025-09-05', -450.0],
    ['2025-09-07', 250.0],
    ['2025-09-08', 457.0],
  ];
  const operations: Operation[] = raw.map(([date, result]) => ({
    id: uid(),
    date,
    result,
    note: '',
    createdAt: now,
  }));
  return { operations, aportes };
}

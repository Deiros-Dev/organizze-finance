/** Dados de exemplo (baseados no print de referencia) — prontos para insert. */
export function sampleRows(): {
  operations: { date: string; result: number; note: string }[];
  aportes: { date: string; amount: number; note: string }[];
} {
  const aportes = [
    { date: '2025-08-30', amount: 2500, note: 'Aporte inicial' },
    { date: '2025-09-01', amount: 10000, note: '' },
    { date: '2025-09-04', amount: 3000, note: '' },
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
  const operations = raw.map(([date, result]) => ({ date, result, note: '' }));
  return { operations, aportes };
}

import { useId } from 'react';

/* --------------------------- Area / line chart --------------------------- */

export function AreaChart({
  data,
  height = 180,
  strokeWidth = 2,
  className,
}: {
  data: number[];
  height?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const id = useId().replace(/:/g, '');
  const w = 600;
  const h = height;
  const pad = 6;

  if (data.length < 2) {
    return (
      <div
        className={className}
        style={{ height }}
        aria-hidden
      />
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / (data.length - 1);

  const pts = data.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (h - pad * 2) * (1 - (v - min) / span);
    return [x, y] as const;
  });

  const line = pts
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ');
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h} L${pts[0][0].toFixed(
    1,
  )},${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: '100%', height, display: 'block' }}
    >
      <defs>
        <linearGradient id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${id})`} />
      <path
        d={line}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r={3.5}
        fill="var(--accent)"
        stroke="var(--elevated)"
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ------------------------------ Bar chart ------------------------------ */

export function BarChart({
  data,
  height = 150,
  format,
}: {
  data: { label: string; value: number; highlight?: boolean }[];
  height?: number;
  format?: (v: number) => string;
}) {
  const vals = data.map((d) => d.value);
  const maxV = Math.max(0, ...vals);
  const minV = Math.min(0, ...vals);
  const span = maxV - minV || 1;
  const labelH = 18;
  const valueH = 16;
  const plotH = Math.max(24, height - labelH - valueH);
  const zeroY = valueH + (maxV / span) * plotH; // distância do topo até a linha do zero

  return (
    <div className="w-full">
      <div
        className="relative flex items-stretch gap-2"
        style={{ height: valueH + plotH }}
      >
        {/* linha do zero */}
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line-2"
          style={{ top: zeroY }}
        />
        {data.map((d, i) => {
          const barH = (Math.abs(d.value) / span) * plotH;
          const neg = d.value < 0;
          return (
            <div key={i} className="relative flex flex-1 flex-col">
              <span
                className="tnum absolute inset-x-0 text-center text-[10px] font-medium text-faint"
                style={{ top: neg ? zeroY + barH + 2 : Math.max(zeroY - barH - valueH, 0) }}
              >
                {format ? format(d.value) : d.value}
              </span>
              <div
                className="absolute left-1/2 w-[70%] -translate-x-1/2 rounded-[5px] transition-all"
                style={{
                  top: neg ? zeroY : zeroY - barH,
                  height: Math.max(barH, 2),
                  background: neg
                    ? 'var(--negative)'
                    : d.highlight
                      ? 'var(--accent)'
                      : 'var(--accent-soft)',
                  border: neg
                    ? 'none'
                    : d.highlight
                      ? 'none'
                      : '1px solid var(--line-2)',
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-2" style={{ height: labelH }}>
        {data.map((d, i) => (
          <div
            key={i}
            className={
              'flex-1 pt-1 text-center text-[11px] ' +
              (d.highlight ? 'font-semibold text-ink' : 'text-faint')
            }
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- Daily P/L bars --------------------------- */

export function DailyBars({
  data,
  height = 120,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => Math.abs(d.value)));
  return (
    <div
      className="flex items-center gap-1.5"
      style={{ height }}
      role="img"
      aria-label="Resultado por dia"
    >
      {data.map((d, i) => {
        const ratio = (Math.abs(d.value) / max) * 50;
        const neg = d.value < 0;
        return (
          <div
            key={i}
            className="group relative flex flex-1 flex-col items-stretch"
            style={{ height: '100%' }}
            title={`${d.label}`}
          >
            <div className="flex flex-1 flex-col justify-end">
              <div
                className="rounded-t-[3px]"
                style={{
                  height: `${neg ? 0 : ratio}%`,
                  background: 'var(--positive)',
                }}
              />
            </div>
            <div className="h-px bg-line-2" />
            <div className="flex flex-1 flex-col justify-start">
              <div
                className="rounded-b-[3px]"
                style={{
                  height: `${neg ? ratio : 0}%`,
                  background: 'var(--negative)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

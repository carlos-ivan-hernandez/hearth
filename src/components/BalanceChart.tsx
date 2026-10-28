import {useEffect, useRef, useState} from 'react';
import {type Schedule, usd, usdCompact} from '../finance';

const HEIGHT = 220;
const PAD = {top: 12, right: 16, bottom: 26, left: 52};

interface Series {
  label: string;
  schedule: Schedule;
  dashed?: boolean;
}

const balanceAt = (s: Series, year: number) => s.schedule.years.find(row => row.year === year)?.balance ?? 0;

const useWidth = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
};

/** Loan balance by year; a second, dashed series shows the plan without extra payments. */
export const BalanceChart = ({series, termYears}: {series: Series[]; termYears: number}) => {
  const [ref, width] = useWidth();
  const [hoverYear, setHoverYear] = useState<number | null>(null);
  const maxBalance = Math.max(...series.map(s => s.schedule.years[0]?.balance ?? 0), 1);
  const plotWidth = Math.max(width - PAD.left - PAD.right, 10);
  const plotHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (year: number) => PAD.left + (year / termYears) * plotWidth;
  const y = (balance: number) => PAD.top + plotHeight - (balance / maxBalance) * plotHeight;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => f * maxBalance);
  const yearTicks = Array.from({length: Math.floor(termYears / 5) + 1}, (_, i) => i * 5);

  const onMove = (event: React.PointerEvent<SVGRectElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const year = Math.round(((event.clientX - box.left) / box.width) * termYears);
    setHoverYear(Math.min(Math.max(year, 0), termYears));
  };

  return (
    <div
      ref={ref}
      className='relative px-2 pt-3'
    >
      <svg
        width={width}
        height={HEIGHT}
        role='img'
        aria-label='Loan balance by year'
        className='block max-w-full overflow-visible'
      >
        {ticks.map(tick => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={PAD.left + plotWidth}
              y1={y(tick)}
              y2={y(tick)}
              className='stroke-separator'
            />
            <text
              x={PAD.left - 8}
              y={y(tick)}
              dy='0.32em'
              textAnchor='end'
              className='fill-muted text-[11px] tabular-nums'
            >
              {usdCompact(tick)}
            </text>
          </g>
        ))}
        {yearTicks.map(year => (
          <text
            key={year}
            x={x(year)}
            y={HEIGHT - 6}
            textAnchor='middle'
            className='fill-muted text-[11px] tabular-nums'
          >
            {year === 0 ? 'Now' : `${year} yr`}
          </text>
        ))}
        {series.map(s => (
          <polyline
            key={s.label}
            points={s.schedule.years.map(row => `${x(row.year)},${y(row.balance)}`).join(' ')}
            fill='none'
            strokeWidth={2}
            strokeLinejoin='round'
            strokeDasharray={s.dashed ? '5 4' : undefined}
            className={s.dashed ? 'stroke-muted' : 'stroke-accent'}
          />
        ))}
        {hoverYear !== null && (
          <g>
            <line
              x1={x(hoverYear)}
              x2={x(hoverYear)}
              y1={PAD.top}
              y2={PAD.top + plotHeight}
              className='stroke-border'
            />
            {series.map(s => (
              <circle
                key={s.label}
                cx={x(hoverYear)}
                cy={y(balanceAt(s, hoverYear))}
                r={4}
                strokeWidth={2}
                className={`stroke-surface ${s.dashed ? 'fill-muted' : 'fill-accent'}`}
              />
            ))}
          </g>
        )}
        <rect
          x={PAD.left}
          y={PAD.top}
          width={plotWidth}
          height={plotHeight}
          fill='transparent'
          onPointerMove={onMove}
          onPointerLeave={() => setHoverYear(null)}
        />
      </svg>
      {hoverYear !== null && (
        <div
          className='pointer-events-none absolute top-2 rounded-lg border border-border bg-overlay px-3 py-2 text-xs shadow-overlay'
          style={{
            left: Math.min(x(hoverYear) + 16, width - 170),
          }}
        >
          <div className='mb-1 font-medium'>{hoverYear === 0 ? 'Move-in' : `After ${hoverYear} years`}</div>
          {series.map(s => (
            <div
              key={s.label}
              className='flex items-center justify-between gap-4'
            >
              <span className='text-muted'>{s.label}</span>
              <span className='tabular-nums'>{usd(balanceAt(s, hoverYear))}</span>
            </div>
          ))}
        </div>
      )}
      {series.length > 1 && (
        <div className='flex flex-wrap gap-4 px-2 pb-3 text-xs text-muted'>
          {series.map(s => (
            <span
              key={s.label}
              className='flex items-center gap-1.5'
            >
              <svg
                width='18'
                height='4'
              >
                <line
                  x1='0'
                  x2='18'
                  y1='2'
                  y2='2'
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? '5 4' : undefined}
                  className={s.dashed ? 'stroke-muted' : 'stroke-accent'}
                />
              </svg>
              {s.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

import {usd} from '../finance';

export interface Bar {
  label: string;
  value: number;
  note?: string;
}

/** Horizontal bars in one hue, each labeled with its value, sharing one scale. */
export const BarList = ({bars, total}: {bars: Bar[]; total: number}) => {
  const max = Math.max(...bars.map(bar => bar.value), 1);
  return (
    <div className='flex flex-col gap-2.5 p-4'>
      {bars.map(bar => (
        <div
          key={bar.label}
          className='grid grid-cols-[minmax(7rem,10rem)_1fr_auto] items-center gap-3 text-sm'
          title={`${bar.label}: ${usd(bar.value)} (${total > 0 ? Math.round((bar.value / total) * 100) : 0}%)`}
        >
          <span className='truncate text-muted'>{bar.label}</span>
          <div className='h-2 rounded-full bg-default/60'>
            <div
              className='h-full rounded-full bg-accent'
              style={{width: `${(bar.value / max) * 100}%`}}
            />
          </div>
          <span className='w-20 text-right tabular-nums'>{usd(bar.value)}</span>
        </div>
      ))}
    </div>
  );
};

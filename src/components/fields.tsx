import {Label, NumberField} from '@heroui/react';
import type {ReactNode} from 'react';

const MONEY: Intl.NumberFormatOptions = {style: 'currency', currency: 'USD', maximumFractionDigits: 0};
const DECIMAL: Intl.NumberFormatOptions = {maximumFractionDigits: 2};

interface NumberRowProps {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  maxValue?: number;
  suffix?: string;
  /** A control beside the field, such as a unit switch. */
  action?: ReactNode;
}

const NumberRow = ({
  label,
  hint,
  value,
  onChange,
  step,
  maxValue,
  suffix,
  action,
  format,
}: NumberRowProps & {
  format: Intl.NumberFormatOptions;
}) => (
  <NumberField
    value={value}
    onChange={next => onChange(Number.isNaN(next) ? 0 : next)}
    minValue={0}
    maxValue={maxValue}
    step={step}
    formatOptions={format}
    className='flex-row items-center justify-between gap-3 px-3 py-2'
  >
    <div className='min-w-0 flex-1'>
      <Label className='text-sm font-normal'>{label}</Label>
      {hint && <div className='text-xs text-muted'>{hint}</div>}
    </div>
    {action}
    <NumberField.Group className='h-8 w-32 shrink-0 [grid-template-columns:1fr_auto]'>
      <NumberField.Input className='px-2.5 text-right' />
      <span className='pr-2.5 text-xs text-muted'>{suffix}</span>
    </NumberField.Group>
  </NumberField>
);

export const MoneyRow = (props: NumberRowProps) => (
  <NumberRow
    step={1000}
    {...props}
    format={MONEY}
  />
);

export const PercentRow = (props: NumberRowProps) => (
  <NumberRow
    step={0.125}
    maxValue={100}
    suffix='%'
    {...props}
    format={DECIMAL}
  />
);

export const CountRow = (props: NumberRowProps) => (
  <NumberRow
    step={1}
    {...props}
    format={DECIMAL}
  />
);

/** A row of mutually exclusive options, in vera's segmented style. */
export const Segmented = <T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: {id: T; label: string}[];
  value: T;
  onChange: (value: T) => void;
}) => (
  <div
    role='radiogroup'
    aria-label={label}
    className='segmented shrink-0 flex-nowrap'
  >
    {options.map(option => (
      <button
        key={option.id}
        type='button'
        role='radio'
        aria-checked={value === option.id}
        className='segmented-item'
        data-active={value === option.id}
        onClick={() => onChange(option.id)}
      >
        {option.label}
      </button>
    ))}
  </div>
);

/** A titled, rounded group of rows separated by hairlines, like vera's settings. */
export const Group = ({title, children}: {title: string; children: ReactNode}) => (
  <section className='flex flex-col gap-1.5'>
    <h3 className='section-label px-1'>{title}</h3>
    <div className='group-card divide-y divide-border'>{children}</div>
  </section>
);

/** A headline figure with a label above and a note below. */
export const Stat = ({label, value, note}: {label: string; value: ReactNode; note?: ReactNode}) => (
  <div className='group-card flex flex-col gap-1 p-4'>
    <div className='section-label'>{label}</div>
    <div className='text-2xl font-semibold tracking-tight tabular-nums'>{value}</div>
    {note && <div className='text-xs text-muted'>{note}</div>}
  </div>
);

/** Label and value on one line, for breakdown lists. */
export const Line = ({label, value, strong}: {label: ReactNode; value: ReactNode; strong?: boolean}) => (
  <div className={`flex items-baseline justify-between gap-4 px-4 py-2 text-sm ${strong ? 'font-semibold' : ''}`}>
    <span className={strong ? '' : 'text-muted'}>{label}</span>
    <span className='tabular-nums'>{value}</span>
  </div>
);

export const Panel = ({title, description, children}: {title: string; description?: string; children: ReactNode}) => (
  <section className='flex flex-col gap-2'>
    <div className='px-1'>
      <h2 className='text-sm font-semibold'>{title}</h2>
      {description && <p className='text-xs text-muted'>{description}</p>}
    </div>
    {children}
  </section>
);

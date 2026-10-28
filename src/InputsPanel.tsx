import {Label, Slider} from '@heroui/react';
import {CountRow, Group, MoneyRow, PercentRow, SwitchRow} from './components/fields';
import type {CostMode, Plan} from './plan';

const COST_MODES: {id: CostMode; label: string}[] = [
  {id: 'total', label: 'Total'},
  {id: 'itemized', label: 'Itemized'},
];

export type SetField = <K extends keyof Plan>(key: K, value: Plan[K]) => void;

export const InputsPanel = ({plan, set}: {plan: Plan; set: SetField}) => (
  <div className='flex flex-col gap-5'>
    <Group title='Household'>
      <MoneyRow
        label='Gross income'
        hint='Per year, before taxes'
        suffix='/yr'
        value={plan.income}
        onChange={v => set('income', v)}
      />
      <MoneyRow
        label='Other debt payments'
        hint='Car, student loans, cards'
        suffix='/mo'
        step={50}
        value={plan.monthlyDebts}
        onChange={v => set('monthlyDebts', v)}
      />
      <MoneyRow
        label='Savings'
        hint='Cash you could put toward this'
        value={plan.savings}
        onChange={v => set('savings', v)}
      />
      <MoneyRow
        label='Living costs'
        hint='Monthly, not counting housing'
        suffix='/mo'
        step={100}
        value={plan.livingCosts}
        onChange={v => set('livingCosts', v)}
      />
      <CountRow
        label='Emergency fund'
        hint='Months of costs to keep untouched'
        suffix='mo'
        value={plan.reserveMonths}
        onChange={v => set('reserveMonths', v)}
      />
    </Group>

    <Group
      title='Land and build'
      action={
        <div className='segmented'>
          {COST_MODES.map(mode => (
            <button
              key={mode.id}
              type='button'
              className='segmented-item'
              data-active={plan.costMode === mode.id}
              onClick={() => set('costMode', mode.id)}
            >
              {mode.label}
            </button>
          ))}
        </div>
      }
    >
      {plan.costMode === 'total' ? (
        <MoneyRow
          label='Total cost'
          hint='Land, construction and fees together'
          value={plan.totalCost}
          onChange={v => set('totalCost', v)}
        />
      ) : (
        <>
          <MoneyRow
            label='Land'
            value={plan.landCost}
            onChange={v => set('landCost', v)}
          />
          <SwitchRow
            label='I already own the land'
            hint='Its value counts toward the down payment'
            value={plan.landOwned}
            onChange={v => set('landOwned', v)}
          />
          <MoneyRow
            label='Construction'
            hint="The builder's contract price"
            value={plan.construction}
            onChange={v => set('construction', v)}
          />
          <MoneyRow
            label='Other costs'
            hint='Site work, permits, design'
            value={plan.otherCosts}
            onChange={v => set('otherCosts', v)}
          />
          <PercentRow
            label='Contingency'
            hint='Cushion for overruns'
            step={1}
            value={plan.contingencyPct}
            onChange={v => set('contingencyPct', v)}
          />
        </>
      )}
      <CountRow
        label='Build time'
        suffix='mo'
        value={plan.buildMonths}
        onChange={v => set('buildMonths', v)}
      />
      <PercentRow
        label='Construction loan rate'
        hint='Interest-only while building'
        value={plan.constructionRate}
        onChange={v => set('constructionRate', v)}
      />
      <MoneyRow
        label='Value when finished'
        hint='What an appraiser would say'
        value={plan.completedValue}
        onChange={v => set('completedValue', v)}
      />
    </Group>

    <Group title='Mortgage'>
      <Slider
        value={plan.downPct}
        onChange={v => set('downPct', Array.isArray(v) ? v[0] : v)}
        minValue={0}
        maxValue={60}
        step={1}
        className='gap-2 px-3 py-3'
      >
        <div className='flex items-center justify-between'>
          <Label className='text-sm font-normal'>Down payment</Label>
          <Slider.Output className='text-sm tabular-nums'>{({state}) => `${state.values[0]}%`}</Slider.Output>
        </div>
        <Slider.Track>
          <Slider.Fill />
          <Slider.Thumb />
        </Slider.Track>
      </Slider>
      <PercentRow
        label='Interest rate'
        value={plan.rate}
        onChange={v => set('rate', v)}
      />
      <CountRow
        label='Term'
        suffix='yrs'
        step={5}
        value={plan.termYears}
        onChange={v => set('termYears', Math.max(v, 1))}
      />
      <PercentRow
        label='Closing costs'
        hint='Share of the loan'
        step={0.5}
        value={plan.closingPct}
        onChange={v => set('closingPct', v)}
      />
      <PercentRow
        label='Property tax'
        hint='Share of value, per year'
        step={0.1}
        value={plan.taxRate}
        onChange={v => set('taxRate', v)}
      />
      <MoneyRow
        label='Home insurance'
        suffix='/yr'
        step={100}
        value={plan.insurance}
        onChange={v => set('insurance', v)}
      />
      <MoneyRow
        label='HOA'
        suffix='/mo'
        step={25}
        value={plan.hoa}
        onChange={v => set('hoa', v)}
      />
      <PercentRow
        label='PMI'
        hint='Per year, when you put down under 20%'
        step={0.1}
        value={plan.pmiRate}
        onChange={v => set('pmiRate', v)}
      />
      <MoneyRow
        label='Extra principal'
        hint='Paid on top each month'
        suffix='/mo'
        step={50}
        value={plan.extraMonthly}
        onChange={v => set('extraMonthly', v)}
      />
    </Group>
  </div>
);

import {Label, Slider} from '@heroui/react';
import {CountRow, Group, MoneyRow, PercentRow, Segmented} from './components/fields';
import {fixedPeriod} from './finance';
import type {ClosingMode, LoanType, Plan} from './plan';

const LOAN_OPTIONS: {id: LoanType; label: string}[] = [
  {id: 'fixed', label: 'Fixed'},
  {id: 'arm5', label: '5/1'},
  {id: 'arm7', label: '7/1'},
  {id: 'arm10', label: '10/1'},
];

const CLOSING_OPTIONS: {id: ClosingMode; label: string}[] = [
  {id: 'percent', label: '%'},
  {id: 'amount', label: '$'},
];

export type SetField = <K extends keyof Plan>(key: K, value: Plan[K]) => void;

export const InputsPanel = ({plan, set}: {plan: Plan; set: SetField}) => {
  const arm = plan.loanType !== 'fixed';
  const resetYear = fixedPeriod(plan);
  const closingProps = {
    label: 'Closing costs',
    step: plan.closingMode === 'amount' ? 500 : 0.5,
    action: (
      <Segmented
        label='Closing costs as'
        options={CLOSING_OPTIONS}
        value={plan.closingMode}
        onChange={mode => set('closingMode', mode)}
      />
    ),
  };

  return (
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
          label='Cash savings'
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

      <Group title='Build'>
        <MoneyRow
          label='Total cost'
          hint='Land, construction and fees together'
          value={plan.totalCost}
          onChange={v => set('totalCost', v)}
        />
        <MoneyRow
          label='Rent while building'
          hint='Where you live until move-in'
          suffix='/mo'
          step={100}
          value={plan.rentWhileBuilding}
          onChange={v => set('rentWhileBuilding', v)}
        />
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
        <div className='flex items-center justify-between gap-3 px-3 py-2'>
          <span className='text-sm'>Loan type</span>
          <Segmented
            label='Loan type'
            options={LOAN_OPTIONS}
            value={plan.loanType}
            onChange={type => set('loanType', type)}
          />
        </div>
        <PercentRow
          label={arm ? 'Starting rate' : 'Interest rate'}
          hint={arm && resetYear ? `Locked for ${resetYear} years` : undefined}
          value={plan.rate}
          onChange={v => set('rate', v)}
        />
        {arm && (
          <PercentRow
            label='Rate after reset'
            hint={resetYear ? `Your guess for year ${resetYear + 1} on` : 'The term ends before a reset'}
            value={plan.armRate}
            onChange={v => set('armRate', v)}
          />
        )}
        <CountRow
          label='Term'
          suffix='yrs'
          step={5}
          value={plan.termYears}
          onChange={v => set('termYears', Math.max(v, 1))}
        />
        {plan.closingMode === 'amount' ? (
          <MoneyRow
            {...closingProps}
            value={plan.closingAmount}
            onChange={v => set('closingAmount', v)}
          />
        ) : (
          <PercentRow
            {...closingProps}
            value={plan.closingPct}
            onChange={v => set('closingPct', v)}
          />
        )}
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
};

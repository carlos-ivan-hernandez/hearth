import {BalanceChart} from '../components/BalanceChart';
import {Panel, Stat} from '../components/fields';
import {amortize, type BuildCosts, duration, fixedPeriod, usd} from '../finance';
import type {Plan} from '../plan';

export const Payoff = ({plan, build}: {plan: Plan; build: BuildCosts}) => {
  const base = amortize(build.loan, plan);
  const withExtra = plan.extraMonthly > 0 ? amortize(build.loan, plan, plan.extraMonthly) : null;
  const schedule = withExtra ?? base;
  const resetYear = fixedPeriod(plan);
  // Lenders drop PMI once the balance falls to 78% of the home's value.
  const pmiEnds = schedule.years.find(row => row.balance <= 0.78 * (plan.completedValue || build.project))?.year;

  return (
    <div className='flex flex-col gap-6'>
      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <Stat
          label='Paid off in'
          value={duration(schedule.months)}
          note={withExtra ? `${duration(base.months - withExtra.months)} sooner` : `${plan.termYears}-year term`}
        />
        <Stat
          label='Total interest'
          value={usd(schedule.totalInterest)}
          note={
            withExtra ? `${usd(base.totalInterest - withExtra.totalInterest)} saved` : 'Add extra principal to save'
          }
        />
        <Stat
          label='Total paid to the bank'
          value={usd(build.loan + schedule.totalInterest)}
        />
        <Stat
          label='PMI ends'
          value={build.housing.pmi > 0 ? (pmiEnds !== undefined ? `Year ${pmiEnds}` : '—') : 'No PMI'}
          note={build.housing.pmi > 0 ? 'When the balance reaches 78% of value' : '20% or more down'}
        />
      </div>

      <Panel
        title='Loan balance'
        description={
          resetYear ? `Starts at ${plan.rate}%, then assumes ${plan.armRate}% from year ${resetYear + 1}.` : undefined
        }
      >
        <div className='group-card'>
          <BalanceChart
            termYears={plan.termYears}
            series={
              withExtra
                ? [
                    {label: `With ${usd(plan.extraMonthly)}/mo extra`, schedule: withExtra},
                    {label: 'Regular payments', schedule: base, dashed: true},
                  ]
                : [{label: 'Balance', schedule: base}]
            }
          />
        </div>
      </Panel>

      <Panel title='Year by year'>
        <div className='group-card max-h-96 overflow-auto'>
          <table className='w-full text-sm'>
            <thead className='sticky top-0 bg-surface'>
              <tr className='border-b border-border text-right text-xs text-muted'>
                <th className='px-4 py-2.5 text-left font-medium'>Year</th>
                <th className='px-4 py-2.5 font-medium'>Principal</th>
                <th className='px-4 py-2.5 font-medium'>Interest</th>
                <th className='px-4 py-2.5 font-medium'>Balance</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-border'>
              {schedule.years.slice(1).map(row => (
                <tr
                  key={row.year}
                  className='text-right tabular-nums'
                >
                  <td className='px-4 py-1.5 text-left text-muted'>{row.year}</td>
                  <td className='px-4 py-1.5'>{usd(row.principal)}</td>
                  <td className='px-4 py-1.5'>{usd(row.interest)}</td>
                  <td className='px-4 py-1.5'>{usd(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};

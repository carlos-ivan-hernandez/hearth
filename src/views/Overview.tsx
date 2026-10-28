import {BarList} from '../components/BarList';
import {Line, Panel, Stat} from '../components/fields';
import {StatusChip} from '../components/StatusChip';
import {type BuildCosts, dti, pct, reserveNeeded, usd, verdict} from '../finance';
import type {Plan} from '../plan';

const HEADLINES = {
  good: 'Building looks affordable.',
  stretch: 'You can build, but it will be tight.',
  risky: 'This plan carries real risk.',
};

export const Overview = ({plan, build}: {plan: Plan; build: BuildCosts}) => {
  const {checks, overall} = verdict(plan, build);
  const {back} = dti(plan, build.housing.total);
  const left = plan.savings - build.cashNeeded;
  const h = build.housing;

  return (
    <div className='flex flex-col gap-6'>
      <div className='group-card flex flex-col gap-2 p-5'>
        <StatusChip status={overall} />
        <h2 className='text-xl font-semibold tracking-tight'>{HEADLINES[overall]}</h2>
        <p className='text-sm text-muted'>
          Borrowing {usd(build.loan)} at {plan.rate}% for {plan.termYears} years, with {plan.downPct}% down, comes to{' '}
          {usd(h.total)} a month for housing.
        </p>
      </div>

      <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
        <Stat
          label='Monthly housing'
          value={usd(h.total)}
          note={`${pct(back)} of income with other debts`}
        />
        <Stat
          label='Mortgage'
          value={usd(build.loan)}
          note={`${plan.downPct}% down`}
        />
        <Stat
          label='Cash up front'
          value={usd(build.cashNeeded)}
          note={`${usd(left)} of savings left`}
        />
        <Stat
          label='Cost to build'
          value={usd(build.allIn)}
          note={`Worth ${usd(plan.completedValue)} when done`}
        />
      </div>

      <Panel title='Checks'>
        <div className='group-card divide-y divide-border'>
          {checks.map(check => (
            <div
              key={check.title}
              className='flex flex-col gap-1 px-4 py-3'
            >
              <div className='flex items-center justify-between gap-3'>
                <span className='text-sm font-medium'>{check.title}</span>
                <StatusChip
                  status={check.status}
                  label={check.status === 'good' ? 'OK' : undefined}
                />
              </div>
              <p className='text-xs text-muted'>{check.detail}</p>
            </div>
          ))}
        </div>
      </Panel>

      <div className='grid gap-6 xl:grid-cols-2'>
        <Panel
          title='Where the money goes'
          description='Everything spent before move-in.'
        >
          <div className='group-card'>
            <BarList
              total={build.allIn}
              bars={[
                ...(plan.costMode === 'total'
                  ? [{label: 'Project', value: build.project}]
                  : [
                      {label: 'Construction', value: build.construction},
                      {label: 'Land', value: build.land},
                      {label: 'Other costs', value: build.otherCosts},
                      {label: 'Contingency', value: build.contingency},
                    ]),
                {label: 'Construction interest', value: build.constructionInterest},
                {label: 'Closing costs', value: build.closing},
              ]}
            />
          </div>
        </Panel>

        <Panel
          title='Monthly payment'
          description='After the house is finished and the loan converts to a mortgage.'
        >
          <div className='group-card divide-y divide-border py-1'>
            <Line
              label='Principal and interest'
              value={usd(h.principalInterest)}
            />
            <Line
              label='Property tax'
              value={usd(h.tax)}
            />
            <Line
              label='Insurance'
              value={usd(h.insurance)}
            />
            {h.pmi > 0 && (
              <Line
                label='PMI (until you reach 20% equity)'
                value={usd(h.pmi)}
              />
            )}
            {h.hoa > 0 && (
              <Line
                label='HOA'
                value={usd(h.hoa)}
              />
            )}
            <Line
              strong
              label='Total'
              value={usd(h.total)}
            />
            <Line
              label={`Emergency fund to keep (${plan.reserveMonths} months)`}
              value={usd(reserveNeeded(plan, h.total))}
            />
          </div>
        </Panel>
      </div>
    </div>
  );
};

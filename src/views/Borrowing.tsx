import {Table} from '@heroui/react';
import {Panel, Stat} from '../components/fields';
import {StatusChip} from '../components/StatusChip';
import {
  amortize,
  buildCosts,
  dti,
  housingCost,
  maxCostByCash,
  maxCostByIncome,
  paymentStatus,
  pct,
  reserveNeeded,
  usd,
} from '../finance';
import type {Plan} from '../plan';

const DOWN_OPTIONS = [5, 10, 15, 20, 25, 30, 40];
const RATE_STEPS = [-1, -0.5, 0, 0.5, 1];

export const Borrowing = ({plan, onPickDown}: {plan: Plan; onPickDown: (downPct: number) => void}) => {
  const downOptions = [...new Set([...DOWN_OPTIONS, plan.downPct])].toSorted((a, b) => a - b);
  const build = buildCosts(plan);

  return (
    <div className='flex flex-col gap-6'>
      <Panel
        title='What you can afford'
        description={`The biggest total project cost at ${plan.downPct}% down and ${plan.rate}%, counting tax, insurance and PMI. The lower of income and savings is your real limit.`}
      >
        <div className='grid gap-3 sm:grid-cols-3'>
          <Stat
            label='Comfortable on income'
            value={usd(maxCostByIncome(plan, 'comfortable'))}
            note='Housing ≤ 28%, all debts ≤ 36%'
          />
          <Stat
            label='Stretch on income'
            value={usd(maxCostByIncome(plan, 'stretch'))}
            note='All debts ≤ 43%, the usual lender cap'
          />
          <Stat
            label='Covered by savings'
            value={usd(maxCostByCash(plan))}
            note='Down payment and closing, keeping the emergency fund'
          />
        </div>
      </Panel>

      <Panel
        title='How much to put down'
        description='Your build at different down payments. Select a row to use it.'
      >
        <Table>
          <Table.ScrollContainer>
            <Table.Content
              aria-label='Down payment options'
              selectionMode='single'
              selectionBehavior='replace'
              selectedKeys={[String(plan.downPct)]}
              onSelectionChange={keys => {
                if (keys !== 'all' && keys.size) onPickDown(Number([...keys][0]));
              }}
            >
              <Table.Header>
                <Table.Column isRowHeader>Down</Table.Column>
                <Table.Column>Cash down</Table.Column>
                <Table.Column>Mortgage</Table.Column>
                <Table.Column>Monthly</Table.Column>
                <Table.Column>PMI</Table.Column>
                <Table.Column>Debt-to-income</Table.Column>
                <Table.Column>Savings left</Table.Column>
                <Table.Column>Total interest</Table.Column>
              </Table.Header>
              <Table.Body>
                {downOptions.map(down => {
                  const option = buildCosts(plan, down);
                  const {front, back} = dti(plan, option.housing.total);
                  const left = plan.savings - option.cashNeeded;
                  const short = left < reserveNeeded(plan, option.housing.total);
                  return (
                    <Table.Row
                      key={down}
                      id={String(down)}
                    >
                      <Table.Cell className='font-medium'>{down}%</Table.Cell>
                      <Table.Cell className='tabular-nums'>{usd(option.cashDown)}</Table.Cell>
                      <Table.Cell className='tabular-nums'>{usd(option.loan)}</Table.Cell>
                      <Table.Cell className='tabular-nums'>{usd(option.housing.total)}</Table.Cell>
                      <Table.Cell className='tabular-nums'>
                        {option.housing.pmi ? usd(option.housing.pmi) : '—'}
                      </Table.Cell>
                      <Table.Cell>
                        <span className='flex items-center gap-2 tabular-nums'>
                          {pct(back)}
                          <StatusChip status={paymentStatus(back, front)} />
                        </span>
                      </Table.Cell>
                      <Table.Cell className={`tabular-nums ${short ? 'text-danger' : ''}`}>
                        {left < 0 ? `${usd(-left)} short` : usd(left)}
                        {left >= 0 && short && ' · below fund'}
                      </Table.Cell>
                      <Table.Cell className='tabular-nums'>{usd(amortize(option.loan, plan).totalInterest)}</Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </Panel>

      <Panel
        title='If rates move'
        description={`Your ${usd(build.loan)} mortgage at nearby rates. Worth checking before you lock.`}
      >
        <div className='grid grid-cols-2 gap-3 sm:grid-cols-5'>
          {RATE_STEPS.map(step => {
            const rate = plan.rate + step;
            const total = housingCost(plan, build.loan, plan.completedValue || build.project, rate).total;
            return (
              <div
                key={step}
                className={`group-card flex flex-col gap-0.5 p-3 ${step === 0 ? 'ring-1 ring-accent' : ''}`}
              >
                <span className='section-label'>{rate.toFixed(2)}%</span>
                <span className='text-lg font-semibold tabular-nums'>{usd(total)}</span>
                <span className='text-xs text-muted'>{pct(dti(plan, total).back)} of income</span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
};

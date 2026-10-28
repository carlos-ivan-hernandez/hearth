import {Button, Tabs} from '@heroui/react';
import {House, RotateCcw} from 'lucide-react';
import {useEffect, useMemo, useState} from 'react';
import {buildCosts} from './finance';
import {InputsPanel, type SetField} from './InputsPanel';
import {DEFAULT_PLAN, loadPlan, savePlan} from './plan';
import {Borrowing} from './views/Borrowing';
import {Overview} from './views/Overview';
import {Payoff} from './views/Payoff';

const TABS = [
  {id: 'overview', label: 'Overview'},
  {id: 'borrowing', label: 'How much to borrow'},
  {id: 'payoff', label: 'Payoff'},
] as const;

export const App = () => {
  const [plan, setPlan] = useState(loadPlan);
  const [tab, setTab] = useState<string>('overview');
  const build = useMemo(() => buildCosts(plan), [plan]);

  useEffect(() => savePlan(plan), [plan]);

  const set: SetField = (key, value) => setPlan(current => ({...current, [key]: value}));

  return (
    <div className='flex min-h-dvh flex-col lg:h-dvh'>
      <header className='flex items-center justify-between gap-3 border-b border-separator px-4 py-3 sm:px-6'>
        <div className='flex items-center gap-2.5'>
          <div className='flex size-8 items-center justify-center rounded-lg bg-accent text-accent-foreground'>
            <House className='size-4.5' />
          </div>
          <div>
            <h1 className='text-sm leading-tight font-semibold'>Hearth</h1>
            <p className='text-xs leading-tight text-muted'>Should you build, and how much should you borrow?</p>
          </div>
        </div>
        <Button
          size='sm'
          variant='ghost'
          onPress={() => setPlan(DEFAULT_PLAN)}
        >
          <RotateCcw className='size-3.5' />
          Reset
        </Button>
      </header>

      <div className='flex min-h-0 flex-1 flex-col lg:flex-row'>
        <aside className='border-separator px-4 py-5 sm:px-6 lg:w-[26rem] lg:shrink-0 lg:overflow-y-auto lg:border-r'>
          <InputsPanel
            plan={plan}
            set={set}
          />
        </aside>

        <main className='min-w-0 flex-1 px-4 py-5 sm:px-6 lg:overflow-y-auto'>
          <Tabs
            selectedKey={tab}
            onSelectionChange={key => setTab(String(key))}
            className='mx-auto max-w-5xl'
          >
            <Tabs.ListContainer className='overflow-x-auto'>
              <Tabs.List aria-label='Views'>
                {TABS.map(({id, label}) => (
                  <Tabs.Tab
                    key={id}
                    id={id}
                    className='whitespace-nowrap'
                  >
                    {label}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
            <Tabs.Panel
              id='overview'
              className='pt-5'
            >
              <Overview
                plan={plan}
                build={build}
              />
            </Tabs.Panel>
            <Tabs.Panel
              id='borrowing'
              className='pt-5'
            >
              <Borrowing
                plan={plan}
                onPickDown={downPct => set('downPct', downPct)}
              />
            </Tabs.Panel>
            <Tabs.Panel
              id='payoff'
              className='pt-5'
            >
              <Payoff
                plan={plan}
                build={build}
              />
            </Tabs.Panel>
          </Tabs>
          <p className='mx-auto mt-8 max-w-5xl px-1 text-xs text-muted'>
            Estimates for planning, not lending advice. Your inputs stay in this browser.
          </p>
        </main>
      </div>
    </div>
  );
};

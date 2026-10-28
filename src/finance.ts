import type {LoanType, Plan} from './plan';

// Lender rules of thumb: housing under 28% of gross income, all debts under 36%.
// 43% is the usual ceiling for a qualified mortgage.
export const FRONT_DTI = 0.28;
export const BACK_DTI = 0.36;
export const MAX_DTI = 0.43;

// Construction loans are drawn as the work progresses, so on average about half is out.
const AVERAGE_DRAW = 0.5;

/**
 * How long each loan keeps its starting rate, and how far the rate may rise at the first
 * reset. Standard caps: 2/2/5 on a 5/1 ARM, 5/1/5 on 7/1 and 10/1.
 */
export const LOAN_TYPES: Record<LoanType, {label: string; fixedYears: number | null; firstCap: number}> = {
  fixed: {label: 'Fixed', fixedYears: null, firstCap: 0},
  arm5: {label: '5/1 ARM', fixedYears: 5, firstCap: 2},
  arm7: {label: '7/1 ARM', fixedYears: 7, firstCap: 5},
  arm10: {label: '10/1 ARM', fixedYears: 10, firstCap: 5},
};

/** Years at the starting rate, or null for a fixed loan (or an ARM whose term ends first). */
export const fixedPeriod = (plan: Plan) => {
  const years = LOAN_TYPES[plan.loanType].fixedYears;
  return years !== null && years < plan.termYears ? years : null;
};

export type Status = 'good' | 'stretch' | 'risky';

export const monthlyPayment = (principal: number, ratePct: number, years: number) => {
  if (principal <= 0 || years <= 0) return 0;
  const months = years * 12;
  const r = ratePct / 100 / 12;
  return r === 0 ? principal / months : (principal * r) / (1 - (1 + r) ** -months);
};

export interface Housing {
  principalInterest: number;
  tax: number;
  insurance: number;
  pmi: number;
  hoa: number;
  total: number;
}

/** The full monthly cost of owning a home worth `value` with `loan` left to pay over `years`. */
export const housingCost = (
  plan: Plan,
  loan: number,
  value: number,
  rate = plan.rate,
  years = plan.termYears,
): Housing => {
  const principalInterest = monthlyPayment(loan, rate, years);
  const tax = (value * plan.taxRate) / 100 / 12;
  const insurance = plan.insurance / 12;
  const pmi = value > 0 && loan / value > 0.8 ? (loan * plan.pmiRate) / 100 / 12 : 0;
  const total = principalInterest + tax + insurance + pmi + plan.hoa;
  return {principalInterest, tax, insurance, pmi, hoa: plan.hoa, total};
};

export const monthlyIncome = (plan: Plan) => plan.income / 12;

export const dti = (plan: Plan, housing: number) => {
  const income = monthlyIncome(plan);
  return income > 0
    ? {front: housing / income, back: (housing + plan.monthlyDebts) / income}
    : {front: Infinity, back: Infinity};
};

export const paymentStatus = (back: number, front: number): Status =>
  back <= BACK_DTI && front <= FRONT_DTI ? 'good' : back <= MAX_DTI ? 'stretch' : 'risky';

export const reserveNeeded = (plan: Plan, housing: number) => plan.reserveMonths * (plan.livingCosts + housing);

// ── Building ──────────────────────────────────────────────────────────────────

export interface BuildCosts {
  /** Everything the loan and down payment cover. */
  project: number;
  cashDown: number;
  loan: number;
  closing: number;
  /** Interest-only payments over the whole build. */
  constructionInterest: number;
  /** Rent over the whole build. */
  rent: number;
  /** Monthly cost while building: rent plus construction interest, on average and at the end. */
  buildMonthly: {average: number; peak: number};
  /** Cash out of savings at closing. */
  cashNeeded: number;
  /** What the house itself costs: the project, closing and construction interest. */
  houseCost: number;
  housing: Housing;
}

export const buildCosts = (plan: Plan, downPct = plan.downPct): BuildCosts => {
  const project = plan.totalCost;
  const cashDown = (project * downPct) / 100;
  const loan = project - cashDown;
  const closing = plan.closingMode === 'amount' ? plan.closingAmount : (loan * plan.closingPct) / 100;
  const monthlyInterest = (loan * plan.constructionRate) / 100 / 12;
  const constructionInterest = monthlyInterest * AVERAGE_DRAW * plan.buildMonths;
  return {
    project,
    cashDown,
    loan,
    closing,
    constructionInterest,
    rent: plan.rentWhileBuilding * plan.buildMonths,
    buildMonthly: {
      average: plan.rentWhileBuilding + monthlyInterest * AVERAGE_DRAW,
      peak: plan.rentWhileBuilding + monthlyInterest,
    },
    cashNeeded: cashDown + closing,
    houseCost: project + closing + constructionInterest,
    housing: housingCost(plan, loan, plan.completedValue || project),
  };
};

/** The same plan at a different total cost, valued at what it costs. */
const atTotal = (plan: Plan, totalCost: number) => buildCosts({...plan, totalCost, completedValue: 0});

/** The highest value of `fits(x)` staying true, for a test that turns false as x grows. */
const highest = (fits: (x: number) => boolean, max = 20_000_000) => {
  let low = 0;
  let high = max;
  if (!fits(0)) return 0;
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    if (fits(mid)) low = mid;
    else high = mid;
  }
  return low;
};

/** The biggest project the income supports at the chosen down payment. */
export const maxCostByIncome = (plan: Plan, limit: 'comfortable' | 'stretch') =>
  highest(cost => {
    const {front, back} = dti(plan, atTotal(plan, cost).housing.total);
    return limit === 'comfortable' ? front <= FRONT_DTI && back <= BACK_DTI : back <= MAX_DTI;
  });

/** The biggest project the savings cover at the chosen down payment, keeping the emergency fund. */
export const maxCostByCash = (plan: Plan) =>
  highest(cost => {
    const build = atTotal(plan, cost);
    return build.cashNeeded + reserveNeeded(plan, build.housing.total) <= plan.savings;
  });

// ── Paying it off ─────────────────────────────────────────────────────────────

export interface YearRow {
  year: number;
  balance: number;
  principal: number;
  interest: number;
}

export interface Schedule {
  years: YearRow[];
  months: number;
  totalInterest: number;
}

/**
 * Month-by-month payoff. An ARM keeps its starting rate for the fixed period, then the
 * payment is recalculated at `resetRate` over the years that remain.
 */
export const amortize = (loan: number, plan: Plan, extra = 0, resetRate = plan.armRate): Schedule => {
  const resetMonth = (fixedPeriod(plan) ?? Infinity) * 12;
  let rate = plan.rate;
  let payment = monthlyPayment(loan, rate, plan.termYears);
  const years: YearRow[] = [{year: 0, balance: loan, principal: 0, interest: 0}];
  let balance = loan;
  let months = 0;
  let totalInterest = 0;
  let row = {principal: 0, interest: 0};
  while (balance > 0.005 && months < plan.termYears * 12) {
    if (months === resetMonth) {
      rate = resetRate;
      payment = monthlyPayment(balance, rate, plan.termYears - months / 12);
    }
    const interest = (balance * rate) / 100 / 12;
    const principal = Math.min(balance, payment + extra - interest);
    balance -= principal;
    totalInterest += interest;
    row.principal += principal;
    row.interest += interest;
    months++;
    if (months % 12 === 0 || balance <= 0.005) {
      years.push({year: Math.ceil(months / 12), balance: Math.max(balance, 0), ...row});
      row = {principal: 0, interest: 0};
    }
  }
  return {years, months, totalInterest};
};

export interface ArmReset {
  year: number;
  expected: Housing;
  worstRate: number;
  worst: Housing;
}

/** What an ARM's payment becomes when its rate first resets, expected and at the cap. */
export const armReset = (plan: Plan, build: BuildCosts): ArmReset | null => {
  const year = fixedPeriod(plan);
  if (year === null) return null;
  const balance = amortize(build.loan, plan).years[year]?.balance ?? 0;
  const value = plan.completedValue || build.project;
  const remaining = plan.termYears - year;
  const worstRate = plan.rate + LOAN_TYPES[plan.loanType].firstCap;
  return {
    year,
    expected: housingCost(plan, balance, value, plan.armRate, remaining),
    worstRate,
    worst: housingCost(plan, balance, value, worstRate, remaining),
  };
};

// ── Verdict ───────────────────────────────────────────────────────────────────

export interface Check {
  title: string;
  status: Status;
  detail: string;
}

const worst = (statuses: Status[]): Status =>
  statuses.includes('risky') ? 'risky' : statuses.includes('stretch') ? 'stretch' : 'good';

const debtStatus = (back: number): Status => (back <= BACK_DTI ? 'good' : back <= MAX_DTI ? 'stretch' : 'risky');

export const verdict = (plan: Plan, build: BuildCosts) => {
  const {front, back} = dti(plan, build.housing.total);
  const reserve = reserveNeeded(plan, build.housing.total);
  const left = plan.savings - build.cashNeeded;
  const equity = plan.completedValue - build.houseCost;
  const equityRatio = plan.completedValue > 0 ? equity / plan.completedValue : -1;
  const buildAverage = dti(plan, build.buildMonthly.average).back;
  const buildPeak = dti(plan, build.buildMonthly.peak).back;
  // The peak only lasts the final months, so it can make a plan a stretch but not risky.
  const buildStatus = worst([debtStatus(buildAverage), buildPeak > MAX_DTI ? 'stretch' : 'good']);
  const reset = armReset(plan, build);

  const checks: Check[] = [
    {
      title: 'Monthly payment',
      status: paymentStatus(back, front),
      detail: `${reset ? `For the first ${reset.year} years, h` : 'H'}ousing takes ${pct(front)} of gross income and all debts ${pct(back)}. Lenders like 28% / 36% and cap most loans at 43%.`,
    },
    {
      title: 'While building',
      status: buildStatus,
      detail: `Rent plus interest on the construction loan averages ${usd(build.buildMonthly.average)} a month (${pct(buildAverage)} of income with other debts) and reaches ${usd(build.buildMonthly.peak)} (${pct(buildPeak)}) once the loan is fully drawn.`,
    },
    {
      title: 'Cash and emergency fund',
      status: left >= reserve ? 'good' : left >= reserve / 2 ? 'stretch' : 'risky',
      detail:
        left < 0
          ? `You need ${usd(build.cashNeeded)} at closing, ${usd(-left)} more than your cash savings.`
          : left >= reserve
            ? `After ${usd(build.cashNeeded)} at closing you keep ${usd(left)}, which covers the ${plan.reserveMonths}-month emergency fund (${usd(reserve)}).`
            : `After ${usd(build.cashNeeded)} at closing you keep ${usd(left)}, short of the ${plan.reserveMonths}-month emergency fund (${usd(reserve)}).`,
    },
    {
      title: 'Worth what it costs',
      status: equityRatio >= 0 ? 'good' : equityRatio >= -0.1 ? 'stretch' : 'risky',
      detail:
        equity >= 0
          ? `The finished house should appraise ${usd(equity)} above what it costs to build. Banks lend on appraised value, so this matters.`
          : `Building costs ${usd(-equity)} more than the finished house is expected to be worth. The appraisal may not cover the loan.`,
    },
  ];
  if (reset) {
    const expectedBack = dti(plan, reset.expected.total).back;
    const worstBack = dti(plan, reset.worst.total).back;
    checks.push({
      title: 'After the rate resets',
      status: debtStatus(expectedBack),
      detail: `In year ${reset.year + 1} the rate moves to about ${plan.armRate}%: ${usd(reset.expected.total)} a month, ${pct(expectedBack)} of income with other debts. At the ${reset.worstRate}% cap it would be ${usd(reset.worst.total)} (${pct(worstBack)}).`,
    });
  }
  return {checks, overall: worst(checks.map(check => check.status))};
};

// ── Formatting ────────────────────────────────────────────────────────────────

const usdFormat = new Intl.NumberFormat('en-US', {style: 'currency', currency: 'USD', maximumFractionDigits: 0});
const compactFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
});

export const usd = (value: number) => usdFormat.format(Math.round(value));
export const usdCompact = (value: number) => compactFormat.format(value);
export const pct = (ratio: number) => (Number.isFinite(ratio) ? `${(ratio * 100).toFixed(1)}%` : '—');
export const duration = (months: number) => {
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest ? `${years} yr ${rest} mo` : `${years} yr`;
};

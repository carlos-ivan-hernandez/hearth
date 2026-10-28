import type {Plan} from './plan';

// Lender rules of thumb: housing under 28% of gross income, all debts under 36%.
// 43% is the usual ceiling for a qualified mortgage.
export const FRONT_DTI = 0.28;
export const BACK_DTI = 0.36;
export const MAX_DTI = 0.43;

// Construction loans are drawn as the work progresses, so on average about half is out.
const AVERAGE_DRAW = 0.5;

export type Status = 'good' | 'stretch' | 'risky';

export const monthlyPayment = (principal: number, ratePct: number, years: number) => {
  if (principal <= 0) return 0;
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

/** The full monthly cost of owning a home worth `value` with a `loan` against it. */
export const housingCost = (plan: Plan, loan: number, value: number, rate = plan.rate): Housing => {
  const principalInterest = monthlyPayment(loan, rate, plan.termYears);
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
  land: number;
  construction: number;
  otherCosts: number;
  contingency: number;
  /** Everything the loan and down payment cover. */
  project: number;
  landEquity: number;
  cashDown: number;
  loan: number;
  closing: number;
  constructionInterest: number;
  /** Cash out of savings before move-in. */
  cashNeeded: number;
  /** Total spent to get to move-in. */
  allIn: number;
  housing: Housing;
}

export const buildCosts = (plan: Plan, downPct = plan.downPct): BuildCosts => {
  const itemized = plan.costMode === 'itemized';
  const land = itemized ? plan.landCost : 0;
  const construction = itemized ? plan.construction : 0;
  const otherCosts = itemized ? plan.otherCosts : 0;
  const contingency = itemized ? ((construction + otherCosts) * plan.contingencyPct) / 100 : 0;
  const project = itemized ? land + construction + otherCosts + contingency : plan.totalCost;
  // Land you already own counts toward the down payment; lenders treat it as equity.
  const landEquity = itemized && plan.landOwned ? land : 0;
  const equity = Math.max((project * downPct) / 100, landEquity);
  const cashDown = equity - landEquity;
  const loan = project - equity;
  const closing = (loan * plan.closingPct) / 100;
  const constructionInterest = (((loan * AVERAGE_DRAW * plan.constructionRate) / 100) * plan.buildMonths) / 12;
  return {
    land,
    construction,
    otherCosts,
    contingency,
    project,
    landEquity,
    cashDown,
    loan,
    closing,
    constructionInterest,
    cashNeeded: cashDown + closing + constructionInterest,
    // Land bought earlier is still money spent on this house.
    allIn: project + closing + constructionInterest,
    housing: housingCost(plan, loan, plan.completedValue || project),
  };
};

/** The same plan as one total, valued at what it costs. */
const atTotal = (plan: Plan, totalCost: number) =>
  buildCosts({...plan, costMode: 'total', totalCost, completedValue: 0});

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

export const amortize = (loan: number, ratePct: number, termYears: number, extra = 0): Schedule => {
  const r = ratePct / 100 / 12;
  const payment = monthlyPayment(loan, ratePct, termYears);
  const years: YearRow[] = [{year: 0, balance: loan, principal: 0, interest: 0}];
  let balance = loan;
  let months = 0;
  let totalInterest = 0;
  let row = {principal: 0, interest: 0};
  while (balance > 0.005 && months < termYears * 12) {
    const interest = balance * r;
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

// ── Verdict ───────────────────────────────────────────────────────────────────

export interface Check {
  title: string;
  status: Status;
  detail: string;
}

const worst = (statuses: Status[]): Status =>
  statuses.includes('risky') ? 'risky' : statuses.includes('stretch') ? 'stretch' : 'good';

export const verdict = (plan: Plan, build: BuildCosts) => {
  const {front, back} = dti(plan, build.housing.total);
  const reserve = reserveNeeded(plan, build.housing.total);
  const left = plan.savings - build.cashNeeded;
  const equity = plan.completedValue - build.allIn;
  const equityRatio = plan.completedValue > 0 ? equity / plan.completedValue : -1;

  const checks: Check[] = [
    {
      title: 'Monthly payment',
      status: paymentStatus(back, front),
      detail: `Housing takes ${pct(front)} of gross income and all debts ${pct(back)}. Lenders like 28% / 36% and cap most loans at 43%.`,
    },
    {
      title: 'Cash and emergency fund',
      status: left >= reserve ? 'good' : left >= reserve / 2 ? 'stretch' : 'risky',
      detail:
        left < 0
          ? `You need ${usd(build.cashNeeded)} up front, ${usd(-left)} more than your savings.`
          : left >= reserve
            ? `After ${usd(build.cashNeeded)} up front you keep ${usd(left)}, which covers the ${plan.reserveMonths}-month emergency fund (${usd(reserve)}).`
            : `After ${usd(build.cashNeeded)} up front you keep ${usd(left)}, short of the ${plan.reserveMonths}-month emergency fund (${usd(reserve)}).`,
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
  if (plan.costMode === 'itemized') {
    checks.push({
      title: 'Budget cushion',
      status: plan.contingencyPct >= 10 ? 'good' : plan.contingencyPct >= 5 ? 'stretch' : 'risky',
      detail: `${plan.contingencyPct}% contingency (${usd(build.contingency)}). Custom builds commonly run 10–20% over; under 10% is thin.`,
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

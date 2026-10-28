export type CostMode = 'total' | 'itemized';

/** Everything the user can tune. Rates are percents (6.5 means 6.5%). */
export interface Plan {
  // Household
  income: number; // gross, per year
  monthlyDebts: number; // car, student loans, card minimums
  savings: number;
  livingCosts: number; // monthly spending other than housing
  reserveMonths: number; // emergency fund to keep untouched

  // Land and build: one total, or a few parts
  costMode: CostMode;
  totalCost: number; // land, construction and fees together
  landCost: number;
  landOwned: boolean;
  construction: number; // the builder's contract price
  otherCosts: number; // site work, permits, design
  contingencyPct: number;
  buildMonths: number;
  constructionRate: number;
  completedValue: number; // what an appraiser would say the finished house is worth

  // Mortgage
  downPct: number;
  rate: number;
  termYears: number;
  closingPct: number;
  taxRate: number;
  insurance: number; // per year
  hoa: number; // per month
  pmiRate: number;
  extraMonthly: number;
}

export const DEFAULT_PLAN: Plan = {
  income: 160_000,
  monthlyDebts: 600,
  savings: 220_000,
  livingCosts: 4_000,
  reserveMonths: 6,

  costMode: 'total',
  totalCost: 675_000,
  landCost: 90_000,
  landOwned: false,
  construction: 460_000,
  otherCosts: 75_000,
  contingencyPct: 10,
  buildMonths: 10,
  constructionRate: 8.5,
  completedValue: 690_000,

  downPct: 20,
  rate: 6.5,
  termYears: 30,
  closingPct: 3,
  taxRate: 1.1,
  insurance: 2_400,
  hoa: 0,
  pmiRate: 0.6,
  extraMonthly: 0,
};

const STORAGE_KEY = 'hearth-plan';

export const loadPlan = (): Plan => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? {...DEFAULT_PLAN, ...(JSON.parse(stored) as Partial<Plan>)} : DEFAULT_PLAN;
  } catch {
    return DEFAULT_PLAN;
  }
};

export const savePlan = (plan: Plan) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // Private windows can refuse storage; the plan just won't persist.
  }
};

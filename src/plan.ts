export type LoanType = 'fixed' | 'arm5' | 'arm7' | 'arm10';
export type ClosingMode = 'percent' | 'amount';

/** Everything the user can tune. Rates are percents (6.5 means 6.5%). */
export interface Plan {
  // Household
  income: number; // gross, per year
  monthlyDebts: number; // car, student loans, card minimums
  savings: number; // cash on hand
  livingCosts: number; // monthly spending other than housing
  reserveMonths: number; // emergency fund to keep untouched

  // Build
  totalCost: number; // land, construction and fees together
  rentWhileBuilding: number; // per month, until move-in
  buildMonths: number;
  constructionRate: number;
  completedValue: number; // what an appraiser would say the finished house is worth

  // Mortgage
  downPct: number;
  loanType: LoanType;
  rate: number; // the starting rate, for an ARM
  armRate: number; // the rate an ARM is expected to reset to
  termYears: number;
  closingMode: ClosingMode;
  closingPct: number;
  closingAmount: number;
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

  totalCost: 675_000,
  rentWhileBuilding: 2_200,
  buildMonths: 10,
  constructionRate: 8.5,
  completedValue: 690_000,

  downPct: 20,
  loanType: 'fixed',
  rate: 6.5,
  armRate: 7.5,
  termYears: 30,
  closingMode: 'percent',
  closingPct: 3,
  closingAmount: 15_000,
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

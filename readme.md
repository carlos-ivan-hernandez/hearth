# Hearth

A planner for deciding whether to build a house and how much to borrow. Enter your household finances, the build (total cost, rent while building, build time, construction loan rate, value when finished) and the mortgage (fixed or a 5/1, 7/1 or 10/1 ARM; closing costs as a percent or a dollar amount); the results update as you type.

- **Overview** — a verdict with checks (monthly payment, payments while building, cash and emergency fund, value against cost, and for an ARM the payment after the rate resets), where the money goes, and the monthly payment.
- **How much to borrow** — the biggest project your income and savings support, your build at different down payments (select a row to use it), and the payment if rates move.
- **Payoff** — loan balance over time, the effect of extra principal, and a year-by-year schedule.

Inputs are saved in the browser's local storage. The numbers are estimates for planning, not lending advice.

## Assumptions

- Lender guidelines: housing ≤ 28% of gross income, all debts ≤ 36%, 43% as the usual ceiling.
- The construction loan is interest-only and about half drawn on average during the build. That interest and the rent while building are paid monthly from income; savings cover the down payment and closing costs.
- An ARM keeps its starting rate for 5, 7 or 10 years, then the payment is recalculated on the remaining balance at the "rate after reset" for the rest of the term. The worst case uses the standard first-adjustment caps: +2% on a 5/1 (2/2/5), +5% on a 7/1 or 10/1 (5/1/5).
- PMI applies while the loan is over 80% of the home's value.

## Development

React, TypeScript, Vite, HeroUI v3 and Tailwind, with vera's theme. Open the folder in VS Code and install the recommended extensions so oxlint and oxfmt run on save.

```sh
pnpm install
pnpm dev      # http://localhost:1780
pnpm build
pnpm fix      # lint and format
```

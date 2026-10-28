# Hearth

A planner for deciding whether to build a house and how much to borrow. Enter your household finances, the build budget (one total, or itemized as land, construction, other costs and contingency), and the mortgage terms; the results update as you type.

- **Overview** — a verdict with four checks (monthly payment, cash and emergency fund, value against cost, contingency), where the money goes, and the monthly payment.
- **How much to borrow** — the biggest project your income and savings support, your build at different down payments (select a row to use it), and the payment if rates move.
- **Payoff** — loan balance over time, the effect of extra principal, and a year-by-year schedule.

Inputs are saved in the browser's local storage. The numbers are estimates for planning, not lending advice.

## Assumptions

- Lender guidelines: housing ≤ 28% of gross income, all debts ≤ 36%, 43% as the usual ceiling.
- The construction loan is interest-only and about half drawn on average during the build; that interest is paid from savings.
- Land you already own counts toward the down payment.
- PMI applies while the loan is over 80% of the home's value.

## Development

React, TypeScript, Vite, HeroUI v3 and Tailwind, with vera's theme. Open the folder in VS Code and install the recommended extensions so oxlint and oxfmt run on save.

```sh
pnpm install
pnpm dev      # http://localhost:1780
pnpm build
pnpm fix      # lint and format
```

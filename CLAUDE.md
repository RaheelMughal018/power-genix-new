# power-genix

Inventory, production, and sales management ERP for an inverter manufacturing business.

## Tech Stack

- **Web app (frontend)**: Next.js 16 + React 19 + Tailwind v4 + SCSS — see `web-app/CLAUDE.md`
- **Backend API**: NestJS 11 + TypeORM + PostgreSQL — see `backend/CLAUDE.md`

## Project Structure

- `web-app/` — Web app (frontend)
- `backend/` — Backend API
- `docs/` — Project documentation (`SPECIFICATION.md`)
- `.claude/skills/` — cross-cutting skills

## Implemented Modules

| Module | Backend | Frontend | Description |
|--------|---------|----------|-------------|
| Dashboard | `dashboard/` | `dashboard/page.tsx` | Charts + summary cards |
| Items | `items/` | `items/` | Inventory items (inverters, parts, accessories) |
| Categories | `categories/` | `categories/` | Item categorization |
| Suppliers | `suppliers/` | `suppliers/` | Supplier management + detail (purchases, payments, statement) |
| Customers | `customers/` | `customers/` | Customer management + detail (sales, repairs, payments, statement) |
| Recipes | `recipes/` | `recipes/` | Bill of materials for production |
| Production | `production/` | `production/` | Production batches + units + detail + full edit |
| Purchase Invoices | `purchase-invoices/` | `purchase-invoices/` | Stock-in from suppliers |
| Sale Invoices | `sale-invoices/` | `sale-invoices/` | Stock-out to customers + serial tracking |
| Repair Invoices | `repair-invoices/` | `repair-invoices/` | Repair jobs (inventory items only, no custom items) |
| Supplier Payments | `supplier-payments/` | `supplier-payments/` | Payments to suppliers + detail view |
| Customer Payments | `customer-payments/` | `customer-payments/` | Payments from customers + detail view |
| Expenses | `expenses/` | `expenses/` | Business expenses |
| Expense Categories | `expense-categories/` | `expense-categories/` | Expense categorization |
| Assets | `assets/` | `assets/` | Business assets (equipment, vehicles, etc.) purchased from accounts |
| Accounts | `accounts/` | `accounts/` | Financial accounts + transfers + detail (transactions history) |
| Sold Inverters | `sold-inverters/` | `sold-inverters/` | Serial-tracked sold inverter registry |
| Stock Adjustments | `stock-adjustments/` | `stock-adjustments/` | Manual stock corrections |
| Settings | `settings/` | `settings/` | App settings (company info, etc.) |

## Workflow Pipeline

Follow this order for all new work:
1. Brainstorm → 2. Design → 3. Plan → 4. Scaffold → 5. Implement → 6. Test → 7. Review → 8. Deploy

See `.claude/skills/workflow-guide/` for the full process.

## Skills

| Skill | Description |
|-------|-------------|
| create-feature | End-to-end guide for adding a feature across the stack |
| deploy | Dockerize + CI/CD setup (delegates to sub-project deployment skills) |
| add-database-entity | Create entity + API + frontend integration |
| add-authentication | Wire up auth across frontend + backend |
| create-tests | Testing strategy across the full stack |
| workflow-guide | The full pipeline process reference |

## Documentation Rules

- **Workflow is mandatory** — always follow the workflow pipeline. Do not skip stages.
- **Plans** — save all implementation plans to `docs/plans/YYYY-MM-DD-<topic>.md`
- **Requirements** — save all requirements documents to `docs/requirements/`
- **Specifications** — `docs/SPECIFICATION.md` (plain language, client-shareable)

## CLAUDE.md Hierarchy

1. **Root `CLAUDE.md`** (this file) — global rules, workflow, documentation standards.
2. **Sub-project `CLAUDE.md`** (per-module) — stack-specific conventions, patterns, and skills.

When rules conflict, root takes precedence. Always read root first, then the relevant sub-project docs.

## Module Management

Scaffolded by `create-fullstack-app`. Installed modules tracked in `fullstack.config.json`.

## Global Conventions

- Always read the relevant `CLAUDE.md` before working in a sub-project
- For cross-cutting work, start with `.claude/skills/create-feature/`

## Sub-Project Documentation

- [Web app (frontend)](web-app/CLAUDE.md)
- [Backend API](backend/CLAUDE.md)

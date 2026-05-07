# Power Genix — Web App (Frontend)

Next.js frontend for the Power Genix inventory/production/sales ERP.

---

## Quick Commands

```bash
npm run dev       # Dev server at localhost:3000
npx tsc --noEmit  # Type-check only (preferred over full build)
npm run lint      # ESLint check
```

---

## Tech Stack

- **Next.js 16** App Router · React 19 · TypeScript 5
- **Tailwind CSS v4** + SCSS modules (hybrid styling)
- **Redux Toolkit** + redux-persist
- **next-themes** · Formik + Yup · Axios
- **Font**: Plus Jakarta Sans (primary), JetBrains Mono (monospace) via `next/font/google`

All shared code lives under `app/_shared/`. Use `@/app/_shared/` for all imports from shared folders.

---

## Page Structure

All pages live under `app/(pages)/(dashboard)/dashboard/`:

| Page | Description |
|------|-------------|
| `page.tsx` | Dashboard home (charts + summary cards) |
| `items/` | Inventory items CRUD |
| `categories/` | Item categories CRUD |
| `suppliers/` | Supplier management |
| `customers/` | Customer management |
| `recipes/` | Bill of materials CRUD |
| `production/` | Production batches + units |
| `purchase-invoices/` | Purchase invoices (stock-in) |
| `sale-invoices/` | Sale invoices (stock-out) |
| `repair-invoices/` | Repair invoices (inventory items only) |
| `supplier-payments/` | Payments to suppliers |
| `customer-payments/` | Payments from customers |
| `expenses/` | Business expenses |
| `expense-categories/` | Expense categories |
| `accounts/` | Financial accounts + transfers |
| `sold-inverters/` | Sold inverter serial registry |
| `stock-adjustments/` | Manual stock corrections |
| `assets/` | Business assets (equipment, vehicles, etc.) |
| `settings/` | App settings |

Each module typically has: list page, create page, `[id]/` detail page, `[id]/edit/` edit page.

**Detail pages with tabs:**
- `suppliers/[id]/` — Summary cards + tabs (Purchase History, Payment History, Statement)
- `customers/[id]/` — Summary cards + tabs (Sale History, Repair History, Payment History, Statement)
- `accounts/[id]/` — Summary cards + tabs (Received, Paid Out, Expenses, Assets, Transfers)
- `supplier-payments/[id]/` — Payment detail view with Edit button
- `customer-payments/[id]/` — Payment detail view with Edit button
- `production/[id]/` — Batch info + units breakdown

**Clickable elements in listings:** Supplier, Customer, Account names, Production batch#, and all Invoice numbers are clickable links to their detail pages (styled with `text-(--color-primary) hover:underline cursor-pointer`). Statement and history tab rows also link to the relevant invoice/payment detail page.

**Layout:** Sidebar is fixed (h-screen), only main content area scrolls (`overflow-y-auto`, `overflow-x-hidden`).

**Custom Date Picker:** All date inputs use the custom `Calendar` + `DatePicker` components (no native `<input type="date">`). Calendar drops down on desktop, slides up as bottom sheet on mobile.

**FilterBar:** Uses `SearchableDropdown` for all filter selects (not native `<select>`).

**Sale Invoice Serial Selection:** When selecting a final product serial, the unit price auto-fills with the production cost. User can override.

**Repair Invoice Unit Price:** Auto-fills with item's average price on selection, but user can override for markup/profit. Both create and edit send `unitPrice` to the backend.

**Production BOM Items:** Create and edit pages support dynamic add/remove of BOM items at runtime (not locked to recipe). Each unit can have different items/quantities when using "Edit Individual" mode.

**Production Detail BOM:** The Bill of Materials table on the detail page shows total materials aggregated from actual production unit items (NOT from the recipe). "Avg Cost / Unit" is shown in the header since units can differ. Each unit's individual cost and item breakdown is shown in the Production Units section.

**Production Edit Cost Summary:** The cost summary shows averages across all units (not just unit[0]) and updates in real-time as items are edited.

**Repair Invoice Line Totals:** `RepairInvoiceItem` has no `totalPrice` column — compute as `quantity × unitPrice` client-side.

**Empty States:** All list pages must pass `emptyTitle`, `emptyDescription`, and `emptyAction` props to `DataTable` for when data is empty.

**Invoice Notes Column:** Purchase and sale invoice listings include a "Notes" column. Search queries also match against notes.

### Date Formatting

All date values rendered in tables/lists use `formatDate()` from `@/app/_shared/lib/utils/date` — NOT `new Date(val).toLocaleDateString()`. The utility parses the ISO date string directly to avoid timezone shift bugs.

```typescript
import { formatDate } from '@/app/_shared/lib/utils/date';
// In column def:
cell: ({ row }) => formatDate(row.original.date)
```

### Decimal Column Coercion

PostgreSQL `decimal` columns arrive as strings via TypeORM. Always wrap in `Number()` when doing arithmetic — especially in `.reduce()` calls. Without `Number()`, `sum + li.totalPrice` does string concatenation instead of addition.

### Dark Mode Tokens

Table section headers use `bg-(--color-bg-secondary)` — never `bg-[var(--color-primary-50)]` which breaks in dark mode.

---

## Shared UI Components

Located in `app/_shared/components/ui/`:

accordion, alert, badge, button, checkbox, confirmDialog, dataTable, dateInput, dateRangePicker, dateSelector, dropdown, fileUpload, filterBar, input, modal, noContentCard, pagination, phoneInput, searchableDropdown, spinner, statusBadge, summaryCards, tabs, textArea, themeToggle, toast, toggleSwitch, tooltip

---

## API Client

`app/_shared/lib/api/client.ts` — all backend API calls organized by module (e.g. `itemsApi`, `suppliersApi`, `purchaseInvoicesApi`).
`app/_shared/lib/api/axios.ts` — Axios instance with auth interceptors.

### Response Parsing Pattern

The backend wraps ALL responses in `{ data: <actual> }` via a global interceptor. With Axios, `response.data` gives the outer wrapper. Correct patterns:

```typescript
// Single entity (detail endpoints)
const detail = (response.data as { data: T }).data;

// Paginated list
const outer = response.data as { data: { data: T[]; meta: Meta } };
const items = outer.data.data;
const meta = outer.data.meta;
```

### CSV Export Pattern

All CSV exports use `downloadCsv()` from `@/app/_shared/lib/utils/download` — NOT the API client's `exportCsv()` methods. The download utility uses `fetch` with auth token to trigger a browser file download via blob URL.

```typescript
import { downloadCsv } from '@/app/_shared/lib/utils/download';
await downloadCsv('/suppliers/export/csv', 'suppliers.csv');
```

---

## Skill Files

| Task                                                          | Skill file                                              |
| ------------------------------------------------------------- | ------------------------------------------------------- |
| Understand project structure, add pages, configure Next.js    | `.claude/skills/architecture/SKILL.md`                   |
| Use or create UI components (Button, Modal, Input, etc.)      | `.claude/skills/components/SKILL.md`                     |
| Apply styles, work with CSS variables, Tailwind, SCSS         | `.claude/skills/styling/SKILL.md`                        |
| Implement auth, protect routes, work with tokens/API          | `.claude/skills/auth/SKILL.md`                           |
| Add Redux state, create slices, use hooks                     | `.claude/skills/state/SKILL.md`                          |
| Navigate between pages, add new routes, update access control | `.claude/skills/routes/SKILL.md`                         |
| Follow naming conventions and component size rules            | `.claude/rules/code-standards/SKILL.md`                  |
| Add images/icons/fonts, use Next.js Image component           | `.claude/rules/assets/SKILL.md`                          |
| Generate a multi-stage Dockerfile for this Next.js app        | `.claude/skills/write-dockerfile/SKILL.md`               |
| Create a GitHub Actions workflow to build + deploy via SSH    | `.claude/skills/github-workflow-docker-deploy/SKILL.md`  |

---

## Critical Rules (always apply, regardless of task)

1. **Routes** — Never hardcode route strings. Always use `ROUTES.*` from `app/_shared/lib/config/routes.ts`.
2. **Assets** — Never reference asset paths directly as strings. All assets live in `app/_shared/assets/` and must be exported from their `index.ts` before use.
3. **Images** — Always use `<Image />` from `next/image`. Never use `<img>`.
4. **Component size** — Files must not exceed 300–350 lines. Split into sub-components or hooks.
5. **Naming** — All component folders and files use **camelCase** (e.g. `fileUpload/fileUpload.tsx`).
6. **Imports** — Always use `@/app/_shared/` prefix for shared code. Never use relative `../../` paths.
7. **Modals & Dialogs** — Always create a dedicated, separate component file for every modal or dialog. Never inline modal content in a parent component.
8. **Auth pages** — Login page has no "Forgot password" link (single-user system, password reset not exposed).

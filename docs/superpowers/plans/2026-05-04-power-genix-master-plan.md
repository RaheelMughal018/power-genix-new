# Power Genix — Master Development Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete Inventory, Production, Sales & Accounting Management System for inverter manufacturing business.

**Architecture:** Vertical full-stack (backend API + frontend pages per module). NestJS 11 backend with PostgreSQL/TypeORM, Next.js 16 frontend with Redux Toolkit. Each phase builds on the previous, zero stubs or placeholders.

**Tech Stack:** NestJS 11, Next.js 16, PostgreSQL, TypeORM, Redux Toolkit, Tailwind CSS v4 + SCSS modules, Formik + Yup, ApexCharts, Axios

**Approach:** Domain-Layered, bottom-up. Each module = backend (entity, DTOs, controller, service, providers) + frontend (page, components, API calls, state). Module fully usable before moving to next.

**Existing Infrastructure (already scaffolded):**
- Backend: auth module (login, refresh, change password, forgot/reset), users module (signup, profile), admin module, mail module, pagination, error handling, JWT guards
- Frontend: login page, all UI primitives (Button, Modal, Input, TextArea, Dropdown, Pagination, Tabs, Badge, Alert, Toast, Spinner, etc.), auth flow (proxy, interceptor, Redux), theme toggle, routing config

---

## Phase Overview

| Phase | Modules | Est. Days |
|-------|---------|-----------|
| 1 | Foundation — Settings, Shared Components, Categories, Accounts | 8 |
| 2 | Core Entities — Items & Inventory, Suppliers, Customers | 7 |
| 3 | Recipes & Production | 7 |
| 4 | Transactions — Purchase/Sale/Repair Invoices, Expense Categories, Expenses | 12 |
| 5 | Payments — Supplier Payments, Customer Payments | 3 |
| 6 | Derived Views — Stock Adjustments, Sold Inverters, Dashboard | 6 |
| 7 | Polish — PDF Templates, CSV Export, Statements, Theme, Responsive | 9 |
| **Total** | | **~52 days** |

---

## Phase 1 — Foundation (Days 1–8)

Auth already exists. This phase builds settings, shared components, and first two simple modules.

### Day 1 — User Settings (Backend)

**Backend module:** `src/settings/`

| Task | Detail |
|------|--------|
| Entity | Extend existing `User` entity OR create `BusinessSettings` entity — fields: companyName, companyLogo, companyAddress, companyPhone, serialPrefix (default "LEH"), fiscalYearStart (default 7 for July) |
| DTOs | `update-profile.dto.ts` (firstName, lastName, phone, address), `update-business-settings.dto.ts` (companyName, companyLogo, companyAddress, companyPhone, serialPrefix, fiscalYearStart) |
| Controller | `PATCH /settings/profile`, `PATCH /settings/business`, `GET /settings`, `POST /settings/logo` (file upload) |
| Providers | `settings.service.ts`, `update-profile.provider.ts`, `update-business-settings.provider.ts` |
| File upload | Use multer for logo upload, store in local uploads directory |

### Day 2 — User Settings (Frontend)

| Task | Detail |
|------|--------|
| Route | `ROUTES.SETTINGS` → `/dashboard/settings` |
| Page | `app/(pages)/(dashboard)/settings/page.tsx` |
| Components | `profileForm/profileForm.tsx`, `businessSettingsForm/businessSettingsForm.tsx`, `logoUpload/logoUpload.tsx` |
| Tabs layout | Profile tab + Business Settings tab using existing `Tabs` component |
| API | `apiClient.get('/settings')`, `apiClient.patch('/settings/profile')`, `apiClient.patch('/settings/business')` |
| Validation | Yup schemas for profile and business settings forms |

### Day 3 — Shared Layout & Components (Frontend)

Build the application shell and reusable components used by ALL modules.

| Task | Detail |
|------|--------|
| Sidebar | `app/_shared/components/layout/sidebar/sidebar.tsx` — collapsible, all module nav links, responsive hamburger on mobile |
| Header | `app/_shared/components/layout/header/header.tsx` — user profile dropdown, theme toggle |
| Dashboard layout | Update `app/(pages)/(dashboard)/layout.tsx` to include sidebar + header |
| DataTable | `app/_shared/components/ui/dataTable/dataTable.tsx` — pagination, search across all columns, column sorting, date range filter (today/month/year/custom), CSV export button, PDF download button. Max 350 lines — split into sub-components: `tableHeader.tsx`, `tableBody.tsx`, `tableFilters.tsx`, `tablePagination.tsx` |
| FilterBar | `app/_shared/components/ui/filterBar/filterBar.tsx` — dropdown filters + date range picker |
| SummaryCards | `app/_shared/components/ui/summaryCards/summaryCards.tsx` — top-of-page totals display, clickable |
| ConfirmDialog | `app/_shared/components/ui/confirmDialog/confirmDialog.tsx` — delete confirmation modal using existing Modal component |
| DateRangePicker | `app/_shared/components/ui/dateRangePicker/dateRangePicker.tsx` — today/month/year/custom presets |

### Day 4 — Shared Components Continued + Number Formatting

| Task | Detail |
|------|--------|
| InvoiceForm | `app/_shared/components/forms/invoiceForm/invoiceForm.tsx` — reusable line-item form (add/remove rows, item dropdown, qty, unit price, auto-calculate line total and grand total, discount field). Split: `invoiceFormRow.tsx`, `invoiceFormTotals.tsx` |
| Currency formatter | `app/_shared/lib/utils/currency.ts` — format numbers to PKR Pakistani style (1,00,000). Used everywhere. |
| StatusBadge | `app/_shared/components/ui/statusBadge/statusBadge.tsx` — production status, stock alerts |
| API hooks pattern | `app/_shared/lib/hooks/useApi.ts` — generic hook for data fetching with loading/error states |
| Types | `app/_shared/lib/types/` — shared TypeScript interfaces for all entities (Account, Item, Supplier, Customer, etc.) |

### Day 5 — Categories Module (Backend + Frontend)

Simple CRUD — good first module to validate the full vertical flow.

**Backend:** `src/categories/`

| Task | Detail |
|------|--------|
| Entity | `category.entity.ts` — name, createdBy (relation to User), soft delete |
| DTOs | `create-category.dto.ts`, `update-category.dto.ts` |
| Controller | `GET /categories` (paginated, search, sorted A-Z), `POST /categories`, `PATCH /categories/:id`, `DELETE /categories/:id` |
| Providers | `categories.service.ts`, `create-category.provider.ts`, `update-category.provider.ts`, `delete-category.provider.ts` |
| Delete rule | Reject if items are assigned to this category |
| CSV export | `GET /categories/export/csv` |

**Frontend:**

| Task | Detail |
|------|--------|
| Route | `ROUTES.CATEGORIES` → `/dashboard/categories` |
| Page | List page with DataTable, search, pagination, CSV export button |
| Create | Modal form (name field) |
| Edit | Modal form (pre-filled name) |
| Delete | ConfirmDialog modal |

### Day 6 — Accounts Module (Backend)

**Backend:** `src/accounts/`

| Task | Detail |
|------|--------|
| Entity | `account.entity.ts` — name, type (enum: cash/bank/mobile_wallet), openingBalance (decimal 12,2, default 0), currentBalance (decimal 12,2, default 0), createdBy, soft delete |
| DTOs | `create-account.dto.ts` (name, type — NO openingBalance), `update-account.dto.ts`, `add-opening-balance.dto.ts` (amount), `transfer.dto.ts` (fromAccountId, toAccountId, amount, notes) |
| Controller | `GET /accounts` (paginated, search, sorted A-Z), `GET /accounts/total-balance`, `POST /accounts`, `PATCH /accounts/:id`, `DELETE /accounts/:id`, `POST /accounts/:id/opening-balance`, `POST /accounts/transfer` |
| Providers | `accounts.service.ts`, `create-account.provider.ts`, `update-account.provider.ts`, `delete-account.provider.ts`, `add-opening-balance.provider.ts`, `transfer.provider.ts` |
| Delete rule | Only if currentBalance === 0 AND no historical transactions |
| Transfer | Deduct from source, credit to destination. Use TypeORM transaction |
| Opening balance | Adds to both openingBalance and currentBalance fields |
| AccountTransfer entity | `account-transfer.entity.ts` — fromAccount, toAccount, amount, date, notes, createdBy |

### Day 7 — Accounts Module (Frontend)

| Task | Detail |
|------|--------|
| Route | `ROUTES.ACCOUNTS` → `/dashboard/accounts` |
| Page | List page with DataTable — columns: ID, Name, Account Type, Opening Balance, Current Balance, Created By. Total balance row at bottom |
| Create | Modal form (name, type dropdown) |
| Edit | Modal form |
| Delete | ConfirmDialog — disabled if balance !== 0 or has transactions |
| Opening Balance | Modal form (amount input) — accessible from row action dropdown |
| Transfer | Modal form (from account dropdown, to account dropdown, amount, notes) |
| Formatting | All money values in PKR format (1,00,000) |

### Day 8 — Phase 1 Integration Testing & Fixes

| Task | Detail |
|------|--------|
| Backend | Run all unit tests, fix any failures |
| Frontend | Verify all pages work end-to-end: settings, categories, accounts |
| Verify | Sidebar navigation works, theme toggle works, responsive layout on mobile |
| Verify | Search, pagination, CSV export work on categories and accounts |
| Verify | Account transfers, opening balance adjustments work correctly |
| Verify | Delete guards work (category with items, account with balance) |

---

## Phase 2 — Core Entities (Days 9–15)

### Day 9 — Items & Inventory (Backend)

**Backend:** `src/items/`

| Task | Detail |
|------|--------|
| Entity | `item.entity.ts` — name, category (relation), type (enum: raw_material/final_product), unit (enum: pcs/sets), averagePrice (decimal 12,2), totalQuantity (int, default 0), minStock (int, default 10), createdBy, soft delete |
| DTOs | `create-item.dto.ts`, `update-item.dto.ts`, `item-query.dto.ts` (extends pagination with filters: type, stockStatus, categoryId) |
| Controller | `GET /items` (paginated, search, filtered, sorted A-Z), `GET /items/summary` (total stock value, total units, total items), `POST /items`, `PATCH /items/:id`, `DELETE /items/:id`, `GET /items/export/pdf` |
| Providers | `items.service.ts`, `create-item.provider.ts`, `update-item.provider.ts`, `delete-item.provider.ts` |
| Computed | totalAmount = totalQuantity × averagePrice (computed in query or via @AfterLoad) |
| Delete rule | Only if no records exist against item (no invoice items, recipe items, production items, adjustments) |
| Low stock | Query helper to flag raw materials where totalQuantity < minStock |

### Day 10 — Items & Inventory (Frontend)

| Task | Detail |
|------|--------|
| Route | `ROUTES.ITEMS` → `/dashboard/items` |
| Page | Summary cards at top (Total Stock Value, Total Units, Total Items). DataTable — columns: ID, Name, Category, Type, Unit, Avg Price, Total Qty, Total Amount, Created By, Edit, Delete |
| Filters | Type (Raw Material / Final Product), Stock Status (In Stock / Out of Stock), Category dropdown |
| Create | Modal form (name, category dropdown, type radio, unit dropdown) |
| Edit | Modal form |
| Delete | ConfirmDialog |
| Low stock | Badge/indicator on rows where raw material qty < 10 |

### Day 11 — Suppliers (Backend)

**Backend:** `src/suppliers/`

| Task | Detail |
|------|--------|
| Entity | `supplier.entity.ts` — name, phone, email, address, openingBalance (decimal 12,2, default 0), createdBy, soft delete |
| DTOs | `create-supplier.dto.ts` (name required, phone required, email optional, address optional, openingBalance optional), `update-supplier.dto.ts` |
| Controller | `GET /suppliers` (paginated, search, sorted A-Z), `GET /suppliers/:id` (detail with computed totals), `POST /suppliers`, `PATCH /suppliers/:id`, `DELETE /suppliers/:id` |
| Detail endpoint | Returns: openingBalance, totalPurchaseAmount (sum of purchase invoices), totalPaidAmount (sum of supplier payments), currentBalance (opening + purchases), outstandingBalance (current - paid) |
| Providers | `suppliers.service.ts`, `create-supplier.provider.ts`, `update-supplier.provider.ts`, `delete-supplier.provider.ts`, `supplier-detail.provider.ts` |

### Day 12 — Suppliers (Frontend)

| Task | Detail |
|------|--------|
| Route | `ROUTES.SUPPLIERS` → `/dashboard/suppliers`, `ROUTES.SUPPLIER_DETAIL` → `/dashboard/suppliers/[id]` |
| List page | DataTable — columns: ID, Name, Opening Balance, Total Purchase, Total Paid, Due/Remaining Balance |
| Create | Modal form (name, phone, email, address, opening balance) |
| Edit | Modal form |
| Delete | ConfirmDialog (soft delete) |
| Detail page | Summary cards (Opening Balance, Total Purchase, Total Paid, Outstanding, Current Balance). Tabs: Purchase History, Payment History, Statement. (Tab content wired in Phase 4 & 5 when invoices/payments exist) |

### Day 13 — Customers (Backend)

**Backend:** `src/customers/`

Mirror of suppliers with additions for sales and repairs.

| Task | Detail |
|------|--------|
| Entity | `customer.entity.ts` — name, phone, email, address, openingBalance (decimal 12,2), createdBy, soft delete |
| DTOs | `create-customer.dto.ts` (name required, phone required, rest optional), `update-customer.dto.ts` |
| Controller | `GET /customers` (paginated, search, sorted A-Z), `GET /customers/:id` (detail with computed totals), `POST /customers`, `PATCH /customers/:id`, `DELETE /customers/:id` |
| Detail endpoint | Returns: openingBalance, totalSaleAmount, totalRepairAmount, totalPaymentReceived, currentBalance (opening + sales + repairs), outstandingBalance (current - received) |
| Providers | Same pattern as suppliers |

### Day 14 — Customers (Frontend)

| Task | Detail |
|------|--------|
| Route | `ROUTES.CUSTOMERS` → `/dashboard/customers`, `ROUTES.CUSTOMER_DETAIL` → `/dashboard/customers/[id]` |
| List page | DataTable — columns: ID, Name, Opening Balance, Total Sales, Total Repairs, Total Payments, Due/Remaining |
| Create/Edit/Delete | Same modal pattern as suppliers |
| Detail page | Summary cards. Tabs: Sale History, Repair History, Payment History, Statement. (Content wired in Phase 4 & 5) |

### Day 15 — Phase 2 Integration Testing & Fixes

| Task | Detail |
|------|--------|
| Verify | Items CRUD with all filters, low stock alerts, summary cards |
| Verify | Suppliers CRUD, detail page with computed balances |
| Verify | Customers CRUD, detail page with computed balances |
| Verify | Category-Item relationship (filter by category, prevent category delete) |
| Verify | Search works across all columns for all three modules |
| Verify | PKR formatting displays correctly everywhere |

---

## Phase 3 — Recipes & Production (Days 16–22)

### Day 16 — Recipes (Backend)

**Backend:** `src/recipes/`

| Task | Detail |
|------|--------|
| Entities | `recipe.entity.ts` — name, finalProduct (relation to Item, unique), additionalExpense (decimal 12,2), createdBy, soft delete. `recipe-item.entity.ts` — recipe (relation), item (relation), quantity (int) |
| DTOs | `create-recipe.dto.ts` (name, finalProductId, additionalExpense, items: [{itemId, quantity}]), `update-recipe.dto.ts` |
| Controller | `GET /recipes` (paginated, search), `GET /recipes/:id`, `POST /recipes`, `PATCH /recipes/:id`, `DELETE /recipes/:id` |
| Cost calculation | totalCost = sum(recipeItem.quantity × item.averagePrice) + additionalExpense. Computed dynamically using current item avg prices |
| Providers | `recipes.service.ts`, `create-recipe.provider.ts`, `update-recipe.provider.ts`, `delete-recipe.provider.ts` |
| Rule | 1:1 with final product — reject if recipe already exists for that product |
| Rule | Does NOT affect stock |

### Day 17 — Recipes (Frontend)

| Task | Detail |
|------|--------|
| Route | `ROUTES.RECIPES` → `/dashboard/recipes` |
| List page | DataTable — columns: Final Product, Recipe Name, Ingredients Count, Cost/Unit Price, Created By, View, Edit, Delete |
| Create | Full page form — select final product (dropdown of Final Product items), recipe name, add ingredient rows (item dropdown filtered to Raw Material, qty), additional expense, live total cost calculation |
| Edit | Full page form (same layout, pre-filled) |
| View | Full page detail showing all ingredients with current prices and total |
| Delete | ConfirmDialog |

### Day 18 — Production (Backend — Core)

**Backend:** `src/production/`

| Task | Detail |
|------|--------|
| Entities | `production-batch.entity.ts` — batchNumber, recipe (relation), quantity, status (enum: pending/completed/cancelled), copperAmount (decimal 12,2), copperAccount (relation to Account, nullable), notes, totalCost (decimal 12,2), createdBy, soft delete |
| | `production-unit.entity.ts` — batch (relation), serialNumber (unique), unitCost (decimal 12,2) |
| | `production-unit-item.entity.ts` — productionUnit (relation), item (relation), quantity, unitPrice (decimal 12,2) — SNAPSHOT of price at creation |
| DTOs | `create-production.dto.ts` (recipeId, quantity, copperAmount, copperAccountId, notes, units: [{serialNumber, items: [{itemId, quantity, unitPrice}]}]) |
| Serial numbers | Auto-generate in format: `{prefix}-{year}-{seq}`. Read prefix from settings. Counter resets yearly. Globally unique. |

### Day 19 — Production (Backend — Business Logic)

| Task | Detail |
|------|--------|
| Create provider | Snapshot all items + prices from recipe. Calculate per-unit cost = items total + (copperAmount / quantity). Deduct copper from selected account. Save as Pending. Use TypeORM transaction. |
| Complete provider | Validate all items have sufficient stock. If not → return which items are short. On success: deduct raw materials from stock, add finished inverters to stock (with serial numbers), lock batch. Use transaction. |
| Cancel provider | Only from Pending status. No stock changes (nothing was deducted yet). |
| Edit provider | Only Pending batches. Full reversal of copper account deduction → reapply new values. |
| Delete provider | Only Pending or Cancelled batches. Reverse copper deduction if Pending. |
| Stock validation | `validate-stock.provider.ts` — check each item qty against available stock. Return shortfall list. |

### Day 20 — Production (Frontend — List & Creation)

| Task | Detail |
|------|--------|
| Route | `ROUTES.PRODUCTION` → `/dashboard/production`, `ROUTES.PRODUCTION_CREATE` → `/dashboard/production/create`, `ROUTES.PRODUCTION_DETAIL` → `/dashboard/production/[id]` |
| List page | DataTable — columns: Batch #, Recipe/Product, Quantity, Status, Cost, Created On, Created By, View, Edit, Delete. Status column uses StatusBadge. Total production cost at bottom. |
| Create page | Full page. Select recipe → items pre-fill. Enter batch quantity → generates serial number inputs (LEH-2026-001, etc.). Per-unit item customization (add/remove/change items per inverter OR whole batch). Copper amount input + account dropdown. Real-time cost calculation per unit and total. Notes field. |

### Day 21 — Production (Frontend — Detail, Edit, Status Actions)

| Task | Detail |
|------|--------|
| Detail page | Full page showing batch info, all units with serial numbers, items per unit, costs breakdown |
| Edit page | Full page (same as create, pre-filled). Only for Pending batches. |
| Complete action | Button on detail page → validates stock → shows shortfall list if insufficient → confirms → completes batch |
| Cancel action | Button on detail page → ConfirmDialog → cancels batch |
| Delete | ConfirmDialog — only shown for Pending/Cancelled |

### Day 22 — Phase 3 Integration Testing & Fixes

| Task | Detail |
|------|--------|
| Verify | Recipe CRUD — 1:1 with final product enforced, dynamic cost updates when item prices change |
| Verify | Production create → snapshot items, copper deduction from account, serial number generation |
| Verify | Production complete → stock validation, raw material deduction, finished product addition to stock |
| Verify | Production cancel/delete rules, edit only on pending |
| Verify | Completed batch costs are locked — changing recipe/item prices doesn't affect them |
| Verify | Serial number uniqueness and yearly reset |

---

## Phase 4 — Transactions (Days 23–34)

### Day 23 — Purchase Invoice (Backend)

**Backend:** `src/purchase-invoices/`

| Task | Detail |
|------|--------|
| Entities | `purchase-invoice.entity.ts` — invoiceNumber (auto: PI-0001), supplier (relation), date, discount (decimal 12,2), notes, totalAmount (decimal 12,2), createdBy, soft delete. `purchase-invoice-item.entity.ts` — invoice (relation), item (relation), quantity, unitPrice, totalPrice |
| DTOs | `create-purchase-invoice.dto.ts` (supplierId, date, discount, notes, items: [{itemId, quantity, unitPrice}]) |
| Controller | `GET /purchase-invoices` (paginated, search, date filter, supplier filter), `GET /purchase-invoices/:id`, `POST /purchase-invoices`, `PATCH /purchase-invoices/:id` — NO DELETE endpoint |
| Auto-number | Sequential invoice number generator shared across invoice types |

### Day 24 — Purchase Invoice (Backend — Business Logic)

| Task | Detail |
|------|--------|
| Create provider | Use transaction: save invoice + items, update stock qty per item, recalculate weighted avg price per item, add total to supplier balance |
| Edit provider | Use transaction: reverse ALL old changes (stock qty, avg prices, supplier balance) → apply new values. Complex but ensures integrity |
| Weighted avg | `newAvg = ((oldQty × oldAvg) + (newQty × newPrice)) / (oldQty + newQty)` — extract to shared helper in `src/common/helpers/stock.helper.ts` |

### Day 25 — Purchase Invoice (Frontend)

| Task | Detail |
|------|--------|
| Route | `ROUTES.PURCHASE_INVOICES` → `/dashboard/purchase-invoices`, `ROUTES.PURCHASE_INVOICE_CREATE` → `/dashboard/purchase-invoices/create` |
| List page | DataTable — columns: Invoice #, Supplier, Date, Amount, View, Edit. Total purchase amount at bottom. Filters: supplier dropdown, date range. |
| Create page | Full page using InvoiceForm component. Select supplier, date, add line items (item dropdown, qty, unit price, auto total), discount, notes. Grand total auto-calculates. |
| Edit page | Full page (same layout, pre-filled) |
| View | Modal or detail page showing invoice details |
| No delete | No delete button anywhere |

### Day 26 — Sale Invoice (Backend)

**Backend:** `src/sale-invoices/`

| Task | Detail |
|------|--------|
| Entities | `sale-invoice.entity.ts` — invoiceNumber (SI-0001), customer (relation), date, discount, notes, totalAmount, createdBy, soft delete. `sale-invoice-item.entity.ts` — invoice, item, quantity, unitPrice, totalPrice, serialNumber (nullable) |
| DTOs | `create-sale-invoice.dto.ts` (customerId, date, discount, notes, items: [{itemId, quantity, unitPrice, serialNumber?}]) |
| Controller | `GET /sale-invoices`, `GET /sale-invoices/:id`, `POST /sale-invoices`, `PATCH /sale-invoices/:id` — NO DELETE |

### Day 27 — Sale Invoice (Backend — Business Logic)

| Task | Detail |
|------|--------|
| Create provider | Transaction: save invoice + items, deduct stock qty per item, add total to customer balance. For items with serialNumber (inverters): create SoldInverter record (serial, productionCost from ProductionUnit, saleCost, profit). |
| Edit provider | Transaction: reverse all old changes (stock, customer balance, delete old SoldInverter records) → apply new values |
| Serial selection | `GET /items/:id/available-serials` — returns production unit serial numbers that are in stock (not yet sold) for a given final product item |
| SoldInverter entity | `src/sold-inverters/sold-inverter.entity.ts` — serialNumber, item (relation), customer (relation), productionCost, saleCost, profit, saleDate, createdBy |

### Day 28 — Sale Invoice (Frontend)

| Task | Detail |
|------|--------|
| Route | `ROUTES.SALE_INVOICES` → `/dashboard/sale-invoices`, `ROUTES.SALE_INVOICE_CREATE` → `/dashboard/sale-invoices/create` |
| List page | Same pattern as purchase invoices. Filters: customer, date range. |
| Create page | InvoiceForm with twist: when item type is Final Product, show serial number dropdown (fetched from available serials endpoint). Unit price editable (not forced to production cost). |
| Edit page | Full page with reversal logic |
| View | Invoice detail |

### Day 29 — Repair Invoice (Backend)

**Backend:** `src/repair-invoices/`

| Task | Detail |
|------|--------|
| Entities | `repair-invoice.entity.ts` — invoiceNumber (RI-0001), customer (relation), serialNumber (nullable), description, date, laborCost (decimal 12,2, default 0), isCharged (boolean), totalAmount, createdBy, soft delete. `repair-invoice-item.entity.ts` — invoice, item, quantity, unitPrice, isReal (boolean) |
| DTOs | `create-repair-invoice.dto.ts` (customerId, serialNumber?, description, date, laborCost, isCharged, items: [{itemId, quantity, isReal}]) |
| Controller | `GET /repair-invoices`, `GET /repair-invoices/:id`, `POST /repair-invoices`, `PATCH /repair-invoices/:id` — NO DELETE |

### Day 30 — Repair Invoice (Backend — Business Logic)

| Task | Detail |
|------|--------|
| Create provider | Transaction: save invoice + items. For items where isReal=true → deduct stock. unitPrice = item's current avgPrice. totalAmount = sum of all item costs + laborCost. If isCharged → add totalAmount to customer balance. If FOC → no balance change. |
| Edit provider | Full reversal (restore stock for old isReal items, reverse customer balance if was charged) → apply new values |
| FOC filter | `GET /repair-invoices?isCharged=true/false` for FOC/Charged filtering |

### Day 31 — Repair Invoice (Frontend)

| Task | Detail |
|------|--------|
| Route | `ROUTES.REPAIR_INVOICES` → `/dashboard/repair-invoices`, `ROUTES.REPAIR_INVOICE_CREATE` → `/dashboard/repair-invoices/create` |
| List page | DataTable — columns: Invoice #, Customer, Description, Date, Amount, View, Edit. Filters: customer, date range, FOC/Charged. |
| Create page | Full page. Select customer, optional inverter type + serial number dropdown, description, date. Toggle: Charged / FOC. Add parts (item dropdown, qty, isReal toggle per row). If Charged: labor cost input. Live total calculation. |
| Edit page | Full page, pre-filled |

### Day 32 — Expense Categories + Expenses (Backend)

**Backend:** `src/expense-categories/` + `src/expenses/`

| Task | Detail |
|------|--------|
| ExpenseCategory entity | name, description, createdBy, soft delete |
| Expense entity | date, description, amount (decimal 12,2), category (relation), account (relation), notes, createdBy, soft delete |
| ExpenseCategory controller | Standard CRUD (sorted A-Z, search, CSV export) |
| Expense controller | `GET /expenses` (paginated, search, filters: category, account, date, createdBy), `POST /expenses` (accepts array of expense objects for batch creation), `PATCH /expenses/:id`, `DELETE /expenses/:id` |
| Expense create provider | Transaction: save each expense, deduct amount from respective account |
| Expense edit provider | Reverse old account deduction → apply new |
| Expense delete provider | Reverse account deduction, soft delete |

### Day 33 — Expense Categories + Expenses (Frontend)

| Task | Detail |
|------|--------|
| Routes | `ROUTES.EXPENSE_CATEGORIES`, `ROUTES.EXPENSES`, `ROUTES.EXPENSE_CREATE` |
| Expense Categories page | Simple CRUD with modal forms (same pattern as Categories) |
| Expenses list page | DataTable — columns: Date, Description, Amount, Category, Account, Created By, Notes. Filters: category, account, date range, created by. Total expense at bottom. |
| Expenses create page | Full page. Multi-row form — each row: date, description, amount, category dropdown, account dropdown, notes. Add/remove rows. Each row is independent. Live total. |
| Edit page | Full page, single expense |
| Delete | ConfirmDialog with reversal |

### Day 34 — Phase 4 Integration Testing & Fixes

| Task | Detail |
|------|--------|
| Verify | Purchase invoice → stock update, avg price recalc, supplier balance |
| Verify | Purchase invoice edit → full reversal works correctly |
| Verify | Sale invoice → stock deduction, customer balance, sold inverter creation |
| Verify | Sale invoice serial number selection for inverters |
| Verify | Repair invoice → charged vs FOC, isReal stock logic, customer balance |
| Verify | Expenses batch creation, account deductions |
| Verify | All invoice numbers auto-increment correctly |
| Verify | No delete on invoices — edit only |

---

## Phase 5 — Payments (Days 35–37)

### Day 35 — Supplier Payments (Backend + Frontend)

**Backend:** `src/supplier-payments/`

| Task | Detail |
|------|--------|
| Entity | `supplier-payment.entity.ts` — invoiceNumber (SP-0001), supplier (relation), amount (decimal 12,2), account (relation), date, notes, createdBy, soft delete |
| Controller | `GET /supplier-payments` (paginated, search, filters: supplier, date, account), `POST /supplier-payments`, `PATCH /supplier-payments/:id` — NO DELETE |
| Create provider | Transaction: save payment, deduct from supplier outstanding (reduce supplier currentBalance tracking), deduct from account balance |
| Edit provider | Reverse old (restore supplier balance, restore account balance) → apply new |

**Frontend:**

| Task | Detail |
|------|--------|
| Route | `ROUTES.SUPPLIER_PAYMENTS` → `/dashboard/supplier-payments` |
| List page | DataTable — columns: Invoice #, Supplier, Date, Amount, Created By, View, Edit. Filters: supplier, date, account. |
| Create | Full page form — select supplier, amount, select account, date, notes |
| Edit | Full page form |

### Day 36 — Customer Payments (Backend + Frontend)

**Backend:** `src/customer-payments/` — mirror of supplier payments.

| Task | Detail |
|------|--------|
| Entity | `customer-payment.entity.ts` — invoiceNumber (CP-0001), customer (relation), amount, account (relation), date, notes, createdBy, soft delete |
| Controller | Same pattern as supplier payments |
| Create provider | Transaction: deduct from customer outstanding, credit to account balance |
| Edit provider | Reverse and reapply |

**Frontend:**

| Task | Detail |
|------|--------|
| Route | `ROUTES.CUSTOMER_PAYMENTS` → `/dashboard/customer-payments` |
| Pages | Same pattern as supplier payments, mirrored for customers |

### Day 37 — Wire Payments into Supplier/Customer Detail Pages

| Task | Detail |
|------|--------|
| Supplier detail | Wire Purchase History tab (fetch purchase invoices by supplier), Payment History tab (fetch supplier payments by supplier) |
| Customer detail | Wire Sale History tab, Repair History tab, Payment History tab |
| API endpoints | `GET /purchase-invoices?supplierId=X`, `GET /supplier-payments?supplierId=X`, `GET /sale-invoices?customerId=X`, `GET /repair-invoices?customerId=X`, `GET /customer-payments?customerId=X` |
| Verify | Computed totals on detail pages match sum of actual records |

---

## Phase 6 — Derived Views & Dashboard (Days 38–43)

### Day 38 — Stock Adjustments (Backend + Frontend)

**Backend:** `src/stock-adjustments/`

| Task | Detail |
|------|--------|
| Entity | `stock-adjustment.entity.ts` — item (relation), quantity, unitPrice (nullable), type (enum: add/deduct), reason (enum: opening_stock/miscount/return_to_supplier/damaged_lost), supplier (relation, nullable), notes, date, createdBy, soft delete |
| Controller | `GET /stock-adjustments` (paginated, search), `GET /stock-adjustments?itemId=X` (history for specific item), `POST /stock-adjustments`, `PATCH /stock-adjustments/:id`, `DELETE /stock-adjustments/:id` |
| Create — Add | Increase stock qty, recalculate weighted avg price |
| Create — Deduct (Return) | Decrease stock qty, deduct amount (qty × avgPrice) from supplier balance |
| Create — Deduct (Damaged) | Decrease stock qty only. Pure loss. |
| Edit/Delete | Full reversal of stock + balance changes |

**Frontend:**

| Task | Detail |
|------|--------|
| Route | `ROUTES.STOCK_ADJUSTMENTS` → `/dashboard/stock-adjustments` |
| Page | Select item → shows current stock info. Adjustment form: type (add/deduct), reason dropdown (changes based on type), qty, unit price (only for add), supplier dropdown (only for return), notes. History table below. |

### Day 39 — Sold Inverters (Backend + Frontend)

**Backend:** `src/sold-inverters/` (entity already created in Day 27)

| Task | Detail |
|------|--------|
| Controller | `GET /sold-inverters` (paginated, search, filters: customer, date), `GET /sold-inverters/summary` (total production cost, total sale cost, total profit) |
| Read-only | No create/update/delete endpoints — records managed by sale invoice logic |

**Frontend:**

| Task | Detail |
|------|--------|
| Route | `ROUTES.SOLD_INVERTERS` → `/dashboard/sold-inverters` |
| Page | DataTable — columns: Serial #, Item Name, Customer, Production Cost, Sale Cost, Profit. Summary cards at top (totals). Filters: customer, date range. View detail button. |

### Day 40 — Dashboard (Backend)

**Backend:** `src/dashboard/`

| Task | Detail |
|------|--------|
| Controller | `GET /dashboard?from=DATE&to=DATE` — returns all 11 card values |
| Provider | `dashboard.service.ts` — aggregate queries across all modules. Each card value is a sum/count query filtered by date range. |
| Card values | totalPurchaseCost (sum of purchase invoices), totalExpensesCost (sum of expenses), totalInStockAmount (sum of item qty × avg price), totalSalePrice (sum of sale invoices), totalRepairCost (sum of charged repair invoices), totalSoldInvertersProfit (sum of sold inverter profits), totalAmountToPay (sum of supplier outstanding balances), totalAmountToReceive (sum of customer outstanding balances), totalCurrentBalance (sum of account balances), totalProductionCost (sum of production batch costs), overallProfit (formula TBD) |
| Charts data | `GET /dashboard/charts?from=DATE&to=DATE` — monthly breakdowns for line/bar charts |

### Day 41 — Dashboard (Frontend)

| Task | Detail |
|------|--------|
| Route | `ROUTES.DASHBOARD` → `/dashboard` (already exists, replace placeholder) |
| Page | Date filter bar (today/month/year/custom). 11 SummaryCards — each clickable, redirects to related page. All values in PKR format. |
| Charts | ApexCharts integration — purchase vs sales trend (line chart), expense breakdown by category (pie chart), monthly production cost (bar chart). Charts respond to date filter. |

### Day 42 — Dashboard Charts & Polish

| Task | Detail |
|------|--------|
| Charts | Fine-tune chart types, colors matching theme (light/dark), responsive sizing |
| Date filter | Verify today/month/year/custom all return correct data |
| Card links | Verify each card navigates to correct page |
| Performance | Ensure dashboard queries are optimized (indexes on date columns) |

### Day 43 — Phase 6 Integration Testing

| Task | Detail |
|------|--------|
| Verify | Stock adjustments — add/deduct/return-to-supplier all work, reversal on edit/delete |
| Verify | Sold inverters — populated from sales, totals correct |
| Verify | Dashboard cards — all 11 values match actual data |
| Verify | Dashboard date filters work correctly |
| Verify | Charts render properly in both light and dark themes |

---

## Phase 7 — Cross-Cutting Polish (Days 44–52)

### Day 44 — PDF Template Engine Setup

| Task | Detail |
|------|--------|
| Backend | Install PDF generation library (e.g., `pdfkit` or `puppeteer` or `@react-pdf/renderer` on server). Create `src/common/pdf/` with base template: company logo, name, address, phone in header. Professional modern layout. |
| Template | `pdf-template.provider.ts` — accepts data + template type, returns PDF buffer |
| Config | Read company details from BusinessSettings entity |
| Logo | Download and store the Power Genix logo from provided URL |

### Day 45 — Invoice PDF Templates

| Task | Detail |
|------|--------|
| Purchase Invoice PDF | `GET /purchase-invoices/:id/pdf` — header (company info + supplier info), line items table, discount, total, footer |
| Sale Invoice PDF | `GET /sale-invoices/:id/pdf` — header (company info + customer info), line items (with serial numbers for inverters), discount, total |
| Repair Invoice PDF | `GET /repair-invoices/:id/pdf` — header, parts list with isReal indicator, labor cost, total |
| Frontend | PDF download button on each invoice view/detail page |

### Day 46 — Statement PDFs

| Task | Detail |
|------|--------|
| Supplier Statement | `GET /suppliers/:id/statement?from=DATE&to=DATE` — returns JSON for statement page. `GET /suppliers/:id/statement/pdf?from=DATE&to=DATE` — returns PDF |
| Statement columns | Date, Invoice #, Purchase Amount, Amount Paid, Outstanding Balance (running) |
| Footer | Opening Balance, Total Purchase Amount, Total Paid Amount, Total Outstanding Balance |
| Customer Statement | Same pattern — columns: Date, Invoice #, Sale Amount, Repair Amount, Amount Received, Outstanding Balance |
| Footer | Opening Balance, Total Sale Amount, Total Repair Amount, Total Received Amount, Outstanding Balance |

### Day 47 — Statements (Frontend) + Wire into Detail Pages

| Task | Detail |
|------|--------|
| Supplier statement tab | DataTable with statement columns, date range filter, PDF download button, pagination, row-level view button |
| Customer statement tab | Same with customer-specific columns |
| Wire into detail pages | Supplier detail → Statement tab fully functional. Customer detail → Statement tab fully functional |

### Day 48 — CSV Export Across All Modules

| Task | Detail |
|------|--------|
| Backend | Create shared CSV export helper in `src/common/helpers/csv.helper.ts`. Each module controller gets `/export/csv` endpoint. |
| Modules | Categories, Accounts, Items, Suppliers, Customers, Recipes, Production, Purchase Invoices, Sale Invoices, Repair Invoices, Supplier Payments, Customer Payments, Expenses, Expense Categories, Stock Adjustments, Sold Inverters |
| Frontend | CSV export button on every DataTable — calls the export endpoint, triggers browser download |

### Day 49 — Dark/Light Theme Finalization

| Task | Detail |
|------|--------|
| Audit | Go through every page and component, verify dark mode colors are correct |
| DataTable | Ensure table headers, rows, hover states, pagination all look good in both themes |
| Forms | Verify input fields, dropdowns, modals in dark mode |
| Charts | ApexCharts theme colors adapt to light/dark |
| PDF | PDFs always use light theme (print-friendly) |
| Fix | Any remaining theme issues |

### Day 50 — Responsive Layout Testing

| Task | Detail |
|------|--------|
| Desktop | Verify all pages at 1920px, 1440px, 1280px |
| Tablet | Verify at 768px — sidebar collapses to hamburger, tables scroll horizontally |
| Mobile | Verify at 375px — full hamburger nav, stacked forms, readable tables |
| DataTable | Horizontal scroll on small screens, priority columns visible |
| Forms | Stack to single column on mobile |
| Modals | Full-screen on mobile, centered on desktop |

### Day 51 — Edge Case Testing & Data Integrity

| Task | Detail |
|------|--------|
| Invoice edit reversal | Create purchase invoice → edit it → verify stock and balances are correct |
| Production flow | Create recipe → produce batch → complete → sell inverter → verify entire chain |
| Balance integrity | After multiple purchases + payments + expenses, verify account balances match sum of transactions |
| Negative balances | Test overpayment flows for suppliers and customers |
| Stock limits | Test that stock cannot go negative through any action |
| Concurrent edits | Test that transaction isolation prevents race conditions on stock updates |
| Soft delete | Verify deleted records are hidden but still referenced correctly in related records |

### Day 52 — Final Polish & Cleanup

| Task | Detail |
|------|--------|
| Performance | Add database indexes on frequently queried columns (date, invoiceNumber, foreign keys) |
| Loading states | Verify all pages show spinner during data fetch |
| Error handling | Verify toast notifications on API errors |
| Empty states | Verify NoContentCard shows on empty tables |
| Sidebar | Verify active page highlight in navigation |
| Final audit | Complete walkthrough of every feature |

---

## Key Conventions Reference

### Backend (NestJS)
- Module structure: `module.ts`, `controller.ts`, `providers/`, `dtos/`, `entities/`, `enums/`
- One provider per action (e.g., `create-account.provider.ts`)
- Provider with spec → folder (`create-account.provider/`), without spec → plain file
- TypeORM transactions for multi-table operations
- `handleError` from `@/common/error-handlers/error.handler.ts` in catch blocks
- Swagger decorators on all endpoints
- `@ActiveUser()` decorator for authenticated user
- Pagination via `PaginationModule` from `@/common/pagination/`
- Soft delete: `@DeleteDateColumn()` on all entities
- All monetary fields: `{ type: 'decimal', precision: 12, scale: 2 }`

### Frontend (Next.js)
- All routes via `ROUTES.*` constant — never hardcode strings
- All shared code under `app/_shared/`
- camelCase folders/files, PascalCase exports
- SCSS modules co-located with components
- CSS custom properties for all colors — dark mode via `:global(.dark) &`
- Formik + Yup for forms
- `apiClient` from `@/app/_shared/lib/api/client` for all API calls
- Max 300–350 lines per component file — split into sub-components
- `useAppDispatch` / `useAppSelector` typed hooks for Redux
- Assets through `index.ts` exports only
- `<Image />` from `next/image` — never `<img>`

### Shared Patterns
- Every listing: search all columns, pagination, date range filter, CSV export
- Every create: validation with clear error messages
- Every edit: modal for simple entities, full page for complex
- Every delete: ConfirmDialog confirmation modal
- All money displayed in PKR format (1,00,000)
- All tables sorted: alphabetical for entities, date descending for transactions

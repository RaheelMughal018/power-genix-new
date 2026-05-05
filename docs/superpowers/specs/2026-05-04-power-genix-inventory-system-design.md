# Power Genix — Inventory, Production, Sales & Accounting Management System

## Design Specification

**Date:** 2026-05-04
**Business:** Power Genix — Inverter manufacturing and sales
**Stack:** Next.js 16 (frontend) + NestJS 11 (backend) + PostgreSQL + TypeORM
**Currency:** PKR (Pakistani formatting: 1,00,000)
**Language:** English only
**Theme:** Light + Dark mode
**Fiscal Year:** July–June (Pakistan standard)

---

## 1. System Overview

Centralized platform for managing inventory, production, sales, repairs, accounts, expenses, and financial reporting for an inverter manufacturing business. Single-user system with email/password authentication.

### Intended User
- Single business owner/operator
- Email/password login
- No role-based access control — full access to everything

### Cross-Cutting Requirements

| Requirement | Detail |
|-------------|--------|
| Search | Every table searchable across all columns, dynamic results |
| Sorting | Alphabetical (A–Z) for entity lists; date descending for transactions |
| Pagination | All major tables paginated |
| Date Range Filter | Today / This Month / This Year / Custom — on all listing pages |
| CSV Export | All tables |
| PDF Export | Invoices, statements, reports — using business-branded template |
| Soft Delete | All entities use `deletedAt` column. No hard deletes anywhere |
| Data Refresh | On page reload. No websockets/real-time |
| Created By | Displayed on all relevant tables (always same user) |
| Number Format | Pakistani style: 1,00,000 |
| Monetary Precision | decimal(12,2) for all money fields |

---

## 2. Module Definitions

### 2.1 Authentication

- Email/password login
- JWT access/refresh tokens (existing NestJS auth template)
- Password change from settings page
- No signup flow — single user seeded via admin seeder

### 2.2 User Settings

Combined profile + business settings page:

**Profile Fields:**
- First Name, Last Name, Phone, Email, Address

**Business Settings:**
- Company Name, Company Logo (image upload), Company Address, Company Phone
- Serial Number Prefix (default: LEH)
- Fiscal Year Start (default: July)

**Used in:** PDF templates for all invoices and statements.

### 2.3 Categories

Flat item categorization. No hierarchy.

**Fields:** name
**Rules:**
- Cannot delete if items are assigned
- Alphabetical sorting
- Search, CSV export, pagination

### 2.4 Accounts

Business transaction accounts for tracking money flow.

**Fields:** name, type (Cash | Bank | Mobile Wallet), openingBalance, currentBalance

**Account Types:** Cash, Bank, Mobile Wallet (JazzCash/EasyPaisa)

**Rules:**
- Current balance can go negative (payments allowed even from 0 balance accounts)
- Opening balance: NOT set at creation. Added later as adjustment only.
- Account-to-account transfer: 1:1, no fees
- Delete: only if balance is 0 AND no historical transactions
- Total current balance displayed at bottom of table
- Alphabetical sorting

**Balance Logic:**
- Payments deduct from account balance
- Customer payments credit account balance
- Expenses deduct from account balance
- Transfers: deduct from source, credit to destination

### 2.5 Items & Inventory

**Fields:** name, category, type (Raw Material | Final Product), unit (PCS | SETS), averagePrice, totalQuantity, totalAmount (qty x avg price — computed)

**Top Summary:** Total Stock Value, Total Units In Stock, Total Items In Stock

**Rules:**
- Average price: weighted average from purchases (raw materials) or production cost (final products)
- Weighted avg formula: `newAvg = ((oldQty * oldAvg) + (newQty * newPrice)) / (oldQty + newQty)`
- Low stock warning: minimum 10 units, raw materials only
- Stock cannot go negative
- Type is strictly one: Raw Material OR Final Product
- Units: PCS and SETS only
- Delete: only if no records exist against item
- Filters: Raw Material / Final Product, In Stock / Out of Stock, Categories
- Alphabetical sorting

### 2.6 Suppliers

**Creation Fields:** Name (required), Phone (required), Email, Address
**Opening Balance:** Set only at creation time, not adjustable later

**Detail Page Shows:**
- Opening Balance, Total Purchase Amount, Total Paid Amount, Outstanding Amount, Current Balance
- Purchase History table
- Payment History table
- Statement (combined timeline)

**Balance Formulas:**
- Current Balance = Opening Balance + Total Purchase Amount
- Outstanding Balance = Current Balance - Total Paid Amount
- Balance can go negative (overpayment = credit)

**Rules:**
- Soft delete only
- Alphabetical sorting

### 2.7 Customers

Same structure as Suppliers with additions:

**Detail Page Shows:**
- Opening Balance, Total Sale Amount, Total Repair Amount, Total Payment Received, Outstanding Amount, Current Balance
- Sale History table
- Repair History table
- Payment History table
- Statement (combined timeline of sales + repairs + payments)

**Balance Formulas:**
- Current Balance = Opening Balance + Total Sale Amount + Total Repair Amount
- Outstanding Balance = Current Balance - Total Payment Received
- Balance can go negative (overpayment = credit)

### 2.8 Recipes

Define materials required to manufacture an inverter.

**Fields:** name, finalProduct (Item of type Final Product), additionalExpense (flat amount), totalCost

**Recipe Items:** item (from stock), quantity

**Rules:**
- 1:1 relationship — one recipe per final product
- Creating a recipe does NOT affect stock
- Total cost = sum of (item qty × item avg price) + additional expense
- Dynamic price update: recipe cost always reflects latest item average prices
- Can be deleted even if production batches exist (batches store their own cost snapshot)
- Search, CSV export, pagination

### 2.9 Production

Manage inverter manufacturing batches.

**Creation Flow:**
1. Select recipe → items pre-fill from recipe
2. User can modify items per individual inverter OR entire batch
3. Enter quantity of inverters to produce (qty > 1 = batch, qty = 1 = single)
4. Assign serial numbers per unit — format: `{PREFIX}-{YYYY}-{SEQ}` (e.g., LEH-2026-001)
5. Enter copper amount + select account to deduct from (copper cost is deducted from the selected account on save)
6. Enter notes
7. Real-time cost calculation as user modifies items
8. Save as Pending

**Serial Numbers:**
- Format: `{configurable_prefix}-{current_year}-{sequential_number}`
- Default prefix: LEH
- Counter resets each year
- Globally unique across all batches

**Statuses:** Pending → Completed | Cancelled

**Stock Impact (on Completed only):**
- Raw materials deducted from stock
- Finished inverters added to stock with serial numbers
- Pre-validation: check all items have sufficient stock before allowing completion. Show which items are insufficient.

**Snapshot Rule:** Production stores a full snapshot of all items, quantities, and unit prices at the time of creation. This snapshot is immutable — future recipe edits or item price changes do NOT affect existing batches (pending or completed). Recipe edits only apply to future productions.

**Edit/Delete:**
- Edit: only in Pending status. All changes (modifications, removals) tracked
- Delete: only on Pending or Cancelled status
- Completed batches: cannot edit, delete, or cancel

**Cost Per Unit:** (actual items used for that unit) + (copper amount / batch qty). Copper is equally distributed across all units in the batch. Recipe additional expense included if not overridden.
**Batch Total Cost:** Sum of all unit costs.

### 2.10 Purchase Invoices

**Creation Form:** Select supplier, date, line items (item + qty + unit price), discount (invoice level), notes

**Line Items:** Multiple items per invoice. Each line: item, quantity, unit price, total price (auto-calculated)

**Invoice Number:** Auto-generated sequential (e.g., PI-0001)

**On Save:**
- Stock quantity increases per item
- Weighted average price recalculates per item
- Invoice total (after discount) adds to supplier balance (increases what business owes)

**Edit:** Yes — full reversal of old stock/balance changes, then apply new values
**Delete:** NO — purchase invoices cannot be deleted

**Filters:** Supplier, Date range
**Table shows:** Total purchase amount at bottom

### 2.11 Sale Invoices

**Creation Form:** Select customer, date, line items (item + qty + unit price), discount, notes

**Line Items:**
- Raw materials: item + qty + unit price
- Final products (inverters): item + serial number selection + unit price (user-entered, not forced to production cost)
- When selling an inverter, user selects from available serial numbers for that product type

**Invoice Number:** Auto-generated sequential (e.g., SI-0001)

**On Save:**
- Stock quantity deducted per item
- Invoice total (after discount) adds to customer balance
- For inverters: SoldInverter record created (serial, production cost, sale cost, profit)

**Profit per inverter:** Sale Price - Production Cost

**Edit:** Yes — full reversal and reapply
**Delete:** NO

**Filters:** Customer, Date range

### 2.12 Repair Invoices

**Creation Form:** Select customer, inverter type (optional), serial number (optional — only for inverters sold by this business), description, date

**Two Types:**

**Charged Repair:**
- Parts used: items + qty + `is_real` boolean per item
  - `is_real = true`: deduct stock qty, add item cost to repair total
  - `is_real = false`: only add item price to repair total, NO stock deduction
- Labor cost (amount)
- Total = sum of parts costs + labor cost
- Total adds to customer balance (no account selection on invoice — payment handled via Customer Payments)

**FOC (Free of Cost) Repair:**
- Parts used: items + qty + `is_real` boolean per item (same logic as charged)
- No labor cost, no money involved
- Completely free

**Invoice Number:** Auto-generated sequential (e.g., RI-0001)

**On Save:**
- Charged: parts affect stock (per is_real), total amount (parts + labor) adds to customer balance. No account on invoice — payment handled separately via Customer Payments.
- FOC: parts affect stock (per is_real) only. No balance changes. No customer balance impact.

**Not limited to business's own inverters** — any product can be repaired.

**Edit:** Yes — full reversal and reapply
**Delete:** NO

**Filters:** Customer, Date range, FOC/Charged

### 2.13 Sold Inverters

**Read-only tracking view.** No CRUD — records auto-created from sale invoices.

**Table Columns:** Serial #, Item Name, Customer, Production Cost, Sale Cost, Profit

**Profit Formula:** Sale Cost - Production Cost

**Totals:** Production Cost, Sale Cost, Profit
**Filters:** Customer, Date range
**No returns flow.**

### 2.14 Supplier Payments

**Creation Form:** Select supplier, amount, select account, date, notes

**Invoice Number:** Auto-generated sequential (e.g., SP-0001)

**On Save:**
- Deducts from supplier outstanding balance
- Deducts from selected account balance
- Overpayment allowed (creates credit/negative balance on supplier)

**Edit:** Yes — full reversal and reapply
**Delete:** NO

**Filters:** Supplier, Date range, Account

### 2.15 Customer Payments

Mirror of Supplier Payments.

**Creation Form:** Select customer, amount, select account, date, notes

**Invoice Number:** Auto-generated sequential (e.g., CP-0001)

**On Save:**
- Deducts from customer outstanding balance
- Credits selected account balance

**Edit:** Yes — full reversal and reapply
**Delete:** NO

**Filters:** Customer, Date range, Account

### 2.16 Expense Categories

Flat categorization for expenses.

**Fields:** name, description
**Rules:**
- Soft delete allowed. Existing expenses retain their category reference.
- No presets — user adds their own
- Alphabetical sorting

### 2.17 Expenses

**Creation:** Batch form — add multiple independent expense rows at once. Each row is its own record.

**Fields per expense:** date, description, amount, category, account, notes

**On Save:** Each expense deducts from its own selected account

**Edit/Delete:** Yes — with reversal of account balance

**Filters:** Category, Account, Date range, Created By

### 2.18 Stock Adjustments

Manual stock corrections.

**Creation:** Select item → system shows current stock details → enter adjustment

**Adjustment Types:**
- **Add:** quantity + unit price (affects both stock qty and weighted average price). Reasons: Opening Stock, Miscount.
- **Deduct — Return to Supplier:** quantity + select supplier. Amount (qty x avg price) deducted from supplier balance. Reduces what you owe them.
- **Deduct — Damaged/Lost:** quantity only. Pure stock loss — no balance impact anywhere.

**Edit/Delete:** Yes — with reversal

**History Table:** ID, Date, Quantity, Unit Price, Type (Add/Deduct), Reason, Supplier (if return), Notes, Adjusted By

### 2.19 Dashboard

**Summary Cards (11):**
1. Total Purchase Cost → links to Purchase Invoices
2. Total Expenses Cost → links to Expenses
3. Total In-Stock Amount (sum of qty × avg price) → links to Items
4. Total Sale Price → links to Sale Invoices
5. Total Repair Cost → links to Repair Invoices
6. Total Sold Inverters Profit → links to Sold Inverters
7. Total Amount To Pay → links to Supplier Payments
8. Total Amount To Receive → links to Customer Payments
9. Total Current Balance → links to Accounts
10. Total Production Cost → links to Production
11. Overall Profit (formula pending client confirmation)

**Date Filters:** Today, This Month, This Year, Custom

**Graphs:** ApexCharts library. Chart types to be designed based on data patterns (bar, line, pie as appropriate).

**Refresh:** On page reload

**Profit Formula (pending confirmation):**
```
Overall Profit = (Total Sale Price + Total Repair Cost + Total In-Stock Amount + Total Amount To Receive + Total Current Balance)
               - (Total Purchase Cost + Total Expense Cost + Total Amount To Pay)
```

### 2.20 Supplier & Customer Statements

**Not separate modules** — accessed from Supplier/Customer detail pages.

**Supplier Statement:** Combined timeline of Purchase Invoices + Supplier Payments, sorted by date.

**Columns:** Date | Invoice # | Purchase Amount | Amount Paid | Outstanding Balance

**Footer:** Opening Balance, Total Purchase Amount, Total Paid Amount, Total Outstanding Balance

**Customer Statement:** Combined timeline of Sale Invoices + Repair Invoices + Customer Payments, sorted by date.

**Columns:** Date | Invoice # | Sale Amount | Repair Amount | Amount Received | Outstanding Balance

**Footer:** Opening Balance, Total Sale Amount, Total Repair Amount, Total Received Amount, Outstanding Balance

**Features:** Date range filter, PDF download, pagination, row-level view button

### 2.21 PDF Templates

Business-branded PDF templates used for:
- Purchase Invoices
- Sale Invoices
- Repair Invoices
- Supplier Statements
- Customer Statements
- Reports

**Template includes:** Company logo, company name, company address, company phone. Designed as a professional business document.

**Logo:** https://prod.hsol.pk/files/system/_file6904e8851fc62-site-logo.png
**Charts library:** ApexCharts
**PDF layout:** Modern professional business template

---

## 3. Database Schema

### Entity Relationship Summary

```
User (single)
├── creates → all entities (createdBy reference)
└── settings → business info, logo, serial prefix

Category
└── has many → Item

Account
├── referenced by → SupplierPayment, CustomerPayment, Expense, AccountTransfer
└── fields: name, type, openingBalance, currentBalance

Item
├── belongs to → Category
├── type: raw_material | final_product
├── referenced by → RecipeItem, PurchaseInvoiceItem, SaleInvoiceItem, RepairInvoiceItem, ProductionUnitItem, StockAdjustment
└── tracks: averagePrice, totalQuantity

Supplier
├── has many → PurchaseInvoice, SupplierPayment
└── tracks: openingBalance (set once at creation)

Customer
├── has many → SaleInvoice, RepairInvoice, CustomerPayment
└── tracks: openingBalance (set once at creation)

Recipe
├── belongs to → Item (final product, 1:1)
├── has many → RecipeItem
└── fields: name, additionalExpense, totalCost (dynamic)

RecipeItem
├── belongs to → Recipe
└── references → Item (raw material) + quantity

ProductionBatch
├── references → Recipe
├── has many → ProductionUnit
└── fields: batchNumber, quantity, status, copperAmount, copperAccount, notes, totalCost

ProductionUnit
├── belongs to → ProductionBatch
├── has many → ProductionUnitItem
└── fields: serialNumber (globally unique), unitCost

ProductionUnitItem
├── belongs to → ProductionUnit
└── references → Item + quantity + unitPrice (snapshot)

PurchaseInvoice
├── belongs to → Supplier
├── has many → PurchaseInvoiceItem
└── fields: invoiceNumber, date, discount, notes, totalAmount

PurchaseInvoiceItem
├── belongs to → PurchaseInvoice
└── references → Item + quantity + unitPrice + totalPrice

SaleInvoice
├── belongs to → Customer
├── has many → SaleInvoiceItem
└── fields: invoiceNumber, date, discount, notes, totalAmount

SaleInvoiceItem
├── belongs to → SaleInvoice
└── references → Item + quantity + unitPrice + totalPrice + serialNumber (nullable)

RepairInvoice
├── belongs to → Customer
└── fields: invoiceNumber, serialNumber (nullable), description, date, laborCost, isCharged, totalAmount

RepairInvoiceItem
├── belongs to → RepairInvoice
└── references → Item + quantity + unitPrice + isReal

SoldInverter (auto-created from sales)
├── references → Item, Customer
└── fields: serialNumber, productionCost, saleCost, profit, saleDate

SupplierPayment
├── belongs to → Supplier
├── references → Account
└── fields: invoiceNumber, amount, date, notes

CustomerPayment
├── belongs to → Customer
├── references → Account
└── fields: invoiceNumber, amount, date, notes

ExpenseCategory
└── has many → Expense

Expense
├── belongs to → ExpenseCategory
├── references → Account
└── fields: date, description, amount, notes

StockAdjustment
├── references → Item, Supplier (nullable, for return to supplier)
└── fields: quantity, unitPrice (nullable), type (add/deduct), reason (opening_stock/miscount/return_to_supplier/damaged_lost), notes, date

AccountTransfer
├── references → Account (from), Account (to)
└── fields: amount, date, notes
```

### Common Columns (all entities)

- `id` — UUID primary key
- `createdBy` — reference to User
- `createdAt` — timestamp
- `updatedAt` — timestamp
- `deletedAt` — timestamp (soft delete)

---

## 4. Frontend Architecture

### Layout

- **Sidebar navigation** (collapsible) — all module links grouped logically
- **Top header** — user profile dropdown, theme toggle (light/dark)
- **Main content area** — breadcrumbs + page content
- **Responsive** — sidebar collapses to hamburger on mobile/tablet

### Shared Components (built once in Phase 1)

| Component | Purpose |
|-----------|---------|
| DataTable | Pagination, search all columns, column sorting, date range filter, CSV export, PDF download |
| FilterBar | Reusable dropdown filters (supplier/customer/category/account) + date range (today/month/year/custom) |
| SummaryCards | Reusable top-of-page totals display |
| InvoiceForm | Reusable line-item form (add/remove rows, auto-calculate totals, discount) |
| ModalForm | Create/edit modals following existing component conventions |
| ConfirmDialog | Delete/action confirmation |
| StatusBadge | Production status, stock alerts |
| PDFViewer | Preview/download generated PDFs |

### State Management

- Redux Toolkit (existing convention)
- Auth slice: token, user profile
- Theme slice: light/dark
- No heavy client caching — fresh fetch on page load

### Page Pattern (per module)

1. **List page** — DataTable + FilterBar + actions (add, export)
2. **Create/Edit** — Modal for simple entities (categories, accounts, expense categories). Full page for complex entities (invoices, production, recipes, expenses, payments, stock adjustments)
3. **Delete** — Always shows a confirmation modal before proceeding
4. **Detail page** — Suppliers, Customers, Production batches
5. **Statement page** — Suppliers, Customers

---

## 5. Development Phases

### Phase 1 — Foundation (No dependencies)
- Authentication (login, JWT, password change)
- User Settings (profile + business info + serial prefix + fiscal year)
- Shared UI components (DataTable, FilterBar, SummaryCards, ModalForm, InvoiceForm, layout/sidebar)
- Categories (flat CRUD)
- Accounts (CRUD, opening balance, transfers)

### Phase 2 — Core Entities
- Items & Inventory (CRUD, stock tracking, avg price, low stock alerts, filters)
- Suppliers (CRUD, profile page, balance tracking)
- Customers (CRUD, profile page, balance tracking)

### Phase 3 — Recipes & Production
- Recipes (CRUD, 1:1 final product, dynamic cost)
- Production (batch creation, per-unit customization, serial numbers, status flow, stock validation, stock impact on completion)

### Phase 4 — Transactions
- Purchase Invoices (line items, stock + avg price update, supplier balance, edit with reversal)
- Sale Invoices (line items, serial selection, stock deduction, customer balance, sold inverter creation)
- Repair Invoices (charged/FOC, is_real logic, optional serial, account selection)
- Expense Categories (flat CRUD)
- Expenses (batch creation, account deduction)

### Phase 5 — Payments
- Supplier Payments (account + supplier balance deduction)
- Customer Payments (account credit + customer balance deduction)

### Phase 6 — Derived Views & Dashboard
- Stock Adjustments (add/deduct, avg price recalc)
- Sold Inverters (read-only profit tracking)
- Dashboard (11 cards, graphs, date filters, profit formula)

### Phase 7 — Cross-Cutting Polish
- PDF templates (invoices, statements) with business branding
- CSV export verification across all modules
- Supplier & Customer statements (combined timeline + PDF)
- Dark/Light theme finalization
- Responsive layout testing
- Edge case testing and data integrity verification

---

## 6. Key Business Rules Summary

1. All monetary calculations must be accurate (decimal(12,2))
2. Stock quantities cannot go negative
3. Historical production costs remain fixed after completion
4. Weighted average price updates on every purchase and stock adjustment (add)
5. Invoice edit = full reversal of old values + apply new values
6. Purchase/Sale/Repair invoices cannot be deleted
7. Completed production batches cannot be edited, deleted, or cancelled
8. Serial numbers are globally unique, format: PREFIX-YYYY-SEQ, counter resets yearly
9. FOC repairs: is_real=true deducts stock, is_real=false only adds price
10. Soft delete on everything — no hard deletes
11. All tables: search all columns, pagination, date range filter, CSV export
12. Dashboard totals update on page reload with date filter support
13. Supplier/Customer balances can go negative (overpayment = credit)
14. Account deletion only when balance = 0 AND no historical data
15. Recipe costs always reflect latest item average prices

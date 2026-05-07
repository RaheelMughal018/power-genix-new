# Power Genix — Software Specification Document

**Project:** Inventory, Production, Sales & Accounting Management System
**Prepared For:** Power Genix
**Date:** May 4, 2026
**Version:** 1.0

---

## 1. What Is This System?

Power Genix is a web-based application designed to manage all day-to-day operations of your inverter manufacturing and sales business from one place. Instead of managing inventory, production, sales, repairs, payments, and expenses separately (in spreadsheets, notebooks, or multiple tools), this system brings everything together into a single, easy-to-use platform.

You will be able to:
- Track all your inventory (raw materials and finished inverters)
- Manage the manufacturing process from recipe to finished product
- Create and track purchase, sale, and repair invoices
- Manage supplier and customer accounts with full payment history
- Track expenses and account balances
- View statements and financial summaries
- Export reports as PDF or CSV files
- See your overall business performance on a dashboard

The system works on desktop computers, tablets, and mobile phones through any web browser. It supports both light and dark display modes for comfortable use at any time.

---

## 2. Who Will Use This System?

This system is designed for a single user — the business owner or operator. You log in with your email and password, and you have full access to all features. There are no different permission levels or multiple user accounts.

---

## 3. System Features — Module by Module

### 3.1 Dashboard

The Dashboard is the first page you see after logging in. It gives you a quick snapshot of your entire business.

**What you will see:**

11 summary cards showing key numbers:
1. **Total Purchase Cost** — how much you have spent on purchases
2. **Total Expenses Cost** — how much you have spent on expenses
3. **Total In-Stock Amount** — the total value of everything currently in your inventory
4. **Total Sale Price** — total revenue from all sales
5. **Total Repair Cost** — total revenue from repair services
6. **Total Sold Inverters Profit** — profit made from inverter sales
7. **Total Amount To Pay** — how much you owe to suppliers
8. **Total Amount To Receive** — how much customers owe you
9. **Total Current Balance** — total balance across all your accounts
10. **Total Production Cost** — how much you have spent on manufacturing
11. **Overall Profit** — your overall business profit

Each card is clickable — tapping on "Total Purchase Cost" takes you to the Purchase Invoices page, tapping on "Total Expenses Cost" takes you to the Expenses page, and so on.

**Filtering by date:** You can view these numbers for Today, This Month, This Year, or any Custom Date Range.

**Graphs:** The dashboard will also include visual graphs (powered by ApexCharts) to help you understand trends at a glance — including bar charts, line charts, and pie charts as appropriate for the data.

---

### 3.2 Accounts

Accounts represent where your money is stored — your cash in hand, bank accounts, or mobile wallets (like JazzCash or EasyPaisa).

**What you can do:**
- Add a new account (Cash, Bank, or Mobile Wallet)
- Add an opening balance later as an adjustment (opening balance is not set during creation)
- Transfer money between accounts (for example, from Cash to Bank)
- View the current balance of each account
- See the total balance across all accounts at the bottom of the list

**How balances work:**
- When you receive a payment from a customer, the selected account balance goes up
- When you pay a supplier, the selected account balance goes down
- When you record an expense, the selected account balance goes down
- Transfers simply move money from one account to another (no fees)
- Account balances can go below zero (negative) — you can make payments even from accounts with zero balance

**Deleting accounts:** You can only delete an account if its balance is zero and it has no past transactions. Deleted accounts are kept in the system's records but hidden from view.

---

### 3.3 Categories

Categories help you organize your inventory items into groups (for example: Capacitors, Transformers, Cables, Fans, etc.).

**What you can do:**
- Add a new category
- Edit a category name
- Delete a category (only if no items are assigned to it)

Categories are displayed in alphabetical order (A to Z).

---

### 3.4 Items & Inventory

This is where you manage all the products and materials in your business. Every item is either a **Raw Material** (parts and components you use for manufacturing) or a **Final Product** (finished inverters you sell).

**What you see at the top of the page:**
- Total Stock Value — the total worth of all items in stock
- Total Units In Stock — how many individual units you have
- Total Items In Stock — how many different item types you have

**Item details:**
- Name, Category, Type (Raw Material or Final Product)
- Unit of measurement: Pieces (PCS) or Sets (SETS)
- Average Price — automatically calculated based on your purchases
- Total Quantity — how many you currently have in stock
- Total Amount — the value of this item in stock (Total Quantity x Average Price)

**How pricing works:**
When you purchase an item, the system automatically calculates a weighted average price. For example:
- You have 10 units of Item X at Rs. 100 each (average price = Rs. 100)
- You purchase 5 more units at Rs. 120 each
- New average price = ((10 x 100) + (5 x 120)) / 15 = Rs. 106.67

This ensures your stock value is always accurate and up to date.

**Low stock warning:** If any raw material drops below 10 units, the system will show a warning so you know to restock.

**Stock cannot go below zero.** The system will prevent any action that would make stock negative.

**Filtering:** You can filter items by type (Raw Material or Final Product), stock status (In Stock or Out of Stock), or category.

---

### 3.5 Suppliers

Suppliers are the people or companies you buy materials and products from.

**Creating a supplier:** You need to enter the supplier's Name and Phone Number (required). Email and Address are optional. You can set an Opening Balance when creating the supplier (this is the amount you already owe them or they owe you from before using this system). The opening balance can only be set during creation — it cannot be changed later.

**Supplier Profile Page:** Clicking on a supplier's name opens their full profile showing:
- Opening Balance, Total Purchase Amount, Total Paid Amount, Outstanding Amount, Current Balance
- **Purchase History** — all purchases from this supplier
- **Payment History** — all payments made to this supplier
- **Statement** — a combined timeline showing purchases and payments together, with a running balance

**How supplier balance works:**
- Current Balance = Opening Balance + Total Purchase Amount
- Outstanding Balance = Current Balance - Total Paid Amount
- If you overpay a supplier, their balance will show as negative (meaning they owe you)

---

### 3.6 Customers

Customers are the people or businesses you sell to or provide repair services for.

**Creating a customer:** Same as suppliers — Name and Phone are required, Email and Address are optional. Opening Balance is set once at creation.

**Customer Profile Page:** Clicking on a customer's name opens their full profile showing:
- Opening Balance, Total Sale Amount, Total Repair Amount, Total Payment Received, Outstanding Amount, Current Balance
- **Sale History** — all sales to this customer
- **Repair History** — all repairs done for this customer
- **Payment History** — all payments received from this customer
- **Statement** — a combined timeline of sales, repairs, and payments with a running balance

**How customer balance works:**
- Current Balance = Opening Balance + Total Sale Amount + Total Repair Amount
- Outstanding Balance = Current Balance - Total Payment Received
- If a customer overpays, their balance will show as negative (meaning you owe them)

---

### 3.7 Recipes

A Recipe defines the list of raw materials needed to manufacture a specific inverter model. Think of it as a "formula" or "bill of materials."

**What a recipe contains:**
- Recipe Name (e.g., "18KW Standard Recipe")
- Final Product — which inverter this recipe makes
- Ingredients — a list of raw materials and how many of each are needed
- Additional Expense — an extra flat amount to cover overhead costs (e.g., miscellaneous supplies)
- Total Cost — automatically calculated based on current material prices + additional expense

**Important rules:**
- Each final product (inverter model) can have only one recipe
- Creating or editing a recipe does NOT take anything out of your stock — recipes are just formulas
- Recipe costs always show the latest material prices. If the price of a component changes, the recipe cost updates automatically
- Recipes can be deleted at any time — past production records are not affected because they store their own copy of the materials used

---

### 3.8 Production

This is where you manufacture inverters. When you create a production batch, you are recording the process of turning raw materials into finished inverters.

**How to create a production batch:**

1. **Select a recipe** — the system fills in the list of materials from the recipe
2. **Enter how many inverters to produce** — if more than 1, it is a "batch"
3. **Customize if needed** — you can change the materials for individual inverters or for the whole batch. For example, if 3 out of 5 inverters need a different component, you can modify just those 3
4. **Assign serial numbers** — each inverter gets a unique serial number in the format LEH-2026-001, LEH-2026-002, etc. (The "LEH" prefix and year are automatic. The prefix can be changed in Settings.)
5. **Enter copper amount** — this is an additional cost for the production (for example, Rs. 50,000 for a batch of 10 inverters). You enter the total copper amount and select which account to deduct it from. The amount is deducted from the selected account when saved. The copper cost is equally distributed across all inverters in the batch (e.g., Rs. 5,000 per inverter), giving you the true cost per unit.
6. **Add notes** if needed
7. **Save** — the batch is saved as "Pending"

**Real-time cost display:** As you make changes, the system calculates and shows the cost in real time — both on create and edit pages. Each unit gets its own cost based on its specific materials. The summary shows average cost per unit and the total batch cost.

**Viewing a production batch:** The detail page shows:
- Batch info (recipe, final product, quantity, status, total cost, average cost per unit, copper, recipe expense)
- **Bill of Materials** — the total materials actually consumed across all units (aggregated from production data, not the recipe). Each unit's individual breakdown is shown separately below.
- **Production Units** — each unit with its serial number, individual cost, and item-by-item breakdown

**Production statuses:**
- **Pending** — saved but not yet finalized. You can still edit or delete it.
- **Completed** — finalized. Raw materials are removed from stock, and finished inverters are added to stock with their serial numbers. This cannot be undone.
- **Cancelled** — the batch was abandoned. Can be deleted.

**Before completing:** The system checks if you have enough stock of every material. If any item is insufficient, it tells you exactly which items are short and by how much.

**Snapshot protection:** When you create a production batch, the system saves a complete copy of all materials, quantities, and prices used. If you later change the recipe or material prices change, your existing production records remain exactly as they were. Changes only affect future production.

---

### 3.9 Purchase Invoices

A Purchase Invoice is created every time you buy materials or products from a supplier.

**Creating a purchase invoice:**
1. Select the supplier
2. Choose the date
3. Add items — for each item, enter the quantity and price per unit. You can add as many items as needed.
4. Apply a discount if applicable (the discount is on the total invoice)
5. Add notes if needed
6. Save

**What happens when you save:**
- The quantities of purchased items are added to your inventory
- The average price of each item is recalculated using the weighted average method
- The total invoice amount is added to the supplier's balance (increasing what you owe them)

**Invoice numbers** are generated automatically by the system (e.g., PI-0001, PI-0002, etc.).

**Editing:** You can edit a purchase invoice. The system will reverse all the original changes (stock, prices, supplier balance) and apply the new values. This ensures everything stays accurate.

**Deleting:** Purchase invoices cannot be deleted. This is to protect the integrity of your financial records.

---

### 3.10 Sale Invoices

A Sale Invoice is created every time you sell products to a customer.

**Creating a sale invoice:**
1. Select the customer
2. Choose the date
3. Add items — you can sell both raw materials and finished inverters:
   - For **raw materials**: select the item, enter quantity and selling price
   - For **inverters**: select the inverter type, then choose a specific serial number from the list of available units. Enter the selling price (this can be different from the production cost)
4. Apply a discount if applicable
5. Add notes if needed
6. Save

**What happens when you save:**
- The quantities of sold items are removed from your inventory
- The total invoice amount is added to the customer's balance (increasing what they owe you)
- For inverters: the system records the sale in the Sold Inverters list and calculates the profit (Selling Price minus Production Cost)

**Editing:** Same as purchase invoices — full reversal and reapply.
**Deleting:** Sale invoices cannot be deleted.

---

### 3.11 Repair Invoices

A Repair Invoice is created when a customer brings in a product (usually an inverter) for repair. The product does not have to be one you sold — customers can bring any product for repair.

**Two types of repairs:**

**Charged Repair (customer pays):**
- Select the customer
- Optionally select the inverter type and serial number (if it was sold by you)
- Add a description of the repair work
- Add parts used — for each part, you specify:
  - Which item from your stock
  - How many were used
  - The unit price — this auto-fills with the item's average price, but you can change it (for example, to add a markup for profit)
  - Whether the stock should actually be reduced ("Is Real"):
    - **Yes (Real):** The part is taken from your stock and the quantity is reduced
    - **No (Not Real):** The part's price is added to the invoice for billing purposes, but no stock is removed (useful when using parts not tracked in your inventory)
- Enter the labor cost
- Save

The total amount (parts + labor) is added to the customer's balance. The customer pays this amount later through Customer Payments.

**Free of Cost (FOC) Repair:**
- Same process as above, but there is no labor cost and no money is charged
- Parts can still be used (following the same "Is Real" logic for stock)
- Nothing is added to the customer's balance — it is completely free

**Editing:** Same reversal logic as other invoices.
**Deleting:** Repair invoices cannot be deleted.

---

### 3.12 Sold Inverters

This page shows a list of all inverters that have been sold, along with their profit information. You do not create records here — they appear automatically when you sell an inverter through a Sale Invoice.

**What you see for each sold inverter:**
- Serial Number
- Inverter Name/Type
- Customer who bought it
- Production Cost (what it cost to manufacture)
- Sale Cost (what it was sold for)
- Profit (Sale Cost minus Production Cost)

**Totals at the bottom:** Total Production Cost, Total Sale Cost, Total Profit

**Filtering:** By customer, by date range.

There is no return or refund process — once sold, the record is permanent.

---

### 3.13 Supplier Payments

This is where you record payments made to suppliers.

**Creating a payment:**
1. Select the supplier
2. Enter the amount
3. Select which account the money is coming from (Cash, Bank, or Mobile Wallet)
4. Choose the date
5. Add notes if needed
6. Save

**What happens when you save:**
- The payment amount is subtracted from the supplier's outstanding balance
- The same amount is subtracted from the selected account's balance
- You can pay more than what is owed — if the supplier's balance becomes negative, it means they owe you (credit)

**Editing:** Full reversal and reapply.
**Deleting:** Payments cannot be deleted.

---

### 3.14 Customer Payments

This is where you record payments received from customers.

**Creating a payment:**
1. Select the customer
2. Enter the amount
3. Select which account the money goes into
4. Choose the date
5. Add notes if needed
6. Save

**What happens when you save:**
- The payment amount is subtracted from the customer's outstanding balance
- The same amount is added to the selected account's balance
- Customers can overpay — a negative balance means you owe them (credit)

**Editing:** Full reversal and reapply.
**Deleting:** Payments cannot be deleted.

---

### 3.15 Stock Adjustments

Sometimes your actual stock does not match what the system shows — items may be damaged, miscounted, you may need to add opening stock, or you may need to return damaged goods to a supplier. Stock Adjustments let you handle all of these.

**Adding stock:**
- Select the item
- Enter the quantity to add
- Enter the price per unit (this affects the average price calculation)
- Select a reason: Opening Stock or Miscount
- Add notes if needed

**Removing stock — Return to Supplier:**
- Select the item
- Enter the quantity to return
- Select the supplier you are returning to
- The value of the returned items (quantity x average price) is deducted from what you owe that supplier
- Add notes if needed

**Removing stock — Damaged/Lost:**
- Select the item
- Enter the quantity that was damaged or lost
- This is a pure loss — the stock is reduced but no money is recovered
- Add notes if needed

When you select an item, the system shows you its current stock details so you can make an informed adjustment.

**Editing and deleting** adjustments is allowed — the system will reverse the original changes and apply the new values.

---

### 3.16 Expense Categories

Expense Categories help you organize your business expenses into groups that make sense for your business (for example: Rent, Utilities, Salaries, Transport, Office Supplies, etc.).

**What you can do:**
- Add a new category with a name and description
- Edit an existing category
- Delete a category

Categories are displayed in alphabetical order.

---

### 3.17 Expenses

This is where you record all business expenses — rent, bills, salaries, transportation, supplies, and anything else.

**Creating expenses:**
You can add multiple expenses at once from a single form. Each expense is an independent record with:
- Date
- Description (what the expense was for)
- Amount
- Category (from your Expense Categories)
- Account (which account the money comes from)
- Notes (optional)

For example, you could add three expenses in one go:
- Office Rent — Rs. 50,000 — from Bank Account
- Electricity Bill — Rs. 15,000 — from Bank Account
- Tea & Snacks — Rs. 2,000 — from Cash

Each one is saved separately and deducts from its own selected account.

**Filtering:** By category, account, date range.
**Editing and deleting** is allowed with full reversal of account changes.

---

### 3.18 User Settings

This page combines your personal profile and business settings in one place.

**Profile Information:**
- First Name, Last Name, Phone Number, Email, Address
- Change Password

**Business Settings:**
- Company Name
- Company Logo (uploaded image)
- Company Address
- Company Phone Number
- Serial Number Prefix (default: LEH — used in inverter serial numbers like LEH-2026-001)
- Fiscal Year Start (default: July for Pakistan's July–June fiscal year)

The company information and logo are used in all PDF documents (invoices, statements, reports) to give them a professional, branded appearance.

---

### 3.19 Supplier & Customer Statements

Statements are accessed from a supplier's or customer's profile page. They provide a complete financial history in one view.

**Supplier Statement** shows a timeline combining all purchase invoices and payments.

**Columns:** Date | Invoice # | Purchase Amount | Amount Paid | Outstanding Balance

**At the bottom:**
- Opening Balance
- Total Purchase Amount
- Total Paid Amount
- Total Outstanding Balance

**Customer Statement** shows a timeline combining all sales, repairs, and payments.

**Columns:** Date | Invoice # | Sale Amount | Repair Amount | Amount Received | Outstanding Balance

**At the bottom:**
- Opening Balance
- Total Sale Amount
- Total Repair Amount
- Total Received Amount
- Outstanding Balance

Both statements can be filtered by date range and downloaded as a professional PDF document with your business branding.

---

## 4. Reports & Exports

The system supports the following export features across all modules:

| Feature | Available On |
|---------|-------------|
| **CSV Export** | All tables — download data as a spreadsheet-compatible file |
| **PDF Download** | Invoices, Statements, Reports — professionally formatted with your business logo and details |

**PDF documents include:** Company logo, company name, company address, company phone number, document title, date, and all relevant data formatted in a clean, professional layout.

---

## 5. General Behavior

### Search
Every page with a table has a search box. When you type, the system searches across all columns and shows matching results instantly.

### Sorting
- Lists of names (suppliers, customers, items, categories, accounts) are sorted alphabetically A to Z
- Lists of transactions (invoices, payments, expenses) are sorted by date with the most recent first

### Pagination
Large tables are split into pages so the system loads quickly. You can navigate between pages using page controls at the bottom.

### Date Range Filtering
Available on all listing pages. Options:
- **Today** — only today's records
- **This Month** — current month
- **This Year** — current fiscal year (July to June)
- **Custom** — pick any start and end date

### Editing Records
When you click "Edit" on a simple record (like a category or account), a popup window opens with the current details pre-filled — you make your changes and save without leaving the page. For more complex records (like invoices, production batches, recipes, expenses, and payments), clicking "Edit" takes you to a dedicated editing page where you have more space to work with the details. In both cases, the system automatically reverses all the original changes (stock updates, balance changes, price calculations) and applies the new values. This ensures your data always remains accurate and consistent.

### Deleting Records
When you click "Delete" on any record, a confirmation popup appears asking "Are you sure you want to delete this?" You must confirm before the deletion proceeds. This prevents accidental deletions.

- **Invoices and payments cannot be deleted** — this protects the integrity of your financial records
- **Other records** (items, categories, accounts, stock adjustments, expenses, production batches in pending/cancelled status) can be deleted when appropriate
- All deletions are "soft" — the record is hidden from view but preserved in the database for audit purposes

---

## 6. Technical Details

These details are for the development team. You do not need to understand these, but they are included for completeness.

- **Platform:** Web application accessible from any modern browser
- **Frontend:** Built with Next.js (React-based framework)
- **Backend:** Built with NestJS (Node.js-based framework)
- **Database:** PostgreSQL — a reliable, industry-standard database
- **Currency:** All amounts in Pakistani Rupees (PKR), formatted as 1,00,000
- **Display:** Supports both Light and Dark themes
- **Language:** English
- **Device Support:** Works on desktop, tablet, and mobile (responsive layout)
- **Data Loading:** Pages refresh data when you visit them

---

## 7. Development Phases

The system will be built in phases, module by module, so each part is fully functional before moving to the next:

**Phase 1 — Foundation**
- Login system
- User settings page
- Categories
- Accounts
- All shared components (tables, filters, forms)

**Phase 2 — Core Data**
- Items & Inventory
- Suppliers
- Customers

**Phase 3 — Manufacturing**
- Recipes
- Production (batch manufacturing with serial numbers)

**Phase 4 — Transactions**
- Purchase Invoices
- Sale Invoices
- Repair Invoices
- Expense Categories
- Expenses

**Phase 5 — Payments**
- Supplier Payments
- Customer Payments

**Phase 6 — Analytics & Tracking**
- Stock Adjustments
- Sold Inverters tracking
- Dashboard (summary cards, graphs, filters)

**Phase 7 — Finishing Touches**
- PDF templates with business branding
- CSV exports across all modules
- Supplier & Customer statements with PDF download
- Light/Dark theme finalization
- Mobile and tablet responsive testing
- Final testing and quality assurance

---

## 8. Items Pending Your Input

The following items need your confirmation or input before development:

| Item | What We Need |
|------|-------------|
| **Overall Profit Formula** | Please confirm the profit calculation formula on the Dashboard |

---

## 9. Approval

By approving this document, you confirm that the features, behavior, and scope described above accurately represent your requirements for the Power Genix system.

| | |
|---|---|
| **Client Name:** | _________________________ |
| **Date:** | _________________________ |
| **Signature:** | _________________________ |

---

*This document describes the complete scope of the Power Genix Inventory, Production, Sales & Accounting Management System. Any features or changes not described in this document will be considered outside the current scope and may require additional discussion.*

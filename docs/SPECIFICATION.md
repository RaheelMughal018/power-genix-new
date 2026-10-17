# Power Genix — Software Specification Document

**Project:** Inventory, Production, Sales & Accounting Management System
**Prepared For:** Power Genix
**Date:** October 17, 2026
**Version:** 1.1 (updated to match the system as built)

---

## 1. What Is This System?

Power Genix is a web-based application designed to manage all day-to-day operations of your inverter manufacturing and sales business from one place. Instead of managing inventory, production, sales, repairs, payments, and expenses separately (in spreadsheets, notebooks, or multiple tools), this system brings everything together into a single, easy-to-use platform.

You will be able to:
- Track all your inventory (raw materials and finished inverters)
- Manage the manufacturing process from recipe to finished product
- Create and track purchase, sale, and repair invoices
- Manage supplier and customer accounts with full payment history
- Track expenses, business assets, and account balances
- See which inverters have been sold and which are still in stock
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

**What you will see — 13 summary cards:**

| Card | What it means | Follows the date filter? |
|------|---------------|--------------------------|
| **Total Purchases** | How much you have spent on purchase invoices | Yes |
| **Total Sales** | Total revenue from sale invoices | Yes |
| **Total Expenses** | How much you have spent on expenses | Yes |
| **Total Repair Revenue** | Total charged on paid repairs (free repairs not included) | Yes |
| **Total Repair Profit** | Repair revenue minus the cost of the stock parts used | Yes |
| **Production Cost** | How much you have spent on manufacturing batches | Yes |
| **Stock Value** | The value of everything currently in your inventory | No — always today's value |
| **Sold Inverters Profit** | Profit made from inverter sales | Yes |
| **Amount to Pay (Suppliers)** | How much you currently owe suppliers | No — always today's value |
| **Amount to Receive (Customers)** | How much customers currently owe you | No — always today's value |
| **Current Bank Balance** | Total balance across all your accounts | No — always today's value |
| **Total Assets** | Total value of business assets you have bought | No — always today's value |
| **Overall Profit** | Your overall business worth (see formula below) | No — always today's value |

**Overall Profit formula:**

```
Overall Profit = Current Bank Balance
               + Amount to Receive (Customers)
               + Stock Value
               + Total Assets
               − Amount to Pay (Suppliers)
```

In plain words: the money in your accounts, plus what customers owe you, plus the value of your stock and assets, minus what you owe suppliers.

**Filtering by date:** You can view the numbers for Today, This Week, This Month, This Year, or any Custom Date Range.

**Graphs:** Below the cards, the dashboard shows month-by-month graphs (line and bar charts) of Purchases, Sales, Expenses, and Production for the selected period. If no period is selected, the last 12 months are shown.

---

### 3.2 Accounts

Accounts represent where your money is stored — your cash in hand, bank accounts, or mobile wallets (like JazzCash or EasyPaisa).

**What you can do:**
- Add a new account with a name and type (Cash, Bank, or Mobile Wallet). New accounts start at zero.
- Add an opening balance later. Each time you add one, the amount is added to both the opening balance and the current balance.
- Edit an account's name and type
- Transfer money between accounts (for example, from Cash to Bank). Transfers are one-to-one, with no fees, and you can add a date and notes. Transfers cannot be edited or deleted once saved.
- See the total balance across all accounts

**Account detail page:** Clicking an account shows its total money in and money out, with separate tabs for Received (customer payments), Paid Out (supplier payments), Expenses, Assets, and Transfers.

**How balances work:**
- When you receive a payment from a customer, the selected account balance goes up
- When you pay a supplier, the selected account balance goes down
- When you record an expense, the selected account balance goes down
- When you buy a business asset, the selected account balance goes down
- When you enter a copper amount on a production batch, the selected account balance goes down
- Transfers move money from one account to another
- Account balances can go below zero (negative) — the system does not block payments from an account with a low or zero balance

**Deleting accounts:** You can only delete an account if its balance is zero and it has no payments, expenses, or transfers. Deleted accounts are kept in the system's records but hidden from view.

---

### 3.3 Categories

Categories help you organize your inventory items into groups (for example: Capacitors, Transformers, Cables, Fans, etc.).

**What you can do:**
- Add a new category (each name must be unique)
- Edit a category name
- Delete a category (only if no items are assigned to it)

Categories are displayed in alphabetical order (A to Z).

---

### 3.4 Items & Inventory

This is where you manage all the products and materials in your business. Every item is either a **Raw Material** (parts and components you use for manufacturing) or a **Final Product** (finished inverters you sell).

**What you see at the top of the page:**
- Total Stock Value — the total worth of all items in stock
- Total Units In Stock — how many individual units you have
- Total Items — how many different item types you have

**Item details:**
- Name, Category, Type (Raw Material or Final Product)
- Unit of measurement: Pieces (PCS) or Sets (SETS)
- Average Price — calculated automatically by the system
- Total Quantity — how many you currently have in stock (whole numbers only)
- Total Amount — the value of this item in stock (Total Quantity × Average Price)

You enter the name, category, type, and unit. The price and quantity are managed by the system through purchases, production, sales, repairs, and stock adjustments — you do not type them in directly.

**How pricing works:**
When stock comes in, the system calculates a weighted average price. For example:
- You have 10 units of Item X at Rs. 100 each (average price = Rs. 100)
- You purchase 5 more units at Rs. 120 each
- New average price = ((10 × 100) + (5 × 120)) / 15 = Rs. 106.67

The average price is updated when:
- You save a purchase invoice
- You add stock through a stock adjustment
- A production batch is completed (for the finished inverter)

When stock goes out (sales, repairs, production), only the quantity goes down — the average price stays the same.

**Low stock warning:** If any raw material drops below 10 units, the system will show a warning so you know to restock.

**Stock cannot go below zero.** The system will prevent any sale, repair, production, or adjustment that would make stock negative.

**Filtering:** You can filter items by type (Raw Material or Final Product), stock status (In Stock or Out of Stock), or category, and search by name. The three cards at the top update to match whatever filters and search you have applied.

**Deleting items:** You can only delete an item if it has no stock left and has never been used in a purchase, sale, repair, recipe, or production batch.

**Stock list PDF:** You can download the full stock list as a PDF.

---

### 3.5 Suppliers

Suppliers are the people or companies you buy materials and products from.

**Creating a supplier:** You need to enter the supplier's Name and Phone Number (required). Email and Address are optional. You can set an Opening Balance when creating the supplier (this is the amount you already owe them from before using this system). The opening balance can only be set during creation — it cannot be changed later.

**Supplier Profile Page:** Clicking on a supplier's name opens their full profile showing:
- Opening Balance, Total Purchase Amount, Total Paid Amount, Total Return Amount, Outstanding Amount, Current Balance
- **Purchase History** — all purchases from this supplier
- **Payment History** — all payments made to this supplier
- **Statement** — a combined timeline showing purchases, returns, and payments together, with a running balance

The history and statement tabs can be searched and filtered by date range.

**How supplier balance works:**
- Current Balance = Opening Balance + Total Purchase Amount
- Outstanding Balance = Current Balance − Total Paid Amount − Total Return Amount
- Returns are goods you send back to the supplier through Stock Adjustments (see section 3.15)
- If you overpay a supplier, their balance will show as negative (meaning they owe you)

**Deleting a supplier:** Only allowed if the supplier has no purchase invoices, payments, or stock returns.

---

### 3.6 Customers

Customers are the people or businesses you sell to or provide repair services for.

**Creating a customer:** Same as suppliers — Name and Phone are required, Email and Address are optional. Opening Balance is set once at creation and cannot be changed later.

**Customer Profile Page:** Clicking on a customer's name opens their full profile showing:
- Opening Balance, Total Sale Amount, Total Repair Amount, Total Payment Received, Outstanding Amount, Current Balance
- **Sale History** — all sales to this customer
- **Repair History** — all repairs done for this customer
- **Payment History** — all payments received from this customer
- **Statement** — a combined timeline of sales, repairs, and payments with a running balance

The history and statement tabs can be searched and filtered by date range.

**How customer balance works:**
- Current Balance = Opening Balance + Total Sale Amount + Total Repair Amount (paid repairs only)
- Outstanding Balance = Current Balance − Total Payment Received
- Free of cost (FOC) repairs are never added to the customer's balance
- If a customer overpays, their balance will show as negative (meaning you owe them)

**Deleting a customer:** Only allowed if the customer has no sale invoices, repair invoices, or payments.

---

### 3.7 Recipes

A Recipe defines the list of raw materials needed to manufacture a specific inverter model. Think of it as a "formula" or "bill of materials."

**What a recipe contains:**
- Recipe Name (e.g., "18KW Standard Recipe")
- Final Product — which inverter this recipe makes
- Ingredients — a list of raw materials and how many of each are needed
- Additional Expense — an extra flat amount per inverter to cover overhead costs (e.g., miscellaneous supplies)
- Total Cost — calculated automatically: (each ingredient's quantity × its current average price) + additional expense

**Important rules:**
- Each final product (inverter model) can have only one recipe
- Creating or editing a recipe does NOT take anything out of your stock — recipes are just formulas
- Recipe costs always show the latest material prices. If the price of a component changes, the recipe cost updates automatically
- A recipe cannot be deleted once it has been used in a production batch
- Editing a recipe does not change any production batch that was already created from it

**Recipe PDF:** Each recipe can be downloaded as a PDF showing its ingredients, average prices, additional expense, and total cost.

---

### 3.8 Production

This is where you manufacture inverters. When you create a production batch, you are recording the process of turning raw materials into finished inverters.

**How to create a production batch:**

1. **Select a recipe** — the system fills in the list of materials from the recipe
2. **Enter how many inverters to produce** — if more than 1, it is a "batch"
3. **Customize if needed** — you can add or remove materials, and change materials for the whole batch or for individual inverters. For example, if 3 out of 5 inverters need a different component, you can change just those 3
4. **Assign serial numbers** — each inverter gets a unique serial number such as LEH-2026-001. The system suggests the next available numbers, but you can edit the year and number part. The "LEH" prefix can be changed in Settings. Every serial number must be unique across the whole system.
5. **Enter copper amount** (optional) — this is an additional cost for the production (for example, Rs. 50,000 for a batch of 10 inverters). You enter the total copper amount and select which account it is paid from. The amount is deducted from that account as soon as the batch is saved. The copper cost is shared equally across all inverters in the batch (e.g., Rs. 5,000 per inverter).
6. **Add notes** if needed
7. **Save** — the batch is saved as "Pending" and given a batch number (e.g., BATCH-0001)

**How cost is calculated:**
- Cost of one inverter = its own materials (quantity × price) + its share of copper + the recipe's additional expense
- The recipe's additional expense is added in full to **each** inverter — it is not shared across the batch
- Inverters in the same batch can have different costs if their materials differ
- Batch total cost = the sum of all inverter costs

**Real-time cost display:** As you make changes, the system shows the cost in real time — on both the create and edit pages. The summary shows the average cost per inverter and the total batch cost.

**Refresh Prices:** Material prices can change after a batch is created (for example, after a new purchase or stock adjustment). A "Refresh Prices" button updates every material in the batch to its latest average price and recalculates the costs. On a pending batch's detail page, if any price is out of date, the system shows a warning and asks you to refresh prices before you can complete the batch.

**Viewing a production batch:** The detail page shows:
- Batch info (recipe, final product, quantity, status, total cost, average cost per inverter, copper, recipe expense)
- **Bill of Materials** — the total materials actually used across all inverters
- **Production Units** — each inverter with its serial number, individual cost, and item-by-item breakdown

**Production statuses:**
- **Pending** — saved but not yet finalized. You can still edit, cancel, or delete it.
- **Completed** — finalized. Raw materials are removed from stock and the finished inverters are added to stock. The finished product's average price is updated using the batch cost. This cannot be undone, edited, or deleted.
- **Cancelled** — the batch was abandoned. It can be deleted.

**Before completing:** The system checks if you have enough stock of every material. If any item is short, it tells you exactly which items are short and by how much, and the batch stays pending.

**Deleting a pending batch:** The copper amount is returned to its account, and the batch's serial numbers become free to use again.

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
- The average price of each item is recalculated using the weighted average method (using the price per unit you entered)
- The invoice total (after discount) is added to what you owe the supplier

**Invoice numbers** are generated automatically by the system (e.g., PI-0001, PI-0002, etc.).

**Editing:** You can edit a purchase invoice. The system reverses the original changes (stock, prices, supplier balance) and applies the new values.

**Deleting:** Purchase invoices cannot be deleted. This is to protect the integrity of your financial records.

**PDF:** Each invoice can be downloaded as a branded PDF.

---

### 3.10 Sale Invoices

A Sale Invoice is created every time you sell products to a customer.

**Creating a sale invoice:**
1. Select the customer
2. Choose the date
3. Add items — you can sell both raw materials and finished inverters:
   - For **raw materials**: select the item, enter quantity and selling price
   - For **inverters**: select the inverter type, then choose a specific serial number from the list of available (unsold) units. The selling price fills in with that unit's production cost, and you can change it to your actual selling price
4. Apply a discount if applicable (on the total invoice)
5. Add notes if needed
6. Save

**What happens when you save:**
- The system checks there is enough stock, then removes the sold quantities from your inventory
- The invoice total (after discount) is added to the customer's balance (what they owe you)
- For inverters: the sale is recorded in the Sold Inverters list with its profit (Selling Price − Production Cost). The invoice-level discount is not included in this per-inverter profit.

**Invoice numbers** are generated automatically (e.g., SI-0001).

**Editing:** Full reversal and reapply — including the Sold Inverters records.
**Deleting:** Sale invoices cannot be deleted.
**PDF:** Each invoice can be downloaded as a branded PDF.

---

### 3.11 Repair Invoices

A Repair Invoice is created when a customer brings in a product (usually an inverter) for repair. The product does not have to be one you sold — customers can bring any product for repair.

**Two types of repairs:**

**Charged Repair (customer pays):**
- Select the customer
- Optionally enter the serial number of the product being repaired
- Add a description of the repair work
- Add parts used — parts must be items from your inventory. For each part, you specify:
  - Which item from your stock
  - How many were used
  - The unit price — this fills in with the item's average price, but you can change it (for example, to add a markup for profit)
  - Whether the stock should actually be reduced ("Is Real"):
    - **Yes (Real):** The part is taken from your stock and the quantity is reduced
    - **No (Not Real):** The part's price is added to the invoice for billing purposes, but no stock is removed
- A "Refresh Prices" button updates every part's price to the item's latest average price
- Enter the labor cost
- Apply a discount if applicable
- Save

The total (parts + labor − discount) is added to the customer's balance. The customer pays this later through Customer Payments.

**Free of Cost (FOC) Repair:**
- Same process as above, but there is no labor cost and no discount
- Parts can still be used (following the same "Is Real" logic for stock)
- Nothing is added to the customer's balance — it is completely free
- FOC repairs still appear on the customer's statement for reference, but they do not change the balance

**Invoice numbers** are generated automatically (e.g., RI-0001).

**Editing:** Same reversal logic as other invoices.
**Deleting:** Repair invoices cannot be deleted.
**PDF:** Each invoice can be downloaded as a branded PDF.

---

### 3.12 Sold Inverters

This page shows a list of all inverters that have been sold, along with their profit information. You do not create records here — they appear automatically when you sell an inverter through a Sale Invoice.

**What you see for each sold inverter:**
- Serial Number
- Inverter Name/Type
- Customer who bought it
- Sale invoice number (click to open the invoice)
- Production Cost (what it cost to manufacture)
- Sale Cost (what it was sold for)
- Profit (Sale Cost − Production Cost)
- Sale Date

**Summary cards:** Total Production Cost, Total Sale Cost, Total Profit, Total Quantity (number of inverters sold). These follow your filters and search.

**Filtering:** By customer and by date range. Search by serial number, inverter name, customer name, or invoice number.

There is no return or refund process.

---

### 3.13 Unsold Inverters

This page shows every inverter you have manufactured that has not been sold yet — your finished-inverter stock, listed one serial number at a time. You do not create records here; the list updates automatically:
- An inverter appears here once its production batch is **completed**
- It disappears from this list when it is sold on a sale invoice

**What you see for each unsold inverter:** Serial Number, Inverter Name, Batch Number, Production Date, Production Cost.

**Summary cards:** Total Quantity and Total Production Cost. These follow your filters and search.

**Filtering:** By inverter type and by production date range. Search by serial number, batch number, or inverter name.

---

### 3.14 Supplier Payments

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

**Payment numbers** are generated automatically (e.g., SP-0001).

**Editing:** Full reversal and reapply (you can also change the account).
**Deleting:** Payments cannot be deleted.

---

### 3.15 Customer Payments

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

**Payment numbers** are generated automatically (e.g., CP-0001).

**Editing:** Full reversal and reapply (you can also change the account).
**Deleting:** Payments cannot be deleted.

---

### 3.16 Stock Adjustments

Sometimes your actual stock does not match what the system shows — items may be damaged, miscounted, you may need to add opening stock, or you may need to return goods to a supplier. Stock Adjustments let you handle all of these.

When you select an item, the system shows you its current stock details so you can make an informed adjustment.

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
- Enter the price per unit for the returned goods (required)
- The return value (quantity × the price per unit you entered) is subtracted from what you owe that supplier, and it appears on the supplier's statement as a return
- The listing shows this amount in a "Deducted From Supplier" column
- Add notes if needed

**Removing stock — Damaged/Lost:**
- Select the item
- Enter the quantity that was damaged or lost
- This is a pure loss — the stock is reduced but no money is recovered
- Add notes if needed

Removing stock does not change the item's average price. You cannot remove more than you have in stock.

**Editing and deleting** adjustments is allowed — the system will reverse the original changes and apply the new values. An added-stock adjustment cannot be deleted if that stock has already been used up.

---

### 3.17 Expense Categories

Expense Categories help you organize your business expenses into groups that make sense for your business (for example: Rent, Utilities, Salaries, Transport, Office Supplies, etc.).

**What you can do:**
- Add a new category with a name and an optional description
- Edit an existing category
- Delete a category (only if no expenses use it)

Categories are displayed in alphabetical order.

---

### 3.18 Expenses

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

**Filtering:** By category, account, date range, and search.
**Editing and deleting** is allowed with full reversal of account changes (deleting an expense returns the money to its account).

---

### 3.19 Assets

Assets are the things your business owns and uses, such as equipment, machinery, vehicles, or furniture.

**Recording an asset:**
- Name (e.g., "Soldering Station")
- Type (e.g., Equipment, Vehicle, Furniture — free text)
- Amount paid
- Purchase date
- Account the money was paid from
- Notes (optional)

**What happens when you save:**
- The amount is deducted from the selected account
- The asset is counted in the dashboard's "Total Assets" card and in Overall Profit
- The asset appears in the account's detail page under the "Assets" tab

**Editing:** Allowed — the original deduction is reversed and the new amount (and account, if changed) is applied.
**Deleting:** Allowed — the amount is returned to the account.

**Filtering:** By account, date range, and search by name or type.

---

### 3.20 User Settings

This page combines your personal profile and business settings in one place.

**Profile Information:**
- First Name, Last Name, Phone Number, Address (your login email is shown but cannot be changed here)
- Change Password — you must enter your current password. The new password must be at least 8 characters with at least one letter, one number, and one special character, and must be different from the old one.

**Business Settings:**
- Company Name
- Company Logo (image upload — JPG, PNG, GIF, SVG, or WebP, up to 5 MB)
- Company Address
- Company Phone Number
- Serial Number Prefix (default: LEH — used in inverter serial numbers like LEH-2026-001)
- Fiscal Year Start month (default: July)

The company information and logo are used in PDF documents (invoices, statements, reports) to give them a professional, branded appearance.

---

### 3.21 Supplier & Customer Statements

Statements are accessed from a supplier's or customer's profile page. They provide a complete financial history in one view.

**Supplier Statement** shows a timeline combining all purchase invoices, returns, and payments.

**Columns:** Date | Invoice # | Description | Purchase Amount | Return Amount | Amount Paid | Outstanding Balance

The Description column shows the notes entered on each purchase invoice, payment, or stock return (or "-" if there are none).

**At the bottom:**
- Opening Balance
- Total Purchase Amount
- Total Return Amount
- Total Paid Amount
- Outstanding Balance

**Customer Statement** shows a timeline combining all sales, repairs, and payments.

**Columns:** Date | Invoice # | Description | Sale Amount | Repair Amount | Amount Received | Outstanding Balance

The Description column shows the repair description for repair invoices, and the notes for sale invoices and payments (or "-" if there are none). Long descriptions wrap onto several lines, on screen and in the PDF.

Free of cost (FOC) repairs are listed with a "FOC" tag and their amount for reference, but they do not change the outstanding balance, because they are not charged to the customer.

**At the bottom:**
- Opening Balance
- Total Sale Amount
- Total Repair Amount
- Total Received Amount
- Outstanding Balance

Both statements can be filtered by date range and searched. Each row links to its invoice or payment. Statements can be downloaded as a branded PDF, which starts with an "Opening Balance" row showing the balance before the selected period. Both statements can also be exported as a CSV file (opens in Excel or Google Sheets) with the same rows, an opening balance row at the top, and a totals row at the bottom.

---

## 4. Reports & Exports

| Feature | Available On |
|---------|-------------|
| **CSV Export** | Supplier and Customer Statements, and all main listings — Accounts, Categories, Items, Suppliers, Customers, Recipes, Production, Purchase / Sale / Repair Invoices, Supplier / Customer Payments, Expenses, Expense Categories, Assets, Stock Adjustments, Sold Inverters, Unsold Inverters |
| **PDF Download** | Purchase, Sale, and Repair Invoices; Supplier and Customer Statements; Recipes; Stock list (Items) |

**PDF documents include:** Company logo, company name, company address, company phone number, document title, date, and all relevant data formatted in a clean, professional layout.

---

## 5. General Behavior

### Search
Every page with a table has a search box that filters the results as you type.

### Sorting
- Lists of names (suppliers, customers, items, categories, accounts) are sorted alphabetically A to Z
- Lists of transactions (invoices, payments, expenses) are sorted by date with the most recent first

### Pagination
Large tables are split into pages so the system loads quickly. You can navigate between pages using page controls at the bottom.

### Date Range Filtering
Available on listing pages. Options:
- **Today** — only today's records
- **This Week** — current week
- **This Month** — current month
- **This Year** — current year
- **Custom** — pick any start and end date

### Clickable Links
Supplier, customer, and account names, production batch numbers, and invoice numbers in tables are clickable and open the matching detail page.

### Editing Records
When you click "Edit" on a simple record (like a category or account), a popup window opens with the current details pre-filled — you make your changes and save without leaving the page. For more complex records (like invoices, production batches, recipes, expenses, payments, assets, and stock adjustments), clicking "Edit" takes you to a dedicated editing page. In both cases, the system automatically reverses the original changes (stock updates, balance changes, price calculations) and applies the new values.

### Deleting Records
When you click "Delete" on any record, a confirmation popup appears asking you to confirm before the deletion proceeds. This prevents accidental deletions.

- **Invoices, payments, and account transfers cannot be deleted** — this protects the integrity of your financial records
- **Other records** can be deleted only when nothing depends on them:

| Record | Cannot be deleted if… |
|--------|----------------------|
| Supplier | It has purchase invoices, payments, or stock returns |
| Customer | It has sale invoices, repair invoices, or payments |
| Account | Its balance is not zero, or it has payments, expenses, or transfers |
| Item | It still has stock, or it was used in any invoice, recipe, or production batch |
| Category | Items are assigned to it |
| Expense Category | Expenses use it |
| Recipe | Production batches use it |
| Production Batch | It is completed |

- Deleted records are hidden from view but kept in the database for audit purposes. The one exception is a deleted pending production batch: its individual inverter records are removed completely so their serial numbers can be reused.

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

## 7. Development Status

All modules described in this document have been built:

| Area | Modules |
|------|---------|
| Foundation | Login, User Settings, Categories, Accounts (with transfers) |
| Core Data | Items & Inventory, Suppliers, Customers |
| Manufacturing | Recipes, Production (with serial numbers and Refresh Prices) |
| Transactions | Purchase, Sale, and Repair Invoices; Expense Categories; Expenses |
| Payments | Supplier Payments, Customer Payments |
| Tracking & Analytics | Stock Adjustments, Sold Inverters, Unsold Inverters, Assets, Dashboard |
| Finishing | PDF templates, CSV exports, Supplier & Customer Statements, Light/Dark theme, responsive layout |

---

## 8. Changes Since Version 1.0

| Area | What changed |
|------|--------------|
| Dashboard | Now 13 cards. Added Total Repair Profit and Total Assets. Overall Profit formula confirmed. Added "This Week" filter. |
| Assets | New module for equipment, vehicles, and other business assets |
| Unsold Inverters | New page listing manufactured inverters not yet sold |
| Sold Inverters | Added Total Quantity card and invoice link; search also matches inverter name |
| Recipes | Can no longer be deleted once used in production. Added PDF download. |
| Production | Recipe additional expense is added in full to each inverter. Materials can be added or removed per batch. Added "Refresh Prices". Serial numbers are editable. |
| Repair Invoices | Parts must come from inventory. Unit price can be changed for markup. Added discount and "Refresh Prices". |
| Stock Adjustments | Return to Supplier now uses a price you enter (not the average price), and returns show on supplier statements |
| Suppliers | Outstanding balance now subtracts returns |
| Customers | FOC repairs appear on statements but do not affect the balance |
| Items | Cannot be deleted while stock remains. Added stock list PDF. |
| Accounts | Detail page with transaction history tabs; transfers cannot be edited or deleted |

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

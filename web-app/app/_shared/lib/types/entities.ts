// ─── Shared base ────────────────────────────────────────────────────────────

interface BaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

// ─── User ────────────────────────────────────────────────────────────────────

export interface UserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

// ─── Account ─────────────────────────────────────────────────────────────────

export type AccountType = 'cash' | 'bank' | 'mobile_wallet';

export interface Account extends BaseEntity {
  name: string;
  type: AccountType;
  openingBalance: number;
  currentBalance: number;
  createdBy: UserSummary;
}

export interface AccountTransfer extends BaseEntity {
  fromAccount: Account;
  toAccount: Account;
  amount: number;
  date: string;
  notes?: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category extends BaseEntity {
  name: string;
  createdBy: UserSummary;
}

// ─── Item ────────────────────────────────────────────────────────────────────

export type ItemType = 'raw_material' | 'final_product';
export type ItemUnit = 'pcs' | 'sets';

export interface Item extends BaseEntity {
  name: string;
  category: Category;
  type: ItemType;
  unit: ItemUnit;
  averagePrice: number;
  totalQuantity: number;
  totalAmount: number;
  minStock: number;
  createdBy: UserSummary;
}

// ─── Supplier ────────────────────────────────────────────────────────────────

export interface Supplier extends BaseEntity {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance: number;
  createdBy: UserSummary;
}

// ─── Customer ────────────────────────────────────────────────────────────────

export interface Customer extends BaseEntity {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  openingBalance: number;
  createdBy: UserSummary;
}

// ─── Recipe ──────────────────────────────────────────────────────────────────

export interface RecipeItem extends BaseEntity {
  item: Pick<Item, 'id' | 'name' | 'unit'>;
  quantity: number;
}

export interface Recipe extends BaseEntity {
  name: string;
  outputItem: Pick<Item, 'id' | 'name' | 'unit'>;
  outputQuantity: number;
  items: RecipeItem[];
  createdBy: UserSummary;
}

// ─── Production ──────────────────────────────────────────────────────────────

export type ProductionStatus = 'pending' | 'completed' | 'cancelled';

export interface ProductionUnitItem extends BaseEntity {
  item: Pick<Item, 'id' | 'name' | 'unit'>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ProductionUnit extends BaseEntity {
  recipe: Pick<Recipe, 'id' | 'name'>;
  quantity: number;
  status: ProductionStatus;
  items: ProductionUnitItem[];
}

export interface ProductionBatch extends BaseEntity {
  batchNumber: string;
  status: ProductionStatus;
  units: ProductionUnit[];
  createdBy: UserSummary;
}

// ─── Purchase Invoice ────────────────────────────────────────────────────────

export interface PurchaseInvoiceItem extends BaseEntity {
  item: Pick<Item, 'id' | 'name' | 'unit'>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface PurchaseInvoice extends BaseEntity {
  invoiceNumber: string;
  supplier: Pick<Supplier, 'id' | 'name'>;
  date: string;
  items: PurchaseInvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  balance: number;
  notes?: string;
  createdBy: UserSummary;
}

// ─── Sale Invoice ────────────────────────────────────────────────────────────

export type InvoiceChargeType = 'charged' | 'foc';

export interface SaleInvoiceItem extends BaseEntity {
  item: Pick<Item, 'id' | 'name' | 'unit'>;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  serialNumber: string | null;
}

export interface SaleInvoice extends BaseEntity {
  invoiceNumber: string;
  customer: Pick<Customer, 'id' | 'name'>;
  date: string;
  chargeType: InvoiceChargeType;
  items: SaleInvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  balance: number;
  notes?: string;
  createdBy: UserSummary;
}

// ─── Repair Invoice ──────────────────────────────────────────────────────────

export interface RepairInvoiceItem extends BaseEntity {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isReal: boolean;
}

export interface RepairInvoice extends BaseEntity {
  invoiceNumber: string;
  customer: Pick<Customer, 'id' | 'name'>;
  date: string;
  items: RepairInvoiceItem[];
  totalAmount: number;
  paidAmount: number;
  balance: number;
  notes?: string;
  createdBy: UserSummary;
}

// ─── Sold Inverter ───────────────────────────────────────────────────────────

export interface SoldInverter extends BaseEntity {
  serialNumber: string;
  item: Pick<Item, 'id' | 'name'>;
  saleInvoice: Pick<SaleInvoice, 'id' | 'invoiceNumber'>;
  customer: Pick<Customer, 'id' | 'name'>;
  saleDate: string;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface SupplierPayment extends BaseEntity {
  supplier: Pick<Supplier, 'id' | 'name'>;
  account: Pick<Account, 'id' | 'name'>;
  amount: number;
  date: string;
  notes?: string;
  createdBy: UserSummary;
}

export interface CustomerPayment extends BaseEntity {
  customer: Pick<Customer, 'id' | 'name'>;
  account: Pick<Account, 'id' | 'name'>;
  amount: number;
  date: string;
  notes?: string;
  createdBy: UserSummary;
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export interface ExpenseCategory extends BaseEntity {
  name: string;
  createdBy: UserSummary;
}

export interface Expense extends BaseEntity {
  category: Pick<ExpenseCategory, 'id' | 'name'>;
  account: Pick<Account, 'id' | 'name'>;
  amount: number;
  date: string;
  description?: string;
  createdBy: UserSummary;
}

// ─── Stock Adjustment ────────────────────────────────────────────────────────

export type StockAdjustmentType = 'add' | 'deduct';
export type StockAdjustmentReason =
  | 'damaged'
  | 'expired'
  | 'lost'
  | 'returned'
  | 'correction'
  | 'initial_stock'
  | 'other';

export interface StockAdjustment extends BaseEntity {
  item: Pick<Item, 'id' | 'name' | 'unit'>;
  type: StockAdjustmentType;
  quantity: number;
  reason: StockAdjustmentReason;
  notes?: string;
  createdBy: UserSummary;
}

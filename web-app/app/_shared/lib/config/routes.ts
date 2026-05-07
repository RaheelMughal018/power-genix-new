// Route constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  SETTINGS: '/dashboard/settings',
  CATEGORIES: '/dashboard/categories',
  ACCOUNTS: '/dashboard/accounts',
  ACCOUNT_DETAIL: '/dashboard/accounts',
  ITEMS: '/dashboard/items',
  SUPPLIERS: '/dashboard/suppliers',
  SUPPLIER_DETAIL: '/dashboard/suppliers',
  CUSTOMERS: '/dashboard/customers',
  CUSTOMER_DETAIL: '/dashboard/customers',
  RECIPES: '/dashboard/recipes',
  RECIPE_CREATE: '/dashboard/recipes/create',
  PRODUCTION: '/dashboard/production',
  PRODUCTION_CREATE: '/dashboard/production/create',
  PRODUCTION_DETAIL: '/dashboard/production',
  PURCHASE_INVOICES: '/dashboard/purchase-invoices',
  PURCHASE_INVOICE_CREATE: '/dashboard/purchase-invoices/create',
  SALE_INVOICES: '/dashboard/sale-invoices',
  SALE_INVOICE_CREATE: '/dashboard/sale-invoices/create',
  REPAIR_INVOICES: '/dashboard/repair-invoices',
  REPAIR_INVOICE_CREATE: '/dashboard/repair-invoices/create',
  SOLD_INVERTERS: '/dashboard/sold-inverters',
  SUPPLIER_PAYMENTS: '/dashboard/supplier-payments',
  SUPPLIER_PAYMENT_CREATE: '/dashboard/supplier-payments/create',
  CUSTOMER_PAYMENTS: '/dashboard/customer-payments',
  CUSTOMER_PAYMENT_CREATE: '/dashboard/customer-payments/create',
  STOCK_ADJUSTMENTS: '/dashboard/stock-adjustments',
  EXPENSE_CATEGORIES: '/dashboard/expense-categories',
  EXPENSES: '/dashboard/expenses',
  EXPENSE_CREATE: '/dashboard/expenses/create',
  ASSETS: '/dashboard/assets',
  ASSET_CREATE: '/dashboard/assets/create',
} as const;

// Route configuration
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
] as const;

export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.SETTINGS,
  ROUTES.CATEGORIES,
  ROUTES.ACCOUNTS,
  ROUTES.ITEMS,
  ROUTES.SUPPLIERS,
  ROUTES.CUSTOMERS,
  ROUTES.RECIPES,
  ROUTES.PRODUCTION,
  ROUTES.PURCHASE_INVOICES,
  ROUTES.SALE_INVOICES,
  ROUTES.REPAIR_INVOICES,
  ROUTES.SOLD_INVERTERS,
  ROUTES.SUPPLIER_PAYMENTS,
  ROUTES.CUSTOMER_PAYMENTS,
  ROUTES.STOCK_ADJUSTMENTS,
  ROUTES.EXPENSE_CATEGORIES,
  ROUTES.EXPENSES,
  ROUTES.ASSETS,
] as const;

export const AUTH_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
] as const;

export const DEFAULT_LOGIN_REDIRECT = '/dashboard';
export const DEFAULT_LOGOUT_REDIRECT = '/login';

// Create Sets for O(1) exact match lookups
const PUBLIC_SET = new Set(PUBLIC_ROUTES);
const PROTECTED_SET = new Set(PROTECTED_ROUTES);
const AUTH_SET = new Set(AUTH_ROUTES);

// Generic route matcher helper
const matchesRoute = (pathname: string, exactSet: Set<string>, prefixes: readonly string[]): boolean => {
  if (exactSet.has(pathname)) return true;
  return prefixes.some(route => pathname.startsWith(`${route}/`));
};

// Check if a route is public
export const isPublicRoute = (pathname: string): boolean =>
  matchesRoute(pathname, PUBLIC_SET, PUBLIC_ROUTES);

// Check if a route is protected
export const isProtectedRoute = (pathname: string): boolean =>
  matchesRoute(pathname, PROTECTED_SET, PROTECTED_ROUTES);

// Check if a route is an auth route
export const isAuthRoute = (pathname: string): boolean =>
  matchesRoute(pathname, AUTH_SET, AUTH_ROUTES);

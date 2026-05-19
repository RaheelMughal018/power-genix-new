import { apiClient } from './axios';

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (email: string, password: string, firstName: string) =>
    apiClient.post('/auth/register', { email, password, firstName }),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
  me: () => apiClient.get('/auth/me'),
};

// Categories API
export const categoriesApi = {
  getAll: (params: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/categories', params),
  getById: (id: number) => apiClient.get(`/categories/${id}`),
  create: (data: { name: string }) => apiClient.post('/categories', data),
  update: (id: number, data: { name: string }) => apiClient.patch(`/categories/${id}`, data),
  remove: (id: number) => apiClient.delete(`/categories/${id}`),
  exportCsv: () => apiClient.get('/categories/export/csv'),
};

// Accounts API
export const accountsApi = {
  getAll: (params: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/accounts', params),
  getById: (id: number) => apiClient.get(`/accounts/${id}`),
  getTotalBalance: () => apiClient.get('/accounts/total-balance'),
  create: (data: { name: string; type: string }) => apiClient.post('/accounts', data),
  update: (id: number, data: { name?: string; type?: string }) => apiClient.patch(`/accounts/${id}`, data),
  remove: (id: number) => apiClient.delete(`/accounts/${id}`),
  addOpeningBalance: (id: number, data: { amount: number }) => apiClient.post(`/accounts/${id}/opening-balance`, data),
  transfer: (data: { fromAccountId: number; toAccountId: number; amount: number; date?: string; notes?: string }) =>
    apiClient.post('/accounts/transfer', data),
  getDetail: (id: number) => apiClient.get(`/accounts/${id}/detail`),
  exportCsv: () => apiClient.get('/accounts/export/csv'),
};

// Items API
export const itemsApi = {
  getAll: (params: { page?: number; limit?: number; search?: string; type?: string; stockStatus?: string; categoryId?: number }) =>
    apiClient.get('/items', params),
  getById: (id: number) => apiClient.get(`/items/${id}`),
  getSummary: () => apiClient.get('/items/summary'),
  getLowStock: () => apiClient.get('/items/low-stock'),
  create: (data: { name: string; categoryId: number; type: string; unit: string }) =>
    apiClient.post('/items', data),
  update: (id: number, data: { name?: string; categoryId?: number; type?: string; unit?: string }) =>
    apiClient.patch(`/items/${id}`, data),
  remove: (id: number) => apiClient.delete(`/items/${id}`),
  exportCsv: () => apiClient.get('/items/export/csv'),
};

// Suppliers API
export const suppliersApi = {
  getAll: (params: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/suppliers', params),
  getById: (id: number) => apiClient.get(`/suppliers/${id}`),
  getDetail: (id: number) => apiClient.get(`/suppliers/${id}/detail`),
  create: (data: { name: string; phone: string; email?: string; address?: string; openingBalance?: number }) =>
    apiClient.post('/suppliers', data),
  update: (id: number, data: { name?: string; phone?: string; email?: string; address?: string }) =>
    apiClient.patch(`/suppliers/${id}`, data),
  remove: (id: number) => apiClient.delete(`/suppliers/${id}`),
  exportCsv: () => apiClient.get('/suppliers/export/csv'),
  getStatement: (id: number, params?: { from?: string; to?: string }) =>
    apiClient.get(`/suppliers/${id}/statement`, params),
};

// Customers API
export const customersApi = {
  getAll: (params: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/customers', params),
  getById: (id: number) => apiClient.get(`/customers/${id}`),
  getDetail: (id: number) => apiClient.get(`/customers/${id}/detail`),
  create: (data: { name: string; phone: string; email?: string; address?: string; openingBalance?: number }) =>
    apiClient.post('/customers', data),
  update: (id: number, data: { name?: string; phone?: string; email?: string; address?: string }) =>
    apiClient.patch(`/customers/${id}`, data),
  remove: (id: number) => apiClient.delete(`/customers/${id}`),
  exportCsv: () => apiClient.get('/customers/export/csv'),
  getStatement: (id: number, params?: { from?: string; to?: string }) =>
    apiClient.get(`/customers/${id}/statement`, params),
};

// Recipes API
export const recipesApi = {
  getAll: (params: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/recipes', params),
  getById: (id: number) => apiClient.get(`/recipes/${id}`),
  create: (data: { name: string; finalProductId: number; additionalExpense?: number; items: Array<{ itemId: number; quantity: number }> }) =>
    apiClient.post('/recipes', data),
  update: (id: number, data: { name?: string; finalProductId?: number; additionalExpense?: number; items?: Array<{ itemId: number; quantity: number }> }) =>
    apiClient.patch(`/recipes/${id}`, data),
  remove: (id: number) => apiClient.delete(`/recipes/${id}`),
  exportCsv: () => apiClient.get('/recipes/export/csv'),
};

// Production API
export const productionApi = {
  getAll: (params: { page?: number; limit?: number; search?: string; status?: string; fromDate?: string; toDate?: string }) =>
    apiClient.get('/production', params),
  getById: (id: number) => apiClient.get(`/production/${id}`),
  getSummary: () => apiClient.get('/production/summary'),
  generateSerials: (quantity: number) =>
    apiClient.get('/production/generate-serials', { quantity }),
  create: (data: {
    recipeId: number; quantity: number; productionDate: string; copperAmount?: number; copperAccountId?: number;
    notes?: string; units: Array<{ serialNumber: string; items: Array<{ itemId: number; quantity: number; unitPrice: number }> }>;
  }) => apiClient.post('/production', data),
  complete: (id: number) => apiClient.post(`/production/${id}/complete`),
  cancel: (id: number) => apiClient.post(`/production/${id}/cancel`),
  refreshPrices: (id: number) => apiClient.post(`/production/${id}/refresh-prices`),
  update: (id: number, data: object) => apiClient.patch(`/production/${id}`, data),
  remove: (id: number) => apiClient.delete(`/production/${id}`),
  exportCsv: () => apiClient.get('/production/export/csv'),
};

// Purchase Invoices API
export const purchaseInvoicesApi = {
  getAll: (params: { page?: number; limit?: number; search?: string; supplierId?: number; fromDate?: string; toDate?: string }) =>
    apiClient.get('/purchase-invoices', params),
  getById: (id: number) => apiClient.get(`/purchase-invoices/${id}`),
  getTotal: () => apiClient.get('/purchase-invoices/total'),
  create: (data: { supplierId: number; date: string; discount?: number; notes?: string; items: Array<{ itemId: number; quantity: number; unitPrice: number }> }) =>
    apiClient.post('/purchase-invoices', data),
  update: (id: number, data: { supplierId: number; date: string; discount?: number; notes?: string; items: Array<{ itemId: number; quantity: number; unitPrice: number }> }) =>
    apiClient.patch(`/purchase-invoices/${id}`, data),
  exportCsv: () => apiClient.get('/purchase-invoices/export/csv'),
};

// Sale Invoices API
export const saleInvoicesApi = {
  getAll: (params: { page?: number; limit?: number; search?: string; customerId?: number; fromDate?: string; toDate?: string }) =>
    apiClient.get('/sale-invoices', params),
  getById: (id: number) => apiClient.get(`/sale-invoices/${id}`),
  getTotal: () => apiClient.get('/sale-invoices/total'),
  getAvailableSerials: (itemId: number) => apiClient.get(`/sale-invoices/available-serials/${itemId}`),
  create: (data: { customerId: number; date: string; discount?: number; notes?: string; items: Array<{ itemId: number; quantity: number; unitPrice: number; serialNumber?: string }> }) =>
    apiClient.post('/sale-invoices', data),
  update: (id: number, data: { customerId: number; date: string; discount?: number; notes?: string; items: Array<{ itemId: number; quantity: number; unitPrice: number; serialNumber?: string }> }) =>
    apiClient.patch(`/sale-invoices/${id}`, data),
  exportCsv: () => apiClient.get('/sale-invoices/export/csv'),
};

// Repair Invoices API
export const repairInvoicesApi = {
  getAll: (params: { page?: number; limit?: number; search?: string; customerId?: number; fromDate?: string; toDate?: string; isCharged?: boolean }) =>
    apiClient.get('/repair-invoices', params),
  getById: (id: number) => apiClient.get(`/repair-invoices/${id}`),
  getTotal: () => apiClient.get('/repair-invoices/total'),
  create: (data: { customerId: number; serialNumber?: string; description: string; date: string; laborCost?: number; isCharged: boolean; items: Array<{ itemId?: number; quantity: number; isReal: boolean; customItemName?: string; customUnitPrice?: number }> }) =>
    apiClient.post('/repair-invoices', data),
  update: (id: number, data: { customerId: number; serialNumber?: string; description: string; date: string; laborCost?: number; isCharged: boolean; items: Array<{ itemId?: number; quantity: number; isReal: boolean; customItemName?: string; customUnitPrice?: number }> }) =>
    apiClient.patch(`/repair-invoices/${id}`, data),
  exportCsv: () => apiClient.get('/repair-invoices/export/csv'),
};

// Expense Categories API
export const expenseCategoriesApi = {
  getAll: (params: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/expense-categories', params),
  getById: (id: number) => apiClient.get(`/expense-categories/${id}`),
  create: (data: { name: string; description?: string }) => apiClient.post('/expense-categories', data),
  update: (id: number, data: { name?: string; description?: string }) => apiClient.patch(`/expense-categories/${id}`, data),
  remove: (id: number) => apiClient.delete(`/expense-categories/${id}`),
  exportCsv: () => apiClient.get('/expense-categories/export/csv'),
};

// Expenses API
export const expensesApi = {
  getAll: (params: { page?: number; limit?: number; search?: string; categoryId?: number; accountId?: number; fromDate?: string; toDate?: string }) =>
    apiClient.get('/expenses', params),
  getById: (id: number) => apiClient.get(`/expenses/${id}`),
  getTotal: () => apiClient.get('/expenses/total'),
  createBatch: (data: { expenses: Array<{ date: string; description: string; amount: number; categoryId: number; accountId: number; notes?: string }> }) =>
    apiClient.post('/expenses', data),
  update: (id: number, data: { date?: string; description?: string; amount?: number; categoryId?: number; accountId?: number; notes?: string }) =>
    apiClient.patch(`/expenses/${id}`, data),
  remove: (id: number) => apiClient.delete(`/expenses/${id}`),
  exportCsv: () => apiClient.get('/expenses/export/csv'),
};

// Supplier Payments API
export const supplierPaymentsApi = {
  getAll: (params: { page?: number; limit?: number; search?: string; supplierId?: number; accountId?: number; fromDate?: string; toDate?: string }) =>
    apiClient.get('/supplier-payments', params),
  getById: (id: number) => apiClient.get(`/supplier-payments/${id}`),
  create: (data: { supplierId: number; amount: number; accountId: number; date: string; notes?: string }) =>
    apiClient.post('/supplier-payments', data),
  update: (id: number, data: { supplierId: number; amount: number; accountId: number; date: string; notes?: string }) =>
    apiClient.patch(`/supplier-payments/${id}`, data),
  exportCsv: () => apiClient.get('/supplier-payments/export/csv'),
};

// Customer Payments API
export const customerPaymentsApi = {
  getAll: (params: { page?: number; limit?: number; search?: string; customerId?: number; accountId?: number; fromDate?: string; toDate?: string }) =>
    apiClient.get('/customer-payments', params),
  getById: (id: number) => apiClient.get(`/customer-payments/${id}`),
  create: (data: { customerId: number; amount: number; accountId: number; date: string; notes?: string }) =>
    apiClient.post('/customer-payments', data),
  update: (id: number, data: { customerId: number; amount: number; accountId: number; date: string; notes?: string }) =>
    apiClient.patch(`/customer-payments/${id}`, data),
  exportCsv: () => apiClient.get('/customer-payments/export/csv'),
};

// Stock Adjustments API
export const stockAdjustmentsApi = {
  getAll: (params: { page?: number; limit?: number; search?: string; itemId?: number }) =>
    apiClient.get('/stock-adjustments', params),
  getById: (id: number) => apiClient.get(`/stock-adjustments/${id}`),
  getItemInfo: (itemId: number) => apiClient.get(`/stock-adjustments/item/${itemId}/info`),
  getItemHistory: (itemId: number) => apiClient.get(`/stock-adjustments/item/${itemId}`),
  create: (data: { itemId: number; quantity: number; unitPrice?: number; type: string; reason: string; supplierId?: number; notes?: string; date: string }) =>
    apiClient.post('/stock-adjustments', data),
  update: (id: number, data: { itemId: number; quantity: number; unitPrice?: number; type: string; reason: string; supplierId?: number; notes?: string; date: string }) =>
    apiClient.patch(`/stock-adjustments/${id}`, data),
  remove: (id: number) => apiClient.delete(`/stock-adjustments/${id}`),
  exportCsv: () => apiClient.get('/stock-adjustments/export/csv'),
};

// Sold Inverters API
export const soldInvertersApi = {
  getAll: (params: { page?: number; limit?: number; search?: string; customerId?: number; fromDate?: string; toDate?: string }) =>
    apiClient.get('/sold-inverters', params),
  getSummary: () => apiClient.get('/sold-inverters/summary'),
  exportCsv: () => apiClient.get('/sold-inverters/export/csv'),
};

// Dashboard API
export const dashboardApi = {
  getSummary: (params?: { from?: string; to?: string }) => apiClient.get('/dashboard', params),
  getCharts: (params?: { from?: string; to?: string }) => apiClient.get('/dashboard/charts', params),
};

// Assets API
export const assetsApi = {
  getAll: (params: { page?: number; limit?: number; search?: string; accountId?: number; fromDate?: string; toDate?: string }) =>
    apiClient.get('/assets', params),
  getById: (id: number) => apiClient.get(`/assets/${id}`),
  getTotal: () => apiClient.get('/assets/total'),
  create: (data: { name: string; type: string; amount: number; purchaseDate: string; accountId: number; notes?: string }) =>
    apiClient.post('/assets', data),
  update: (id: number, data: { name?: string; type?: string; amount?: number; purchaseDate?: string; accountId?: number; notes?: string }) =>
    apiClient.patch(`/assets/${id}`, data),
  remove: (id: number) => apiClient.delete(`/assets/${id}`),
  exportCsv: () => apiClient.get('/assets/export/csv'),
};

// Settings API
export const settingsApi = {
  getSettings: () => apiClient.get('/settings'),
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  }) => apiClient.patch('/settings/profile', data),
  updateBusiness: (data: {
    companyName?: string;
    companyAddress?: string;
    companyPhone?: string;
    serialPrefix?: string;
    fiscalYearStart?: number;
  }) => apiClient.patch('/settings/business', data),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return apiClient.post('/settings/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.post('/auths/change-password', { currentPassword, newPassword }),
};

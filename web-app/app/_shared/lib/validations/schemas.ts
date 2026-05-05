import * as Yup from 'yup';

// Email validation regex
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

// Password validation - at least 8 chars, 1 uppercase, 1 lowercase, 1 number
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d\W]{8,}$/;

// Login schema
export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .matches(emailRegex, 'Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .required('Password is required'),
  rememberMe: Yup.boolean(),
});

// Registration schema
export const registerSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  email: Yup.string()
    .matches(emailRegex, 'Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .matches(passwordRegex, 'Password must contain at least 8 characters, one uppercase, one lowercase, and one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  termsAccepted: Yup.boolean()
    .oneOf([true], 'You must accept the terms and conditions'),
});

// Forgot password schema
export const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .matches(emailRegex, 'Invalid email address')
    .required('Email is required'),
});

// Reset password schema
export const resetPasswordSchema = Yup.object().shape({
  password: Yup.string()
    .matches(passwordRegex, 'Password must contain at least 8 characters, one uppercase, one lowercase, and one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
});

// Profile update schema
export const profileSchema = Yup.object().shape({
  firstName: Yup.string()
    .min(2, 'First name must be at least 2 characters')
    .max(90, 'First name must be less than 90 characters')
    .required('First name is required'),
  lastName: Yup.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(90, 'Last name must be less than 90 characters')
    .required('Last name is required'),
  phone: Yup.string().max(20).optional().default(''),
  address: Yup.string().optional().default(''),
});

// Business settings schema
export const businessSettingsSchema = Yup.object().shape({
  companyName: Yup.string().max(150).optional().default(''),
  companyAddress: Yup.string().optional().default(''),
  companyPhone: Yup.string().max(20).optional().default(''),
  serialPrefix: Yup.string().max(10).optional().default('LEH'),
  fiscalYearStart: Yup.number().min(1).max(12).optional().default(7),
});

// Change password schema
export const changePasswordSchema = Yup.object().shape({
  currentPassword: Yup.string().required('Current password is required'),
  newPassword: Yup.string()
    .matches(passwordRegex, 'Password must contain at least 8 characters, one uppercase, one lowercase, and one number')
    .notOneOf([Yup.ref('currentPassword')], 'New password must be different from current password')
    .required('New password is required'),
  confirmNewPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Confirm new password is required'),
});

// Contact form schema
export const contactSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .required('Name is required'),
  email: Yup.string()
    .matches(emailRegex, 'Invalid email address')
    .required('Email is required'),
  subject: Yup.string()
    .min(5, 'Subject must be at least 5 characters')
    .required('Subject is required'),
  message: Yup.string()
    .min(10, 'Message must be at least 10 characters')
    .max(1000, 'Message must be less than 1000 characters')
    .required('Message is required'),
});

// Category schema
export const categorySchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .required('Name is required'),
});
export type CategoryFormValues = Yup.InferType<typeof categorySchema>;

// Account schemas
export const accountSchema = Yup.object().shape({
  name: Yup.string().min(2).max(100).required('Name is required'),
  type: Yup.string().oneOf(['cash', 'bank', 'mobile_wallet']).required('Type is required'),
});
export type AccountFormValues = Yup.InferType<typeof accountSchema>;

export const openingBalanceSchema = Yup.object().shape({
  amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
});
export type OpeningBalanceFormValues = Yup.InferType<typeof openingBalanceSchema>;

export const transferSchema = Yup.object().shape({
  fromAccountId: Yup.number().required('Source account is required'),
  toAccountId: Yup.number().required('Destination account is required'),
  amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
  notes: Yup.string().optional().default(''),
});
export type TransferFormValues = Yup.InferType<typeof transferSchema>;

// Item schema
export const itemSchema = Yup.object().shape({
  name: Yup.string().min(2).max(150).required('Name is required'),
  categoryId: Yup.number().positive().required('Category is required'),
  type: Yup.string().oneOf(['raw_material', 'final_product']).required('Type is required'),
  unit: Yup.string().oneOf(['pcs', 'sets']).required('Unit is required'),
});
export type ItemFormValues = Yup.InferType<typeof itemSchema>;

// Supplier schema
export const supplierSchema = Yup.object().shape({
  name: Yup.string().min(2).max(150).required('Name is required'),
  phone: Yup.string().max(20).required('Phone is required'),
  email: Yup.string().email('Invalid email').optional().default(''),
  address: Yup.string().optional().default(''),
  openingBalance: Yup.number().min(0).optional().default(0),
});
export type SupplierFormValues = Yup.InferType<typeof supplierSchema>;

// Customer schema
export const customerSchema = Yup.object().shape({
  name: Yup.string().min(2).max(150).required('Name is required'),
  phone: Yup.string().max(20).required('Phone is required'),
  email: Yup.string().email('Invalid email').optional().default(''),
  address: Yup.string().optional().default(''),
  openingBalance: Yup.number().min(0).optional().default(0),
});
export type CustomerFormValues = Yup.InferType<typeof customerSchema>;

// Recipe schema
export const recipeSchema = Yup.object().shape({
  name: Yup.string().min(2).max(150).required('Name is required'),
  finalProductId: Yup.number().positive().required('Final product is required'),
  additionalExpense: Yup.number().min(0).optional().default(0),
  items: Yup.array().of(
    Yup.object().shape({
      itemId: Yup.number().positive().required('Item is required'),
      quantity: Yup.number().min(1).required('Quantity is required'),
    })
  ).min(1, 'At least one ingredient is required').required(),
});
export type RecipeFormValues = Yup.InferType<typeof recipeSchema>;

// Expense Category schema
export const expenseCategorySchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .required('Name is required'),
  description: Yup.string().optional().default(''),
});
export type ExpenseCategoryFormValues = Yup.InferType<typeof expenseCategorySchema>;

// Expense update schema (single expense edit)
export const expenseUpdateSchema = Yup.object().shape({
  date: Yup.string().required('Date is required'),
  description: Yup.string().min(1).max(255).required('Description is required'),
  amount: Yup.number().positive('Amount must be positive').required('Amount is required'),
  categoryId: Yup.number().positive().required('Category is required'),
  accountId: Yup.number().positive().required('Account is required'),
  notes: Yup.string().optional().default(''),
});
export type ExpenseUpdateFormValues = Yup.InferType<typeof expenseUpdateSchema>;

// Types
export type LoginFormValues = Yup.InferType<typeof loginSchema>;
export type RegisterFormValues = Yup.InferType<typeof registerSchema>;
export type ForgotPasswordFormValues = Yup.InferType<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = Yup.InferType<typeof resetPasswordSchema>;
export type ProfileFormValues = Yup.InferType<typeof profileSchema>;
export type BusinessSettingsFormValues = Yup.InferType<typeof businessSettingsSchema>;
export type ChangePasswordFormValues = Yup.InferType<typeof changePasswordSchema>;
export type ContactFormValues = Yup.InferType<typeof contactSchema>;

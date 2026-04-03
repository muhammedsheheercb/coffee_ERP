export type PaymentType = "cash" | "credit" | "debit";
export type UserRole = "admin" | "staff";

// ─── User ───────────────────────────────────────────
export interface IUser {
  _id: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
}

// ─── Item ───────────────────────────────────────────
export interface IItem {
  _id: string;
  itemNumber: string;
  name: string;
  price: number;
  quantity: number;
  supplierRef?: string;
  supplierName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IItemForm {
  itemNumber: string;
  name: string;
  price: number;
  quantity: number;
  supplierRef?: string;
  supplierName?: string;
}

// ─── Customer ───────────────────────────────────────
export interface ICustomer {
  _id: string;
  customerNumber: string;
  name: string;
  mobile: string;
  creditBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerForm {
  customerNumber: string;
  name: string;
  mobile: string;
  creditBalance?: number;
}

// ─── Supplier ───────────────────────────────────────
export interface ISupplier {
  _id: string;
  supplierNumber: string;
  name: string;
  itemsProvided: string[];
  creditBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupplierForm {
  supplierNumber: string;
  name: string;
  itemsProvided?: string[];
  creditBalance?: number;
}

// ─── Sale ───────────────────────────────────────────
export interface ISaleItem {
  itemId: string;
  itemNumber: string;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ISale {
  _id: string;
  saleNumber: string;
  customerId: string;
  customerName: string;
  customerNumber: string;
  items: ISaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentType: PaymentType;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISaleForm {
  customerId: string;
  customerName: string;
  customerNumber: string;
  items: ISaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentType: PaymentType;
  date: string;
}

// ─── Purchase ───────────────────────────────────────
export interface IPurchaseItem {
  itemId: string;
  itemNumber: string;
  itemName: string;
  quantity: number;
  price: number;
  total: number;
}

export interface IPurchase {
  _id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  supplierNumber: string;
  items: IPurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentType: PaymentType;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPurchaseForm {
  supplierId: string;
  supplierName: string;
  supplierNumber: string;
  items: IPurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  paymentType: PaymentType;
  date: string;
}

// ─── Expense ────────────────────────────────────────
export interface IExpense {
  _id: string;
  expenseNumber: string;
  title: string;
  category: string;
  amount: number;
  date: Date;
  reference?: string;
  description?: string;
  paymentType: PaymentType;
  createdAt: Date;
  updatedAt: Date;
}

export interface IExpenseForm {
  title: string;
  category: string;
  amount: number;
  date: string;
  reference?: string;
  description?: string;
  paymentType: PaymentType;
}

export interface IExpenseFilter extends ITableFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
}

// ─── Dashboard ──────────────────────────────────────
export interface IKpiData {
  totalSales: number;
  totalPurchases: number;
  totalExpenses: number;
  totalRevenue: number;
  totalCustomers: number;
  totalItems: number;
  totalSuppliers: number;
}

export interface IChartData {
  month: string;
  sales: number;
  purchases: number;
  expenses: number;
  revenue: number;
}

// ─── API Response ───────────────────────────────────
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Table / Filter ─────────────────────────────────
export interface ITableFilter {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ISaleFilter extends ITableFilter {
  startDate?: string;
  endDate?: string;
  month?: number;
  year?: number;
  paymentType?: PaymentType;
}

// ─── Select Option (react-select) ───────────────────
export interface ISelectOption {
  value: string;
  label: string;
  data?: IItem | ICustomer | ISupplier;
}
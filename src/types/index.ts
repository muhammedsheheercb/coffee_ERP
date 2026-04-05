export type PaymentType = "cash" | "bank" | "credit";
export type UserRole = "admin" | "staff";

export interface IActionPermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve?: boolean;
  export?: boolean;
}

export interface IUserPermissions {
  [key: string]: IActionPermission;
}

// ─── User ───────────────────────────────────────────
export interface IUser {
  _id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  permissions?: IUserPermissions;
  isActive: boolean;
  createdAt: Date;
}

// ─── Item ───────────────────────────────────────────
export interface IBatch {
  purchaseId?: string;
  purchaseNumber?: string;
  batchNumber?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  createdAt: Date;
}

export interface IItem {
  _id: string;
  itemNumber: string;
  name: string;
  salesAmount: number; // Selling Price (Sales Amount)
  purchaseAmount: number; // Purchase Price (Purchase Amount)
  quantity: number;
  stockValue: number; // Calculated field (Qty * Purchase Price)
  manufacturingDate?: string;
  expiryDate?: string;
  supplierRef?: string;
  supplierName?: string;
  batches?: IBatch[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IItemForm {
  itemNumber?: string;
  name: string;
  salesAmount?: number;
  purchaseAmount?: number;
  quantity?: number;
  supplierRef?: string;
  supplierName?: string;
}

// ─── Customer ───────────────────────────────────────
export interface IBalanceHistory {
  date: string;
  amount: number;
  type: "payment" | "adjustment";
  paymentMethod?: "cash" | "bank" | "credit";
  note?: string;
}

export interface ICustomer {
  _id: string;
  customerNumber: string;
  name: string;
  mobile: string;
  openingBalance: number;
  creditBalance: number;
  balanceHistory?: IBalanceHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ICustomerForm {
  customerNumber: string;
  name: string;
  mobile: string;
  openingBalance?: number;
  creditBalance?: number;
}

// ─── Supplier ───────────────────────────────────────
export interface ISupplier {
  _id: string;
  supplierNumber: string;
  name: string;
  itemsProvided: string[];
  openingBalance: number;
  creditBalance: number;
  balanceHistory?: IBalanceHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupplierForm {
  supplierNumber: string;
  name: string;
  itemsProvided?: string[];
  openingBalance?: number;
}

// ─── Sale ───────────────────────────────────────────
export interface ISaleItem {
  itemId: string;
  itemNumber: string;
  itemName: string;
  quantity: number;
  price: number;
  discount: number;
  isFOC?: boolean;
  manufacturingDate: string;
  expiryDate: string;
  batch?: string;
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
  price: number; // Purchase Unit Price
  sellingPrice: number; // New Selling Price
  manufacturingDate: string;
  expiryDate: string;
  batch?: string;
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
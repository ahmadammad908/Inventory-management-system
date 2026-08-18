export type ProductCategory = 
  | 'Groceries'
  | 'Spices & Masalay'
  | 'Dairy & Beverages'
  | 'Personal Care'
  | 'Household & Cleaning'
  | 'Snacks & Confectionery'
  | 'Flour, Rice & Pulses'
  | 'Tea & Coffee'
  | 'Oil & Ghee'
  | 'Bakery & Bread'
  | 'General';

export type ProductUnit = 'pcs' | 'kg' | 'g' | 'pack' | 'box' | 'liter' | 'dozen' | 'bottle';

export interface Product {
  id: string;
  name: string;
  sku: string; // Barcode or internal SKU
  category: ProductCategory | string;
  costPrice: number; // PKR
  sellingPrice: number; // PKR
  stock: number;
  minStockAlert: number;
  unit: ProductUnit;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // discount amount in PKR per unit or flat
  discountType: 'fixed' | 'percent';
  finalUnitPrice: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'card' | 'jazzcash_easypaisa' | 'udhaar';

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  costPrice: number;
  unitPrice: number;
  quantity: number;
  unit: ProductUnit;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNo: string;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxRate: number; // percentage, e.g. 0 or 5
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  changeReturned: number;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  paymentReference?: string; // JazzCash / EasyPaisa TID or Card authorization
  cashierName?: string;
  status: 'completed' | 'refunded' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export type LedgerEntryType = 'debit_sale' | 'credit_payment' | 'opening_balance' | 'adjustment';

export interface LedgerEntry {
  id: string;
  customerId: string;
  type: LedgerEntryType;
  amount: number; // PKR
  balanceAfter: number;
  invoiceId?: string;
  invoiceNo?: string;
  paymentMethod?: PaymentMethod | 'bank_transfer' | 'cheque';
  referenceNo?: string;
  notes?: string;
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  cnic?: string;
  creditLimit: number; // Max allowed Udhaar balance
  currentBalance: number; // Positive means customer owes money
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  address: string;
  city: string;
  ntnNumber: string;
  strnNumber: string;
  receiptFooter: string;
  receiptHeaderNotice?: string;
  defaultTaxRate: number; // %
  enableTax: boolean;
  currencySymbol: string;
  defaultLowStockThreshold: number;
  receiptPaperSize: '80mm' | '58mm';
  cashierName: string;
}

export interface ParkedCart {
  id: string;
  title: string;
  items: CartItem[];
  customerId?: string;
  discount: number;
  notes?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalInventoryValuation: number; // Selling value
  totalInventoryCost: number; // Cost value
  potentialProfit: number;
  todaySalesCount: number;
  todayRevenue: number;
  todayProfit: number;
  totalLowStockCount: number;
  totalOutOfStockCount: number;
  totalCustomers: number;
  totalUdhaarReceivables: number;
}

import { Product, Sale, Customer, LedgerEntry, StoreSettings, ParkedCart, Category } from "@/types";
import { 
  SAMPLE_PRODUCTS, 
  SAMPLE_CUSTOMERS, 
  SAMPLE_SALES, 
  SAMPLE_LEDGER_ENTRIES, 
  SAMPLE_STORE_SETTINGS, 
  SAMPLE_CATEGORIES 
} from "./sample-data";

export const STORAGE_KEYS = {
  PRODUCTS: "inventory_pos_products",
  SALES: "inventory_pos_sales",
  CUSTOMERS: "inventory_pos_customers",
  LEDGER: "inventory_pos_ledger",
  SETTINGS: "inventory_pos_settings",
  CATEGORIES: "inventory_pos_categories",
  PARKED_CARTS: "inventory_pos_parked_carts",
  INITIALIZED: "inventory_pos_initialized",
} as const;

export const STORAGE_EVENT_NAME = "inventory_storage_changed";

/**
 * Dispatch custom storage event for in-tab reactivity
 */
export function notifyStorageChange(key: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(STORAGE_EVENT_NAME, { detail: { key } }));
  }
}

/**
 * Safe local storage reader
 */
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Safe local storage writer
 */
function setToStorage<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyStorageChange(key);
    return true;
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    return false;
  }
}

// --- Product APIs ---
export function getStoredProducts(): Product[] {
  return getFromStorage<Product[]>(STORAGE_KEYS.PRODUCTS, []);
}

export function saveStoredProducts(products: Product[]): boolean {
  return setToStorage(STORAGE_KEYS.PRODUCTS, products);
}

// --- Sales APIs ---
export function getStoredSales(): Sale[] {
  return getFromStorage<Sale[]>(STORAGE_KEYS.SALES, []);
}

export function saveStoredSales(sales: Sale[]): boolean {
  return setToStorage(STORAGE_KEYS.SALES, sales);
}

// --- Customers APIs ---
export function getStoredCustomers(): Customer[] {
  return getFromStorage<Customer[]>(STORAGE_KEYS.CUSTOMERS, []);
}

export function saveStoredCustomers(customers: Customer[]): boolean {
  return setToStorage(STORAGE_KEYS.CUSTOMERS, customers);
}

// --- Ledger APIs ---
export function getStoredLedger(): LedgerEntry[] {
  return getFromStorage<LedgerEntry[]>(STORAGE_KEYS.LEDGER, []);
}

export function saveStoredLedger(ledger: LedgerEntry[]): boolean {
  return setToStorage(STORAGE_KEYS.LEDGER, ledger);
}

// --- Store Settings APIs ---
export function getStoredSettings(): StoreSettings {
  return getFromStorage<StoreSettings>(STORAGE_KEYS.SETTINGS, SAMPLE_STORE_SETTINGS);
}

export function saveStoredSettings(settings: StoreSettings): boolean {
  return setToStorage(STORAGE_KEYS.SETTINGS, settings);
}

// --- Categories APIs ---
export function getStoredCategories(): Category[] {
  return getFromStorage<Category[]>(STORAGE_KEYS.CATEGORIES, SAMPLE_CATEGORIES);
}

export function saveStoredCategories(categories: Category[]): boolean {
  return setToStorage(STORAGE_KEYS.CATEGORIES, categories);
}

// --- Parked Carts APIs ---
export function getStoredParkedCarts(): ParkedCart[] {
  return getFromStorage<ParkedCart[]>(STORAGE_KEYS.PARKED_CARTS, []);
}

export function saveStoredParkedCarts(carts: ParkedCart[]): boolean {
  return setToStorage(STORAGE_KEYS.PARKED_CARTS, carts);
}

/**
 * Seed initial sample dataset into localStorage
 */
export function seedSampleData(force: boolean = false): boolean {
  if (typeof window === "undefined") return false;

  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (isInitialized && !force) {
    return false;
  }

  saveStoredProducts(SAMPLE_PRODUCTS);
  saveStoredCustomers(SAMPLE_CUSTOMERS);
  saveStoredSales(SAMPLE_SALES);
  saveStoredLedger(SAMPLE_LEDGER_ENTRIES);
  saveStoredSettings(SAMPLE_STORE_SETTINGS);
  saveStoredCategories(SAMPLE_CATEGORIES);
  saveStoredParkedCarts([]);
  
  localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
  notifyStorageChange("all");
  return true;
}

/**
 * Reset all storage to clean empty state (or reseed)
 */
export function resetAllData(): void {
  if (typeof window === "undefined") return;
  
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  localStorage.removeItem(STORAGE_KEYS.SALES);
  localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
  localStorage.removeItem(STORAGE_KEYS.LEDGER);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.PARKED_CARTS);
  localStorage.removeItem(STORAGE_KEYS.INITIALIZED);
  
  // Reseed default empty baseline
  seedSampleData(true);
  notifyStorageChange("all");
}

export interface BackupData {
  version: string;
  exportDate: string;
  storeName: string;
  products: Product[];
  sales: Sale[];
  customers: Customer[];
  ledger: LedgerEntry[];
  settings: StoreSettings;
  categories: Category[];
}

/**
 * Export full database to JSON string
 */
export function exportBackupJSON(): string {
  const data: BackupData = {
    version: "1.0.0",
    exportDate: new Date().toISOString(),
    storeName: getStoredSettings().storeName,
    products: getStoredProducts(),
    sales: getStoredSales(),
    customers: getStoredCustomers(),
    ledger: getStoredLedger(),
    settings: getStoredSettings(),
    categories: getStoredCategories(),
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Trigger browser file download of backup JSON
 */
export function downloadBackupFile(): void {
  if (typeof window === "undefined") return;
  
  const jsonString = exportBackupJSON();
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().split("T")[0];
  const link = document.createElement("a");
  link.href = url;
  link.download = `inventory_pos_backup_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validate and restore database from JSON string
 */
export function importBackupJSON(jsonString: string): { success: boolean; message: string; count?: { products: number; sales: number; customers: number } } {
  try {
    const data = JSON.parse(jsonString) as Partial<BackupData>;
    
    if (!data.products || !Array.isArray(data.products)) {
      return { success: false, message: "Invalid backup file: 'products' list is missing." };
    }

    // Save each module safely
    if (Array.isArray(data.products)) saveStoredProducts(data.products);
    if (Array.isArray(data.sales)) saveStoredSales(data.sales);
    if (Array.isArray(data.customers)) saveStoredCustomers(data.customers);
    if (Array.isArray(data.ledger)) saveStoredLedger(data.ledger);
    if (data.settings && typeof data.settings === "object") saveStoredSettings(data.settings);
    if (Array.isArray(data.categories)) saveStoredCategories(data.categories);

    localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
    notifyStorageChange("all");

    return {
      success: true,
      message: "Data restored successfully from backup!",
      count: {
        products: data.products?.length || 0,
        sales: data.sales?.length || 0,
        customers: data.customers?.length || 0,
      }
    };
  } catch (err) {
    console.error("Backup import error:", err);
    return {
      success: false,
      message: `Failed to parse backup JSON: ${err instanceof Error ? err.message : "Unknown error"}`,
    };
  }
}

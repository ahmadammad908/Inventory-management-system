import { Product, Sale, Customer, LedgerEntry, StoreSettings, Category, ParkedCart } from "@/types";

const BASE = "/api";

async function handleRes(res: Response) {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ---------- Products ----------
export async function getStoredProducts(): Promise<Product[]> {
  const res = await fetch(`${BASE}/products`);
  return handleRes(res);
}

export async function createProduct(data: Partial<Product>): Promise<Product> {
  const res = await fetch(`${BASE}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleRes(res);
}

export async function updateStoredProduct(id: string, updates: Partial<Product>): Promise<Product> {
  const res = await fetch(`${BASE}/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return handleRes(res);
}

export async function deleteStoredProduct(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/products/${id}`, { method: "DELETE" });
  return handleRes(res);
}

export async function adjustStoredStock(id: string, delta: number): Promise<Product> {
  const res = await fetch(`${BASE}/products/${id}/stock`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ delta }),
  });
  return handleRes(res);
}

// ---------- Categories ----------
export async function getStoredCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE}/categories`);
  return handleRes(res);
}

export async function createCategory(data: Partial<Category>): Promise<Category> {
  const res = await fetch(`${BASE}/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleRes(res);
}

// ---------- Customers ----------
export async function getStoredCustomers(): Promise<Customer[]> {
  const res = await fetch(`${BASE}/customers`);
  return handleRes(res);
}

export async function createCustomer(data: Partial<Customer>): Promise<Customer> {
  const res = await fetch(`${BASE}/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleRes(res);
}

export async function updateStoredCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
  const res = await fetch(`${BASE}/customers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return handleRes(res);
}

export async function deleteStoredCustomer(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/customers/${id}`, { method: "DELETE" });
  return handleRes(res);
}

export async function recordStoredCustomerPayment(
  id: string,
  amount: number,
  paymentMethod: string,
  referenceNo?: string,
  notes?: string
) {
  const res = await fetch(`${BASE}/customers/${id}/payment`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ amount, paymentMethod, referenceNo, notes }),
  });
  return handleRes(res);
}

// ---------- Sales ----------
export async function getStoredSales(): Promise<Sale[]> {
  const res = await fetch(`${BASE}/sales`);
  return handleRes(res);
}

export async function createSale(data: any): Promise<Sale> {
  const res = await fetch(`${BASE}/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleRes(res);
}

export async function voidStoredSale(id: string): Promise<Sale> {
  const res = await fetch(`${BASE}/sales/${id}/void`, { method: "POST" });
  return handleRes(res);
}

// ---------- Ledger ----------
export async function getStoredLedger(): Promise<LedgerEntry[]> {
  const res = await fetch(`${BASE}/ledger`);
  return handleRes(res);
}

// ---------- Parked Carts ----------
export async function getStoredParkedCarts(): Promise<ParkedCart[]> {
  const res = await fetch(`${BASE}/parked-carts`);
  return handleRes(res);
}

export async function createParkedCart(data: Partial<ParkedCart>): Promise<ParkedCart> {
  const res = await fetch(`${BASE}/parked-carts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return handleRes(res);
}

export async function deleteStoredParkedCart(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${BASE}/parked-carts/${id}`, { method: "DELETE" });
  return handleRes(res);
}

// ---------- Settings ----------
export async function getStoredSettings(): Promise<StoreSettings> {
  const res = await fetch(`${BASE}/settings`);
  return handleRes(res);
}

export async function saveStoredSettings(updates: Partial<StoreSettings>): Promise<StoreSettings> {
  const res = await fetch(`${BASE}/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  return handleRes(res);
}

// ---------- Seed / Reset / Backup ----------
export async function seedStoredData(sample: boolean = true): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${BASE}/seed`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sample }),
  });
  return handleRes(res);
}

export async function resetStoredData(): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${BASE}/reset`, { method: "POST" });
  return handleRes(res);
}

export async function fetchBackupData(): Promise<Record<string, any>> {
  const res = await fetch(`${BASE}/backup`);
  return handleRes(res);
}

export async function restoreBackupData(payload: Record<string, any>): Promise<{ success: boolean; message?: string }> {
  const res = await fetch(`${BASE}/backup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleRes(res);
}

export async function downloadBackupFile(): Promise<void> {
  const data = await fetchBackupData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  a.href = url;
  a.download = `pos-backup-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
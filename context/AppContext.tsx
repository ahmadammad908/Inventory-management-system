"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { 
  Product, 
  Sale, 
  Customer, 
  LedgerEntry, 
  StoreSettings, 
  CartItem, 
  ParkedCart, 
  Category, 
  DashboardStats,
  PaymentMethod 
} from "@/types";
import { 
  getStoredProducts, 
  createProduct as apiCreateProduct,
  updateStoredProduct,
  deleteStoredProduct,
  adjustStoredStock,
  getStoredCategories,
  getStoredCustomers,
  createCustomer as apiCreateCustomer,
  updateStoredCustomer,
  deleteStoredCustomer,
  recordStoredCustomerPayment,
  getStoredSales,
  createSale as apiCreateSale,
  voidStoredSale,
  getStoredLedger,
  getStoredSettings,
  saveStoredSettings,
  getStoredParkedCarts,
  createParkedCart as apiCreateParkedCart,
  deleteStoredParkedCart,
} from "@/lib/storage/storage-manager";
import { calculateCartTotals } from "@/lib/utils";

interface AppContextType {
  // Data
  products: Product[];
  categories: Category[];
  customers: Customer[];
  sales: Sale[];
  ledger: LedgerEntry[];
  settings: StoreSettings;
  parkedCarts: ParkedCart[];
  isLoaded: boolean;
  stats: DashboardStats;

  // Active POS Cart
  cart: CartItem[];
  cartCustomer: Customer | null;
  cartDiscount: number;
  cartDiscountType: 'fixed' | 'percent';
  cartTotals: ReturnType<typeof calculateCartTotals>;
  addToCart: (product: Product, quantity?: number) => boolean;
  updateCartItemQuantity: (productId: string, quantity: number) => void;
  updateCartItemDiscount: (productId: string, discount: number, discountType?: 'fixed' | 'percent') => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  setCartCustomer: (customer: Customer | null) => void;
  setCartDiscount: (discount: number, type?: 'fixed' | 'percent') => void;
  parkCurrentCart: (title?: string) => Promise<boolean>;
  resumeParkedCart: (cartId: string) => Promise<void>;
  deleteParkedCart: (cartId: string) => Promise<void>;
  completeSale: (paymentData: {
    paymentMethod: PaymentMethod;
    amountPaid: number;
    changeReturned: number;
    notes?: string;
    reference?: string;
    customer?: Customer | null;
  }) => Promise<Sale>;

  // Inventory Actions
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  adjustStock: (id: string, delta: number, reason?: string) => Promise<boolean>;

  // Customer / Khata Actions
  addCustomer: (customerData: Omit<Customer, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<boolean>;
  deleteCustomer: (id: string) => Promise<boolean>;
  recordCustomerPayment: (
    customerId: string, 
    amount: number, 
    paymentMethod: PaymentMethod | 'bank_transfer' | 'cheque', 
    referenceNo?: string, 
    notes?: string
  ) => Promise<boolean>;

  // Settings & System
  updateSettings: (updates: Partial<StoreSettings>) => Promise<boolean>;
  refreshAllData: () => Promise<void>;
  voidSale: (saleId: string) => Promise<boolean>;
}

const AppContext = createContext<AppContextType | null>(null);

const defaultSettings: StoreSettings = {
  storeName: "My Store",
  defaultTaxRate: 0,
  enableTax: false,
  cashierName: "Admin",
  currencySymbol: "Rs.",
} as StoreSettings;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Active POS Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartCustomer, setCartCustomerState] = useState<Customer | null>(null);
  const [cartDiscount, setCartDiscountState] = useState<number>(0);
  const [cartDiscountType, setCartDiscountType] = useState<'fixed' | 'percent'>('fixed');

  // Load all initial data from MongoDB via API
  const loadAllData = useCallback(async () => {
    try {
      const [
        productsData,
        categoriesData,
        customersData,
        salesData,
        ledgerData,
        settingsData,
        parkedCartsData,
      ] = await Promise.all([
        getStoredProducts(),
        getStoredCategories(),
        getStoredCustomers(),
        getStoredSales(),
        getStoredLedger(),
        getStoredSettings(),
        getStoredParkedCarts(),
      ]);

      setProducts(productsData);
      setCategories(categoriesData);
      setCustomers(customersData);
      setSales(salesData);
      setLedger(ledgerData);
      setSettings(settingsData);
      setParkedCarts(parkedCartsData);
    } catch (err) {
      console.error("Failed to load data from server:", err);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Calculate cart totals dynamically
  const cartTotals = useMemo(() => {
    const flatDiscount = cartDiscountType === 'percent'
      ? Math.round((cart.reduce((sum, item) => sum + item.total, 0) * cartDiscount) / 100)
      : cartDiscount;

    return calculateCartTotals(
      cart,
      flatDiscount,
      settings.defaultTaxRate,
      settings.enableTax
    );
  }, [cart, cartDiscount, cartDiscountType, settings.defaultTaxRate, settings.enableTax]);

  // Compute dashboard metrics
  const stats: DashboardStats = useMemo(() => {
    const now = new Date();
    const todayDateStr = now.toISOString().split("T")[0];

    const todaySales = sales.filter(s => s.status === 'completed' && s.createdAt.startsWith(todayDateStr));

    const totalInventoryValuation = products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
    const totalInventoryCost = products.reduce((sum, p) => sum + (p.costPrice * p.stock), 0);
    const potentialProfit = Math.max(0, totalInventoryValuation - totalInventoryCost);

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);

    const todayCost = todaySales.reduce((sum, s) => {
      const saleCost = s.items.reduce((itemSum, item) => itemSum + (item.costPrice * item.quantity), 0);
      return sum + saleCost;
    }, 0);
    const todayProfit = Math.max(0, todayRevenue - todayCost);

    const totalLowStockCount = products.filter(p => p.stock > 0 && p.stock <= p.minStockAlert).length;
    const totalOutOfStockCount = products.filter(p => p.stock <= 0).length;

    const totalUdhaarReceivables = customers.reduce((sum, c) => sum + (c.currentBalance > 0 ? c.currentBalance : 0), 0);

    return {
      totalInventoryValuation,
      totalInventoryCost,
      potentialProfit,
      todaySalesCount: todaySales.length,
      todayRevenue,
      todayProfit,
      totalLowStockCount,
      totalOutOfStockCount,
      totalCustomers: customers.length,
      totalUdhaarReceivables,
    };
  }, [products, sales, customers]);

  // --- Cart Actions (client-side only, no DB until checkout) ---
  const addToCart = useCallback((product: Product, quantity: number = 1): boolean => {
    if (product.stock <= 0) {
      return false;
    }

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const item = prevCart[existingIndex];
        const newQty = item.quantity + quantity;
        const effectiveQty = Math.min(newQty, product.stock);
        const updatedItem: CartItem = {
          ...item,
          quantity: effectiveQty,
          total: (item.finalUnitPrice * effectiveQty),
        };
        const updated = [...prevCart];
        updated[existingIndex] = updatedItem;
        return updated;
      } else {
        const initialQty = Math.min(quantity, product.stock);
        const newItem: CartItem = {
          product,
          quantity: initialQty,
          discount: 0,
          discountType: 'fixed',
          finalUnitPrice: product.sellingPrice,
          total: product.sellingPrice * initialQty,
        };
        return [newItem, ...prevCart];
      }
    });

    return true;
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  }, []);

  const updateCartItemQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const maxStock = item.product.stock;
          const finalQty = Math.min(quantity, maxStock);
          return {
            ...item,
            quantity: finalQty,
            total: item.finalUnitPrice * finalQty,
          };
        }
        return item;
      });
    });
  }, [removeFromCart]);

  const updateCartItemDiscount = useCallback((productId: string, discount: number, discountType: 'fixed' | 'percent' = 'fixed') => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.product.id === productId) {
          const basePrice = item.product.sellingPrice;
          const discountAmt = discountType === 'percent' 
            ? (basePrice * discount) / 100 
            : discount;
          const finalPrice = Math.max(0, basePrice - discountAmt);
          return {
            ...item,
            discount,
            discountType,
            finalUnitPrice: finalPrice,
            total: finalPrice * item.quantity,
          };
        }
        return item;
      });
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCartCustomerState(null);
    setCartDiscountState(0);
  }, []);

  const setCartCustomer = useCallback((customer: Customer | null) => {
    setCartCustomerState(customer);
  }, []);

  // --- Parked Carts (now persisted in DB) ---
  const parkCurrentCart = useCallback(async (title?: string): Promise<boolean> => {
    if (cart.length === 0) return false;

    try {
      const newParkedCart = await apiCreateParkedCart({
        title: title || `Order (${cart.length} items)`,
        items: cart,
        customerId: cartCustomer?.id,
        discount: cartDiscount,
      } as Partial<ParkedCart>);

      setParkedCarts(prev => [newParkedCart, ...prev]);
      clearCart();
      return true;
    } catch (err) {
      console.error("Failed to park cart:", err);
      return false;
    }
  }, [cart, cartCustomer, cartDiscount, clearCart]);

  const resumeParkedCart = useCallback(async (cartId: string) => {
    const parked = parkedCarts.find(p => p.id === cartId);
    if (!parked) return;

    setCart(parked.items);
    if (parked.customerId) {
      const foundCust = customers.find(c => c.id === parked.customerId) || null;
      setCartCustomerState(foundCust);
    } else {
      setCartCustomerState(null);
    }
    setCartDiscountState(parked.discount || 0);

    try {
      await deleteStoredParkedCart(cartId);
      setParkedCarts(prev => prev.filter(p => p.id !== cartId));
    } catch (err) {
      console.error("Failed to remove parked cart from server:", err);
    }
  }, [parkedCarts, customers]);

  const deleteParkedCart = useCallback(async (cartId: string) => {
    try {
      await deleteStoredParkedCart(cartId);
      setParkedCarts(prev => prev.filter(p => p.id !== cartId));
    } catch (err) {
      console.error("Failed to delete parked cart:", err);
    }
  }, []);

  // --- Complete Sale (Checkout) ---
  const completeSale = useCallback(async (paymentData: {
    paymentMethod: PaymentMethod;
    amountPaid: number;
    changeReturned: number;
    notes?: string;
    reference?: string;
    customer?: Customer | null;
  }): Promise<Sale> => {
    if (cart.length === 0) {
      throw new Error("Cart is empty");
    }

    const currentCustomer = paymentData.customer || cartCustomer;

    const saleItems = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      sku: item.product.sku,
      costPrice: item.product.costPrice,
      unitPrice: item.finalUnitPrice,
      quantity: item.quantity,
      unit: item.product.unit,
      discount: item.discount,
      total: item.total,
    }));

    const newSale = await apiCreateSale({
      items: saleItems,
      grandTotal: cartTotals.grandTotal,
      subtotal: cartTotals.subtotal,
      discountTotal: cartTotals.discountTotal,
      taxRate: settings.enableTax ? settings.defaultTaxRate : 0,
      taxAmount: cartTotals.taxAmount,
      paymentMethod: paymentData.paymentMethod,
      amountPaid: paymentData.amountPaid,
      changeReturned: paymentData.changeReturned,
      customerId: currentCustomer?.id,
      reference: paymentData.reference,
      notes: paymentData.notes,
      cashierName: settings.cashierName,
    });

    // Refresh affected slices of state from server (stock, customer balance, ledger all changed server-side)
    const [updatedProducts, updatedSales, updatedCustomers, updatedLedger] = await Promise.all([
      getStoredProducts(),
      getStoredSales(),
      getStoredCustomers(),
      getStoredLedger(),
    ]);
    setProducts(updatedProducts);
    setSales(updatedSales);
    setCustomers(updatedCustomers);
    setLedger(updatedLedger);

    clearCart();

    return newSale;
  }, [cart, cartCustomer, cartTotals, settings, clearCart]);

  // --- Void / Refund Sale ---
  const voidSale = useCallback(async (saleId: string): Promise<boolean> => {
    try {
      await voidStoredSale(saleId);

      const [updatedProducts, updatedSales, updatedCustomers, updatedLedger] = await Promise.all([
        getStoredProducts(),
        getStoredSales(),
        getStoredCustomers(),
        getStoredLedger(),
      ]);
      setProducts(updatedProducts);
      setSales(updatedSales);
      setCustomers(updatedCustomers);
      setLedger(updatedLedger);

      return true;
    } catch (err) {
      console.error("Failed to void sale:", err);
      return false;
    }
  }, []);

  // --- Inventory Management ---
  const addProduct = useCallback(async (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> => {
    const newProduct = await apiCreateProduct(productData);
    setProducts(prev => [newProduct, ...prev]);
    return newProduct;
  }, []);

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>): Promise<boolean> => {
    try {
      const updated = await updateStoredProduct(id, updates);
      setProducts(prev => prev.map(p => (p.id === id ? updated : p)));
      return true;
    } catch (err) {
      console.error("Failed to update product:", err);
      return false;
    }
  }, []);

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteStoredProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (err) {
      console.error("Failed to delete product:", err);
      return false;
    }
  }, []);

  const adjustStock = useCallback(async (id: string, delta: number, _reason: string = "Manual Stock Adjustment"): Promise<boolean> => {
    try {
      const updated = await adjustStoredStock(id, delta);
      setProducts(prev => prev.map(p => (p.id === id ? updated : p)));
      return true;
    } catch (err) {
      console.error("Failed to adjust stock:", err);
      return false;
    }
  }, []);

  // --- Customer / Khata Management ---
  const addCustomer = useCallback(async (customerData: Omit<Customer, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
    const newCustomer = await apiCreateCustomer(customerData);
    setCustomers(prev => [newCustomer, ...prev]);
    return newCustomer;
  }, []);

  const updateCustomer = useCallback(async (id: string, updates: Partial<Customer>): Promise<boolean> => {
    try {
      const updated = await updateStoredCustomer(id, updates);
      setCustomers(prev => prev.map(c => (c.id === id ? updated : c)));
      return true;
    } catch (err) {
      console.error("Failed to update customer:", err);
      return false;
    }
  }, []);

  const deleteCustomer = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteStoredCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (err) {
      console.error("Failed to delete customer:", err);
      return false;
    }
  }, []);

  const recordCustomerPayment = useCallback(async (
    customerId: string, 
    amount: number, 
    paymentMethod: PaymentMethod | 'bank_transfer' | 'cheque', 
    referenceNo?: string, 
    notes?: string
  ): Promise<boolean> => {
    if (amount <= 0) return false;
    try {
      const { customer, entry } = await recordStoredCustomerPayment(customerId, amount, paymentMethod, referenceNo, notes);
      setCustomers(prev => prev.map(c => (c.id === customerId ? customer : c)));
      setLedger(prev => [entry, ...prev]);
      return true;
    } catch (err) {
      console.error("Failed to record payment:", err);
      return false;
    }
  }, []);

  // --- Settings ---
  const updateSettings = useCallback(async (updates: Partial<StoreSettings>): Promise<boolean> => {
    try {
      const updated = await saveStoredSettings(updates);
      setSettings(updated);
      return true;
    } catch (err) {
      console.error("Failed to update settings:", err);
      return false;
    }
  }, []);

  const refreshAllData = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  const value: AppContextType = {
    products,
    categories,
    customers,
    sales,
    ledger,
    settings,
    parkedCarts,
    isLoaded,
    stats,

    // Active POS Cart
    cart,
    cartCustomer,
    cartDiscount,
    cartDiscountType,
    cartTotals,
    addToCart,
    updateCartItemQuantity,
    updateCartItemDiscount,
    removeFromCart,
    clearCart,
    setCartCustomer,
    setCartDiscount: (discount, type = 'fixed') => {
      setCartDiscountState(discount);
      setCartDiscountType(type);
    },
    parkCurrentCart,
    resumeParkedCart,
    deleteParkedCart,
    completeSale,

    // Inventory
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,

    // Khata
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordCustomerPayment,

    // Settings
    updateSettings,
    refreshAllData,
    voidSale,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
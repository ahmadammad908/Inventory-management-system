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
  saveStoredProducts, 
  getStoredSales, 
  saveStoredSales, 
  getStoredCustomers, 
  saveStoredCustomers, 
  getStoredLedger, 
  saveStoredLedger, 
  getStoredSettings, 
  saveStoredSettings, 
  getStoredCategories, 
  saveStoredCategories, 
  getStoredParkedCarts, 
  saveStoredParkedCarts,
  seedSampleData, 
  resetAllData, 
  importBackupJSON, 
  STORAGE_EVENT_NAME 
} from "@/lib/storage/storage-manager";
import { generateId, generateInvoiceNo, calculateCartTotals } from "@/lib/utils";

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
  parkCurrentCart: (title?: string) => boolean;
  resumeParkedCart: (cartId: string) => void;
  deleteParkedCart: (cartId: string) => void;
  completeSale: (paymentData: {
    paymentMethod: PaymentMethod;
    amountPaid: number;
    changeReturned: number;
    notes?: string;
    reference?: string;
    customer?: Customer | null;
  }) => Promise<Sale>;

  // Inventory Actions
  addProduct: (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => boolean;
  deleteProduct: (id: string) => boolean;
  adjustStock: (id: string, delta: number, reason?: string) => boolean;

  // Customer / Khata Actions
  addCustomer: (customerData: Omit<Customer, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => boolean;
  deleteCustomer: (id: string) => boolean;
  recordCustomerPayment: (
    customerId: string, 
    amount: number, 
    paymentMethod: PaymentMethod | 'bank_transfer' | 'cheque', 
    referenceNo?: string, 
    notes?: string
  ) => boolean;

  // Settings & System
  updateSettings: (updates: Partial<StoreSettings>) => boolean;
  seedData: (force?: boolean) => void;
  restoreData: (jsonString: string) => { success: boolean; message: string };
  resetData: () => void;
  voidSale: (saleId: string) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(getStoredSettings());
  const [parkedCarts, setParkedCarts] = useState<ParkedCart[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Active POS Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartCustomer, setCartCustomer] = useState<Customer | null>(null);
  const [cartDiscount, setCartDiscount] = useState<number>(0);
  const [cartDiscountType, setCartDiscountType] = useState<'fixed' | 'percent'>('fixed');

  // Load all initial data
  const loadAllData = useCallback(() => {
    // Seed initial data if empty
    seedSampleData(false);

    setProducts(getStoredProducts());
    setCategories(getStoredCategories());
    setCustomers(getStoredCustomers());
    setSales(getStoredSales());
    setLedger(getStoredLedger());
    setSettings(getStoredSettings());
    setParkedCarts(getStoredParkedCarts());
    setIsLoaded(true);
  }, []);

  // Listen for storage events (multi-tab & in-tab dispatch)
  useEffect(() => {
    loadAllData();

    const handleStorageChange = () => {
      setProducts(getStoredProducts());
      setCategories(getStoredCategories());
      setCustomers(getStoredCustomers());
      setSales(getStoredSales());
      setLedger(getStoredLedger());
      setSettings(getStoredSettings());
      setParkedCarts(getStoredParkedCarts());
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(STORAGE_EVENT_NAME, handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(STORAGE_EVENT_NAME, handleStorageChange);
    };
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
    
    // Calculate profit for today's sales
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

  // --- Cart Actions ---
  const addToCart = useCallback((product: Product, quantity: number = 1): boolean => {
    if (product.stock <= 0) {
      return false;
    }

    setCart(prevCart => {
      const existingIndex = prevCart.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const item = prevCart[existingIndex];
        const newQty = item.quantity + quantity;
        
        // Cap quantity at current available stock
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
  }, []);

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

  const removeFromCart = useCallback((productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setCartCustomer(null);
    setCartDiscount(0);
  }, []);

  const parkCurrentCart = useCallback((title?: string): boolean => {
    if (cart.length === 0) return false;

    const newParkedCart: ParkedCart = {
      id: generateId('park'),
      title: title || `Order #${parkedCarts.length + 1} (${cart.length} items)`,
      items: [...cart],
      customerId: cartCustomer?.id,
      discount: cartDiscount,
      createdAt: new Date().toISOString(),
    };

    const updated = [newParkedCart, ...parkedCarts];
    setParkedCarts(updated);
    saveStoredParkedCarts(updated);
    clearCart();
    return true;
  }, [cart, cartCustomer, cartDiscount, parkedCarts, clearCart]);

  const resumeParkedCart = useCallback((cartId: string) => {
    const parked = parkedCarts.find(p => p.id === cartId);
    if (!parked) return;

    setCart(parked.items);
    if (parked.customerId) {
      const foundCust = customers.find(c => c.id === parked.customerId) || null;
      setCartCustomer(foundCust);
    } else {
      setCartCustomer(null);
    }
    setCartDiscount(parked.discount || 0);

    const updatedParked = parkedCarts.filter(p => p.id !== cartId);
    setParkedCarts(updatedParked);
    saveStoredParkedCarts(updatedParked);
  }, [parkedCarts, customers]);

  const deleteParkedCart = useCallback((cartId: string) => {
    const updatedParked = parkedCarts.filter(p => p.id !== cartId);
    setParkedCarts(updatedParked);
    saveStoredParkedCarts(updatedParked);
  }, [parkedCarts]);

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
    const saleId = generateId('sale');
    const invoiceNo = generateInvoiceNo(sales.length);
    const nowIso = new Date().toISOString();

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

    const newSale: Sale = {
      id: saleId,
      invoiceNo,
      items: saleItems,
      subtotal: cartTotals.subtotal,
      discountTotal: cartTotals.discountTotal,
      taxRate: settings.enableTax ? settings.defaultTaxRate : 0,
      taxAmount: cartTotals.taxAmount,
      grandTotal: cartTotals.grandTotal,
      paymentMethod: paymentData.paymentMethod,
      amountPaid: paymentData.paymentMethod === 'udhaar' ? 0 : paymentData.amountPaid,
      changeReturned: paymentData.changeReturned,
      customerId: currentCustomer?.id,
      customerName: currentCustomer ? currentCustomer.name : "Walk-in Customer",
      customerPhone: currentCustomer?.phone,
      paymentReference: paymentData.reference,
      cashierName: settings.cashierName,
      status: "completed",
      notes: paymentData.notes,
      createdAt: nowIso,
    };

    // 1. Deduct Product Stock
    const updatedProducts = products.map(product => {
      const soldItem = cart.find(i => i.product.id === product.id);
      if (soldItem) {
        return {
          ...product,
          stock: Math.max(0, product.stock - soldItem.quantity),
          updatedAt: nowIso,
        };
      }
      return product;
    });
    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);

    // 2. Save Sale
    const updatedSales = [newSale, ...sales];
    setSales(updatedSales);
    saveStoredSales(updatedSales);

    // 3. Handle Udhaar / Customer Ledger if applicable
    if (paymentData.paymentMethod === 'udhaar' && currentCustomer) {
      const newCustomerBalance = currentCustomer.currentBalance + cartTotals.grandTotal;
      
      const newLedgerEntry: LedgerEntry = {
        id: generateId('ledg'),
        customerId: currentCustomer.id,
        type: 'debit_sale',
        amount: cartTotals.grandTotal,
        balanceAfter: newCustomerBalance,
        invoiceId: saleId,
        invoiceNo,
        notes: `POS Bill ${invoiceNo} (${saleItems.length} items)`,
        date: nowIso,
      };

      const updatedLedger = [newLedgerEntry, ...ledger];
      setLedger(updatedLedger);
      saveStoredLedger(updatedLedger);

      const updatedCustomers = customers.map(c => {
        if (c.id === currentCustomer.id) {
          return {
            ...c,
            currentBalance: newCustomerBalance,
            updatedAt: nowIso,
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);
      saveStoredCustomers(updatedCustomers);
    }

    // 4. Clear Active Cart
    clearCart();

    return newSale;
  }, [cart, cartCustomer, cartTotals, sales, products, customers, ledger, settings, clearCart]);

  // --- Void / Refund Sale ---
  const voidSale = useCallback((saleId: string): boolean => {
    const targetSale = sales.find(s => s.id === saleId);
    if (!targetSale || targetSale.status === 'refunded') return false;

    const nowIso = new Date().toISOString();

    // 1. Replenish Product Stock
    const updatedProducts = products.map(product => {
      const returnedItem = targetSale.items.find(i => i.productId === product.id);
      if (returnedItem) {
        return {
          ...product,
          stock: product.stock + returnedItem.quantity,
          updatedAt: nowIso,
        };
      }
      return product;
    });
    setProducts(updatedProducts);
    saveStoredProducts(updatedProducts);

    // 2. Mark Sale as Refunded
    const updatedSales = sales.map(s => {
      if (s.id === saleId) {
        return {
          ...s,
          status: 'refunded' as const,
          notes: (s.notes ? s.notes + ' | ' : '') + `Refunded/Voided on ${new Date().toLocaleDateString()}`,
        };
      }
      return s;
    });
    setSales(updatedSales);
    saveStoredSales(updatedSales);

    // 3. Revert Udhaar balance if sale was Udhaar
    if (targetSale.paymentMethod === 'udhaar' && targetSale.customerId) {
      const customer = customers.find(c => c.id === targetSale.customerId);
      if (customer) {
        const newBalance = Math.max(0, customer.currentBalance - targetSale.grandTotal);
        const newLedgerEntry: LedgerEntry = {
          id: generateId('ledg'),
          customerId: customer.id,
          type: 'adjustment',
          amount: -targetSale.grandTotal,
          balanceAfter: newBalance,
          invoiceId: targetSale.id,
          invoiceNo: targetSale.invoiceNo,
          notes: `Reversal of voided bill ${targetSale.invoiceNo}`,
          date: nowIso,
        };

        const updatedLedger = [newLedgerEntry, ...ledger];
        setLedger(updatedLedger);
        saveStoredLedger(updatedLedger);

        const updatedCustomers = customers.map(c => {
          if (c.id === customer.id) {
            return {
              ...c,
              currentBalance: newBalance,
              updatedAt: nowIso,
            };
          }
          return c;
        });
        setCustomers(updatedCustomers);
        saveStoredCustomers(updatedCustomers);
      }
    }

    return true;
  }, [sales, products, customers, ledger]);

  // --- Inventory Management ---
  const addProduct = useCallback((productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const nowIso = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id: generateId('prod'),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const updated = [newProduct, ...products];
    setProducts(updated);
    saveStoredProducts(updated);
    return newProduct;
  }, [products]);

  const updateProduct = useCallback((id: string, updates: Partial<Product>): boolean => {
    const nowIso = new Date().toISOString();
    const updated = products.map(p => {
      if (p.id === id) {
        return { ...p, ...updates, updatedAt: nowIso };
      }
      return p;
    });

    setProducts(updated);
    saveStoredProducts(updated);
    return true;
  }, [products]);

  const deleteProduct = useCallback((id: string): boolean => {
    const updated = products.filter(p => p.id !== id);
    setProducts(updated);
    saveStoredProducts(updated);
    return true;
  }, [products]);

  const adjustStock = useCallback((id: string, delta: number, reason: string = "Manual Stock Adjustment"): boolean => {
    const product = products.find(p => p.id === id);
    if (!product) return false;

    const newStock = Math.max(0, product.stock + delta);
    return updateProduct(id, { stock: newStock });
  }, [products, updateProduct]);

  // --- Customer / Khata Management ---
  const addCustomer = useCallback((customerData: Omit<Customer, 'id' | 'currentBalance' | 'createdAt' | 'updatedAt'>): Customer => {
    const nowIso = new Date().toISOString();
    const newCustomer: Customer = {
      ...customerData,
      id: generateId('cust'),
      currentBalance: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    saveStoredCustomers(updated);
    return newCustomer;
  }, [customers]);

  const updateCustomer = useCallback((id: string, updates: Partial<Customer>): boolean => {
    const nowIso = new Date().toISOString();
    const updated = customers.map(c => {
      if (c.id === id) {
        return { ...c, ...updates, updatedAt: nowIso };
      }
      return c;
    });

    setCustomers(updated);
    saveStoredCustomers(updated);
    return true;
  }, [customers]);

  const deleteCustomer = useCallback((id: string): boolean => {
    const updated = customers.filter(c => c.id !== id);
    setCustomers(updated);
    saveStoredCustomers(updated);
    return true;
  }, [customers]);

  const recordCustomerPayment = useCallback((
    customerId: string, 
    amount: number, 
    paymentMethod: PaymentMethod | 'bank_transfer' | 'cheque', 
    referenceNo?: string, 
    notes?: string
  ): boolean => {
    const customer = customers.find(c => c.id === customerId);
    if (!customer || amount <= 0) return false;

    const nowIso = new Date().toISOString();
    const newBalance = Math.max(0, customer.currentBalance - amount);

    const newEntry: LedgerEntry = {
      id: generateId('ledg'),
      customerId,
      type: 'credit_payment',
      amount,
      balanceAfter: newBalance,
      paymentMethod,
      referenceNo,
      notes: notes || `Payment received via ${paymentMethod}`,
      date: nowIso,
    };

    const updatedLedger = [newEntry, ...ledger];
    setLedger(updatedLedger);
    saveStoredLedger(updatedLedger);

    const updatedCustomers = customers.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          currentBalance: newBalance,
          updatedAt: nowIso,
        };
      }
      return c;
    });
    setCustomers(updatedCustomers);
    saveStoredCustomers(updatedCustomers);

    return true;
  }, [customers, ledger]);

  // --- Settings & Reset ---
  const updateSettings = useCallback((updates: Partial<StoreSettings>): boolean => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveStoredSettings(newSettings);
    return true;
  }, [settings]);

  const seedData = useCallback((force: boolean = true) => {
    seedSampleData(force);
    loadAllData();
  }, [loadAllData]);

  const restoreData = useCallback((jsonString: string) => {
    const result = importBackupJSON(jsonString);
    if (result.success) {
      loadAllData();
    }
    return result;
  }, [loadAllData]);

  const resetData = useCallback(() => {
    resetAllData();
    loadAllData();
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
      setCartDiscount(discount);
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
    seedData,
    restoreData,
    resetData,
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

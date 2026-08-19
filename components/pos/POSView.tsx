"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { BarcodeScannerInput } from "./BarcodeScannerInput";
import { ProductCatalogGrid } from "./ProductCatalogGrid";
import { CartList } from "./CartList";
import { CheckoutModal } from "./CheckoutModal";
import { ThermalReceipt } from "./ThermalReceipt";
import { CameraScannerModal } from "@/components/barcode/CameraScannerModal";
import { CustomerModal } from "@/components/khata/CustomerModal";
import { Product, Sale } from "@/types";
import { CheckCircle2, AlertTriangle } from "lucide-react";

interface CategoryOption {
  id: string; // MongoDB _id
  name: string;
}

export function POSView() {
  const {
    addToCart,
    cart,
    settings,
    cartCustomer,
    addCustomer,
  } = useApp();

  // ==========================================
  // PRODUCTS FROM MONGODB
  // ==========================================

  const [products, setProducts] = useState<Product[]>([]);
  const [isProductsLoading, setIsProductsLoading] =
    useState(true);

  const [productError, setProductError] = useState<
    string | null
  >(null);

  // ==========================================
  // CATEGORIES FROM MONGODB
  // ==========================================

  const [categories, setCategories] = useState<
    CategoryOption[]
  >([]);

  // ==========================================
  // POS STATES
  // ==========================================

  const [isCheckoutOpen, setIsCheckoutOpen] =
    useState<boolean>(false);

  const [isCameraOpen, setIsCameraOpen] =
    useState<boolean>(false);

  const [
    isNewCustomerModalOpen,
    setIsNewCustomerModalOpen,
  ] = useState<boolean>(false);

  const [completedSale, setCompletedSale] =
    useState<Sale | null>(null);

  const [scanAlert, setScanAlert] =
    useState<string | null>(null);

  // ==========================================
  // FETCH PRODUCTS FROM MONGODB
  // ==========================================

  const fetchProducts = async () => {
    try {
      setIsProductsLoading(true);
      setProductError(null);

      const response = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to fetch products"
        );
      }

      const normalizedProducts: Product[] = data.map(
        (product: any) => ({
          ...product,
          id: product._id?.toString() || product.id,
          categoryId:
            product.categoryId?.toString?.() ||
            product.categoryId ||
            "",
        })
      );

      setProducts(normalizedProducts);

      console.log(
        "POS Products loaded:",
        normalizedProducts
      );
    } catch (error) {
      console.error(
        "POS Products Error:",
        error
      );

      setProductError(
        error instanceof Error
          ? error.message
          : "Failed to load products"
      );
    } finally {
      setIsProductsLoading(false);
    }
  };

  // ==========================================
  // FETCH CATEGORIES FROM MONGODB
  // ==========================================

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) return;

      const data = await response.json();

      const normalizedCategories: CategoryOption[] =
        data.map((category: any) => ({
          id: category._id?.toString() || category.id,
          name: category.name,
        }));

      setCategories(normalizedCategories);
    } catch (error) {
      console.error(
        "POS Categories Error:",
        error
      );
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // ==========================================
  // GLOBAL KEYBOARD SHORTCUTS
  // ==========================================

  useEffect(() => {
    const handleKeyDown = (
      e: KeyboardEvent
    ) => {
      // F4 = Open checkout
      if (
        e.key === "F4" &&
        cart.length > 0 &&
        !isCheckoutOpen &&
        !completedSale
      ) {
        e.preventDefault();

        setIsCheckoutOpen(true);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    cart.length,
    isCheckoutOpen,
    completedSale,
  ]);

  // ==========================================
  // PRODUCT SELECT
  // ==========================================

  const handleProductSelect = (
    product: Product,
    quantity: number = 1
  ) => {
    const success = addToCart(
      product,
      quantity
    );

    if (success) {
      setScanAlert(
        `Added: ${product.name}`
      );

      setTimeout(() => {
        setScanAlert(null);
      }, 2000);
    }
  };

  // ==========================================
  // CAMERA BARCODE SCAN
  // ==========================================

  const handleCameraScanSuccess = (
    decodedText: string
  ) => {
    const barcode =
      decodedText.trim().toLowerCase();

    const found = products.find(
      (product) =>
        product.sku
          ?.toLowerCase()
          .trim() === barcode
    );

    if (found) {
      handleProductSelect(found, 1);
    } else {
      alert(
        `No product found in inventory with barcode: ${decodedText}`
      );
    }
  };

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (isProductsLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-slate-100/70">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />

          <p className="text-sm font-semibold text-slate-500">
            Loading inventory...
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN POS
  // ==========================================

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-3 sm:p-4 gap-3 bg-slate-100/70 overflow-hidden">
      
      {/* ========================================
          PRODUCT API ERROR
      ======================================== */}

      {productError && (
        <div className="flex items-center justify-between gap-3 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />

            <span className="text-xs font-semibold text-rose-700">
              {productError}
            </span>
          </div>

          <button
            onClick={fetchProducts}
            className="text-xs font-bold text-rose-700 hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ========================================
          BARCODE SEARCH
      ======================================== */}

      <div className="w-full">
        <BarcodeScannerInput
          products={products}
          onProductSelect={
            handleProductSelect
          }
          onOpenLiveScanner={() =>
            setIsCameraOpen(true)
          }
        />
      </div>

      {/* ========================================
          MAIN POS CONTENT
      ======================================== */}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        
        {/* ======================================
            PRODUCT CATALOG
        ====================================== */}

        <div className="hidden lg:block lg:col-span-7 xl:col-span-8 h-full overflow-hidden">
          <ProductCatalogGrid
            products={products}
            categories={categories}
            onAddToCart={(product) =>
              handleProductSelect(
                product,
                1
              )
            }
          />
        </div>

        {/* ======================================
            CART
        ====================================== */}

        <div className="lg:col-span-5 xl:col-span-4 h-full overflow-hidden">
          <CartList
            onOpenCheckout={() =>
              setIsCheckoutOpen(true)
            }
            onOpenNewCustomerModal={() =>
              setIsNewCustomerModalOpen(true)
            }
          />
        </div>
      </div>

      {/* ========================================
          NO PRODUCTS
      ======================================== */}

      {products.length === 0 && (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5 shadow-xl text-center">
            <p className="text-sm font-bold text-slate-700">
              No products found
            </p>

            <p className="text-xs text-slate-500 mt-1">
              Add products to your inventory first.
            </p>
          </div>
        </div>
      )}

      {/* ========================================
          CAMERA SCANNER
      ======================================== */}

      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() =>
          setIsCameraOpen(false)
        }
        onScanSuccess={
          handleCameraScanSuccess
        }
      />

      {/* ========================================
          CHECKOUT
      ======================================== */}

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() =>
          setIsCheckoutOpen(false)
        }
        onSaleComplete={(sale) => {
          setCompletedSale(sale);

          // Sale complete hone ke baad
          // latest stock/products dobara load
          fetchProducts();
        }}
        onOpenNewCustomerModal={() => {
          setIsCheckoutOpen(false);
          setIsNewCustomerModalOpen(true);
        }}
      />

      {/* ========================================
          THERMAL RECEIPT
      ======================================== */}

      {completedSale && (
        <ThermalReceipt
          sale={completedSale}
          settings={settings}
          customer={cartCustomer}
          onClose={() =>
            setCompletedSale(null)
          }
        />
      )}

      {/* ========================================
          CUSTOMER MODAL
      ======================================== */}

      <CustomerModal
        isOpen={
          isNewCustomerModalOpen
        }
        onClose={() =>
          setIsNewCustomerModalOpen(false)
        }
        onSubmit={(customerData) => {
          addCustomer(customerData);
        }}
      />

      {/* ========================================
          SCAN TOAST
      ======================================== */}

      {scanAlert && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />

          <span>{scanAlert}</span>
        </div>
      )}
    </div>
  );
}
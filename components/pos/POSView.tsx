"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { BarcodeScannerInput } from "./BarcodeScannerInput";
import { ProductCatalogGrid } from "./ProductCatalogGrid";
import { CartList } from "./CartList";
import { CheckoutModal } from "./CheckoutModal";
import { ThermalReceipt } from "./ThermalReceipt";
import { CameraScannerModal } from "@/components/barcode/CameraScannerModal";
import { CustomerModal } from "@/components/khata/CustomerModal";
import { Product, Sale } from "@/types";
import { CheckCircle2, ShoppingCart, Sparkles } from "lucide-react";

export function POSView() {
  const {
    products,
    categories,
    addToCart,
    cart,
    settings,
    cartCustomer,
    addCustomer,
  } = useApp();

  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [scanAlert, setScanAlert] = useState<string | null>(null);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F4 to open checkout if cart has items
      if (e.key === "F4" && cart.length > 0 && !isCheckoutOpen && !completedSale) {
        e.preventDefault();
        setIsCheckoutOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart.length, isCheckoutOpen, completedSale]);

  const handleProductSelect = (product: Product, quantity: number = 1) => {
    const success = addToCart(product, quantity);
    if (success) {
      setScanAlert(`Added: ${product.name}`);
      setTimeout(() => setScanAlert(null), 2000);
    }
  };

  const handleCameraScanSuccess = (decodedText: string) => {
    // Look up product by barcode
    const found = products.find(
      (p) => p.sku.toLowerCase() === decodedText.toLowerCase()
    );

    if (found) {
      handleProductSelect(found, 1);
    } else {
      alert(`No product found in inventory with barcode: ${decodedText}`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-3 sm:p-4 gap-3 bg-slate-100/70 overflow-hidden">
      {/* Top Barcode Search & Fast Scanner Bar */}
      <div className="w-full">
        <BarcodeScannerInput
          products={products}
          onProductSelect={handleProductSelect}
          onOpenLiveScanner={() => setIsCameraOpen(true)}
        />
      </div>

      {/* Main Content Split: Left Catalog Grid (60%) | Right Active Cart (40%) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Left Side: Touch / Click Product Catalog */}
        <div className="hidden lg:block lg:col-span-7 xl:col-span-8 h-full overflow-hidden">
          <ProductCatalogGrid
            products={products}
            categories={categories}
            onAddToCart={(p) => handleProductSelect(p, 1)}
          />
        </div>

        {/* Right Side: Active Cart & Billing */}
        <div className="lg:col-span-5 xl:col-span-4 h-full overflow-hidden">
          <CartList
            onOpenCheckout={() => setIsCheckoutOpen(true)}
            onOpenNewCustomerModal={() => setIsNewCustomerModalOpen(true)}
          />
        </div>
      </div>

      {/* Live Webcam Scanner Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScanSuccess={handleCameraScanSuccess}
      />

      {/* Checkout / Payment Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSaleComplete={(sale) => {
          setCompletedSale(sale);
        }}
        onOpenNewCustomerModal={() => {
          setIsCheckoutOpen(false);
          setIsNewCustomerModalOpen(true);
        }}
      />

      {/* Thermal Receipt Print Modal */}
      {completedSale && (
        <ThermalReceipt
          sale={completedSale}
          settings={settings}
          customer={cartCustomer}
          onClose={() => setCompletedSale(null)}
        />
      )}

      {/* Quick Customer Registration Modal */}
      <CustomerModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onSubmit={(customerData) => {
          addCustomer(customerData);
        }}
      />

      {/* Floating Scan Toast */}
      {scanAlert && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-2.5 rounded-full shadow-2xl text-xs font-bold border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{scanAlert}</span>
        </div>
      )}
    </div>
  );
}

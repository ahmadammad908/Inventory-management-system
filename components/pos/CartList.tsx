"use client";

import React, { useState } from "react";
import { 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  PauseCircle, 
  PlayCircle, 
  Percent, 
  RotateCcw, 
  ShoppingBag, 
  UserCheck, 
  AlertCircle,
  Tag
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatPKR } from "@/lib/utils";
import { Customer } from "@/types";

interface CartListProps {
  onOpenCheckout: () => void;
  onOpenNewCustomerModal: () => void;
}

export function CartList({ onOpenCheckout, onOpenNewCustomerModal }: CartListProps) {
  const {
    cart,
    cartCustomer,
    customers,
    setCartCustomer,
    updateCartItemQuantity,
    updateCartItemDiscount,
    removeFromCart,
    clearCart,
    cartTotals,
    cartDiscount,
    cartDiscountType,
    setCartDiscount,
    parkCurrentCart,
    parkedCarts,
    resumeParkedCart,
    deleteParkedCart,
    settings,
  } = useApp();

  const [isParkedModalOpen, setIsParkedModalOpen] = useState(false);
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState<string>("");
  const [overallDiscountInput, setOverallDiscountInput] = useState<string>(
    cartDiscount > 0 ? cartDiscount.toString() : ""
  );

  const handleCustomerChange = (customerId: string) => {
    if (customerId === "walk_in") {
      setCartCustomer(null);
    } else {
      const found = customers.find((c) => c.id === customerId);
      setCartCustomer(found || null);
    }
  };

  const handleApplyOverallDiscount = (val: string) => {
    setOverallDiscountInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setCartDiscount(num, "fixed");
    } else {
      setCartDiscount(0, "fixed");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* 1. Header: Customer Selection & Parked Orders */}
      <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          {/* Customer Selector */}
          <div className="relative flex-1">
            <div className="flex items-center space-x-1.5">
              <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <User className="w-4 h-4" />
              </div>
              <select
                value={cartCustomer ? cartCustomer.id : "walk_in"}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="walk_in">👤 Walk-in Customer (Cash / Online)</option>
                <optgroup label="Khata / Credit Customers">
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.name} ({cust.phone}) - Due: {formatPKR(cust.currentBalance)}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Quick Add Customer button */}
          <button
            onClick={onOpenNewCustomerModal}
            title="Register New Customer"
            className="p-1.5 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors font-bold text-xs flex items-center gap-1 px-2.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>

        {/* Selected Customer Udhaar alert banner if applicable */}
        {cartCustomer && (
          <div className="flex items-center justify-between text-xs px-3 py-1.5 bg-indigo-50 border border-indigo-200/70 rounded-xl text-indigo-900">
            <div className="flex items-center space-x-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span className="font-bold">{cartCustomer.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Khata Due:</span>
              <span className="font-extrabold text-rose-600 font-mono">
                {formatPKR(cartCustomer.currentBalance)}
              </span>
            </div>
          </div>
        )}

        {/* Cart Action Buttons (Hold / Park / Clear) */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center space-x-2">
            <button
              disabled={cart.length === 0}
              onClick={() => parkCurrentCart()}
              className="flex items-center space-x-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Hold Cart</span>
            </button>

            {parkedCarts.length > 0 && (
              <button
                onClick={() => setIsParkedModalOpen(true)}
                className="flex items-center space-x-1 px-2.5 py-1 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors font-bold animate-pulse"
              >
                <PlayCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Held ({parkedCarts.length})</span>
              </button>
            )}
          </div>

          {cart.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Clear all items from current cart?")) {
                  clearCart();
                }
              }}
              className="flex items-center space-x-1 text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Cart Items Table */}
      <div className="flex-1 overflow-y-auto p-3 divide-y divide-slate-100">
        {cart.length > 0 ? (
          cart.map((item) => (
            <div key={item.product.id} className="py-2.5 first:pt-0 last:pb-0 flex flex-col gap-1.5">
              {/* Top row: Name, unit price, line total */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h5 className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                    {item.product.name}
                  </h5>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {formatPKR(item.finalUnitPrice)} × {item.quantity} {item.product.unit}
                    {item.discount > 0 && (
                      <span className="ml-2 text-emerald-600 font-medium">
                        (Disc: {formatPKR(item.discount)})
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base font-mono">
                    {formatPKR(item.total)}
                  </span>
                </div>
              </div>

              {/* Bottom row: Quantity buttons, discount toggle, remove */}
              <div className="flex items-center justify-between">
                {/* Quantity Controls */}
                <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                  <button
                    onClick={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                    className="w-6 h-6 flex items-center justify-center bg-white rounded text-slate-700 hover:bg-slate-200 font-bold"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={item.product.stock}
                    value={item.quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) {
                        updateCartItemQuantity(item.product.id, val);
                      }
                    }}
                    className="w-10 text-center text-xs font-bold bg-transparent text-slate-800 focus:outline-none"
                  />
                  <button
                    disabled={item.quantity >= item.product.stock}
                    onClick={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                    className="w-6 h-6 flex items-center justify-center bg-white rounded text-slate-700 hover:bg-slate-200 font-bold disabled:opacity-40"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Right side controls: Discount and Remove */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const discPrompt = prompt(
                        `Enter discount for ${item.product.name} (PKR):`,
                        item.discount.toString()
                      );
                      if (discPrompt !== null) {
                        const parsed = parseFloat(discPrompt);
                        if (!isNaN(parsed) && parsed >= 0) {
                          updateCartItemDiscount(item.product.id, parsed, "fixed");
                        }
                      }
                    }}
                    title="Apply Line Item Discount"
                    className={`p-1 rounded-md text-xs font-semibold flex items-center space-x-0.5 transition-colors ${
                      item.discount > 0
                        ? "bg-emerald-100 text-emerald-800"
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span className="text-[10px]">Disc</span>
                  </button>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center text-slate-400">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              <ShoppingBag className="w-7 h-7" />
            </div>
            <p className="font-bold text-slate-700 text-sm">Cart is currently empty</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              Scan a barcode or click products from the catalog to start billing.
            </p>
          </div>
        )}
      </div>

      {/* 3. Cart Financial Summary & Checkout Button */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col gap-2.5">
        <div className="space-y-1.5 text-xs text-slate-600">
          {/* Subtotal */}
          <div className="flex justify-between items-center">
            <span>Subtotal ({cartTotals.totalItemsCount} items):</span>
            <span className="font-bold text-slate-800 font-mono">
              {formatPKR(cartTotals.subtotal)}
            </span>
          </div>

          {/* Overall Discount input */}
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1">
              <span>Bill Discount:</span>
            </span>
            <div className="flex items-center space-x-1">
              <span className="text-slate-400 text-[11px]">Rs.</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={overallDiscountInput}
                onChange={(e) => handleApplyOverallDiscount(e.target.value)}
                className="w-20 px-2 py-0.5 text-right font-bold text-xs bg-white border border-slate-300 rounded focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Tax (if enabled) */}
          {settings.enableTax && (
            <div className="flex justify-between items-center text-slate-500">
              <span>Sales Tax ({settings.defaultTaxRate}%):</span>
              <span className="font-bold font-mono text-slate-700">
                {formatPKR(cartTotals.taxAmount)}
              </span>
            </div>
          )}

          {/* Grand Total */}
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
            <span className="font-extrabold text-slate-900 text-sm sm:text-base">
              Grand Total:
            </span>
            <span className="font-black text-emerald-700 text-xl sm:text-2xl font-mono tracking-tight">
              {formatPKR(cartTotals.grandTotal)}
            </span>
          </div>
        </div>

        {/* Checkout Button */}
        <button
          disabled={cart.length === 0}
          onClick={onOpenCheckout}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-700/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99] flex items-center justify-center space-x-2"
        >
          <span>Pay &amp; Print Bill</span>
          <span className="bg-emerald-800/80 px-2 py-0.5 rounded text-xs font-mono font-bold">
            [F4]
          </span>
        </button>
      </div>

      {/* Held / Parked Carts Modal */}
      {isParkedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-5 max-w-md w-full border border-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-amber-600" />
                Held / Parked Orders
              </h3>
              <button
                onClick={() => setIsParkedModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="py-3 space-y-2 max-h-72 overflow-y-auto">
              {parkedCarts.map((p) => {
                const total = p.items.reduce((s, i) => s + i.total, 0);
                return (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 text-xs sm:text-sm">{p.title}</h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {p.items.length} items • {formatPKR(total)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          resumeParkedCart(p.id);
                          setIsParkedModalOpen(false);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-xs"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => deleteParkedCart(p.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 text-right">
              <button
                onClick={() => setIsParkedModalOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

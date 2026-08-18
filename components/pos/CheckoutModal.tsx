"use client";

import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { 
  Banknote, 
  CreditCard, 
  Smartphone, 
  BookOpen, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  User,
  Calculator,
  Receipt
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Modal } from "@/components/common/Modal";
import { formatPKR } from "@/lib/utils";
import { PaymentMethod, Customer, Sale } from "@/types";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleComplete: (sale: Sale) => void;
  onOpenNewCustomerModal: () => void;
}

export function CheckoutModal({
  isOpen,
  onClose,
  onSaleComplete,
  onOpenNewCustomerModal,
}: CheckoutModalProps) {
  const { cart, cartCustomer, cartTotals, completeSale, customers, setCartCustomer } = useApp();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    cartCustomer ? cartCustomer.id : ""
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const grandTotal = cartTotals.grandTotal;

  // Sync selected customer
  useEffect(() => {
    if (cartCustomer) {
      setSelectedCustomerId(cartCustomer.id);
    } else {
      setSelectedCustomerId("");
    }
  }, [cartCustomer]);

  // Set default cash tendered on open
  useEffect(() => {
    if (isOpen) {
      setCashTendered(grandTotal > 0 ? grandTotal.toString() : "");
      setError(null);
      setIsProcessing(false);
    }
  }, [isOpen, grandTotal]);

  const activeCustomer = customers.find((c) => c.id === selectedCustomerId) || cartCustomer;

  const numericCashTendered = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, numericCashTendered - grandTotal);
  const isCashInsufficient = paymentMethod === "cash" && numericCashTendered < grandTotal;

  // Credit limit calculation
  const newProjectedBalance = (activeCustomer?.currentBalance || 0) + grandTotal;
  const isOverCreditLimit =
    paymentMethod === "udhaar" &&
    activeCustomer &&
    activeCustomer.creditLimit > 0 &&
    newProjectedBalance > activeCustomer.creditLimit;

  const handleFastCash = (amount: number) => {
    setCashTendered(amount.toString());
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError("Cart is empty.");
      return;
    }

    if (paymentMethod === "cash" && isCashInsufficient) {
      setError(`Insufficient cash received. Required: ${formatPKR(grandTotal)}`);
      return;
    }

    if (paymentMethod === "udhaar" && !activeCustomer) {
      setError("Please select a registered Customer for Udhaar (Credit) billing.");
      return;
    }

    try {
      setIsProcessing(true);

      const completedSale = await completeSale({
        paymentMethod,
        amountPaid: paymentMethod === "cash" ? numericCashTendered : grandTotal,
        changeReturned: paymentMethod === "cash" ? changeDue : 0,
        notes,
        reference: referenceNo,
        customer: activeCustomer || null,
      });

      // Fire celebratory confetti!
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });

      onSaleComplete(completedSale);
      onClose();
    } catch (err) {
      console.error("Sale completion failed:", err);
      setError(err instanceof Error ? err.message : "Failed to process sale.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment & Checkout"
      subtitle={`Total Bill: ${formatPKR(grandTotal)} (${cartTotals.totalItemsCount} items)`}
      icon={<Receipt className="w-6 h-6" />}
      maxWidth="2xl"
    >
      <form onSubmit={handleCheckout} className="space-y-5">
        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Payment Method Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Select Payment Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Cash */}
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all ${
                paymentMethod === "cash"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Banknote className="w-6 h-6 mb-1.5 text-emerald-600" />
              <span className="font-extrabold text-xs sm:text-sm">Cash</span>
              <span className="text-[10px] text-slate-500">Fast Counter</span>
            </button>

            {/* JazzCash / EasyPaisa */}
            <button
              type="button"
              onClick={() => setPaymentMethod("jazzcash_easypaisa")}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all ${
                paymentMethod === "jazzcash_easypaisa"
                  ? "border-purple-600 bg-purple-50 text-purple-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Smartphone className="w-6 h-6 mb-1.5 text-purple-600" />
              <span className="font-extrabold text-xs sm:text-sm">JazzCash / EP</span>
              <span className="text-[10px] text-slate-500">Mobile QR / TID</span>
            </button>

            {/* Card */}
            <button
              type="button"
              onClick={() => setPaymentMethod("card")}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all ${
                paymentMethod === "card"
                  ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <CreditCard className="w-6 h-6 mb-1.5 text-blue-600" />
              <span className="font-extrabold text-xs sm:text-sm">Card</span>
              <span className="text-[10px] text-slate-500">POS Machine</span>
            </button>

            {/* Udhaar / Khata */}
            <button
              type="button"
              onClick={() => setPaymentMethod("udhaar")}
              className={`flex flex-col items-center justify-center p-3.5 rounded-xl border-2 transition-all ${
                paymentMethod === "udhaar"
                  ? "border-rose-600 bg-rose-50 text-rose-900 shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <BookOpen className="w-6 h-6 mb-1.5 text-rose-600" />
              <span className="font-extrabold text-xs sm:text-sm">Udhaar (Credit)</span>
              <span className="text-[10px] text-slate-500">Customer Khata</span>
            </button>
          </div>
        </div>

        {/* 2. Mode Specific Details */}

        {/* --- CASH PANEL --- */}
        {paymentMethod === "cash" && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-slate-700">Cash Received (PKR):</label>
                <span className="text-xs text-slate-500 font-mono">
                  Bill: <span className="font-bold text-slate-800">{formatPKR(grandTotal)}</span>
                </span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  Rs.
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  placeholder={grandTotal.toString()}
                  className="w-full pl-11 pr-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-lg font-black text-slate-900 font-mono focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Cash Buttons (Standard Pakistani currency notes) */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleFastCash(grandTotal)}
                className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 rounded-lg text-xs font-bold text-slate-800 transition-colors"
              >
                Exact ({formatPKR(grandTotal)})
              </button>
              {[500, 1000, 2000, 5000].map((note) => {
                if (note < grandTotal && grandTotal > 5000) return null;
                return (
                  <button
                    key={note}
                    type="button"
                    onClick={() => handleFastCash(note)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 rounded-lg text-xs font-bold text-slate-800 transition-colors font-mono"
                  >
                    Rs. {note.toLocaleString()}
                  </button>
                );
              })}
            </div>

            {/* Change Calculation Display */}
            <div className="p-3.5 bg-emerald-100/70 border border-emerald-300 rounded-xl flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
                Change to Return:
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-900 font-mono">
                {formatPKR(changeDue)}
              </span>
            </div>
          </div>
        )}

        {/* --- JAZZCASH / EASYPAISA PANEL --- */}
        {paymentMethod === "jazzcash_easypaisa" && (
          <div className="bg-purple-50/70 p-4 rounded-2xl border border-purple-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-purple-950 mb-1">
                Transaction Reference / TID (Optional):
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. JC-9847291 or EP-102938"
                className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <p className="text-xs text-purple-800">
              💡 Ask customer to scan store QR code or transfer to{" "}
              <strong className="font-mono">0300-1234567</strong>.
            </p>
          </div>
        )}

        {/* --- CARD PANEL --- */}
        {paymentMethod === "card" && (
          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-200 space-y-3">
            <div>
              <label className="block text-xs font-bold text-blue-950 mb-1">
                Card Approval Code / Last 4 Digits (Optional):
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder="e.g. Auth: 4892 - Visa"
                className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {/* --- UDHAAR (CREDIT) PANEL --- */}
        {paymentMethod === "udhaar" && (
          <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200 space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-rose-950">Select Customer for Khata:</label>
                <button
                  type="button"
                  onClick={onOpenNewCustomerModal}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  + Add New Customer
                </button>
              </div>

              <select
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  const found = customers.find((c) => c.id === e.target.value) || null;
                  setCartCustomer(found);
                }}
                className="w-full px-3.5 py-2.5 bg-white border border-rose-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone}) - Due: {formatPKR(c.currentBalance)}
                  </option>
                ))}
              </select>
            </div>

            {activeCustomer && (
              <div className="p-3 bg-white rounded-xl border border-rose-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Current Outstanding Khata:</span>
                  <span className="font-bold text-rose-600 font-mono">
                    {formatPKR(activeCustomer.currentBalance)}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>New Bill Amount:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    + {formatPKR(grandTotal)}
                  </span>
                </div>
                <div className="pt-1.5 border-t border-slate-100 flex justify-between font-bold text-slate-800">
                  <span>Total Due After this Sale:</span>
                  <span className="font-mono text-sm text-rose-700">
                    {formatPKR(newProjectedBalance)}
                  </span>
                </div>

                {isOverCreditLimit && (
                  <div className="mt-2 p-2 bg-amber-50 border border-amber-300 rounded-lg text-amber-900 text-[11px] flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                    <span>
                      Customer exceeds credit limit ({formatPKR(activeCustomer.creditLimit)}).
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. Sale Note input */}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Bill / Sale Note (Optional):
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Home delivery, wholesale rate applied, etc."
            className="w-full px-3.5 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* 4. Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isProcessing || (paymentMethod === "cash" && isCashInsufficient)}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-extrabold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isProcessing ? (
              <span>Processing Sale...</span>
            ) : (
              <>
                <span>Complete Sale &amp; Print Bill</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}

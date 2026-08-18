"use client";

import React, { useState } from "react";
import { Banknote, CreditCard, Smartphone, CheckCircle2, AlertCircle, Receipt } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Customer, PaymentMethod } from "@/types";
import { formatPKR } from "@/lib/utils";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onReceivePayment: (
    customerId: string,
    amount: number,
    paymentMethod: PaymentMethod | "bank_transfer",
    referenceNo?: string,
    notes?: string
  ) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  customer,
  onReceivePayment,
}: PaymentModalProps) {
  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "bank_transfer">("cash");
  const [referenceNo, setReferenceNo] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  if (!customer) return null;

  const numAmount = parseFloat(amount) || 0;
  const balanceAfter = Math.max(0, customer.currentBalance - numAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numAmount <= 0) {
      setError("Please enter a valid payment amount greater than 0.");
      return;
    }

    onReceivePayment(
      customer.id,
      numAmount,
      paymentMethod,
      referenceNo.trim() || undefined,
      notes.trim() || undefined
    );

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receive Khata Payment"
      subtitle={`Customer: ${customer.name} (Outstanding: ${formatPKR(customer.currentBalance)})`}
      icon={<Receipt className="w-5 h-5" />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Amount Input */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs font-bold text-slate-700 uppercase">
              Payment Amount Received (PKR) *
            </label>
            {customer.currentBalance > 0 && (
              <button
                type="button"
                onClick={() => setAmount(customer.currentBalance.toString())}
                className="text-[11px] font-bold text-emerald-700 hover:underline"
              >
                Clear Full Balance ({formatPKR(customer.currentBalance)})
              </button>
            )}
          </div>
          <div className="relative">
            <span className="text-slate-400 font-bold text-sm absolute left-3.5 top-1/2 -translate-y-1/2">
              Rs.
            </span>
            <input
              type="number"
              min="1"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-lg font-black font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Payment Mode
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all ${
                paymentMethod === "cash"
                  ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Banknote className="w-4 h-4 mb-1 text-emerald-600" />
              <span>Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("jazzcash_easypaisa")}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all ${
                paymentMethod === "jazzcash_easypaisa"
                  ? "border-purple-600 bg-purple-50 text-purple-900"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Smartphone className="w-4 h-4 mb-1 text-purple-600" />
              <span>JazzCash / EP</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("bank_transfer")}
              className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition-all ${
                paymentMethod === "bank_transfer"
                  ? "border-blue-600 bg-blue-50 text-blue-900"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              <CreditCard className="w-4 h-4 mb-1 text-blue-600" />
              <span>Bank / Card</span>
            </button>
          </div>
        </div>

        {/* Reference Number */}
        {paymentMethod !== "cash" && (
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Transaction ID / Ref #
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="e.g. JC-9847192 or Bank Auth 88401"
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Payment Notes (Optional)
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Cash handed over at counter by customer's brother"
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Balance Preview */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <span className="text-slate-500">Remaining Balance After Payment:</span>
          <span
            className={`font-mono font-black text-sm ${
              balanceAfter === 0 ? "text-emerald-700" : "text-rose-600"
            }`}
          >
            {formatPKR(balanceAfter)}
          </span>
        </div>

        {/* Submit Buttons */}
        <div className="pt-2 border-t border-slate-100 flex justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/30 transition-all"
          >
            Record Payment
          </button>
        </div>
      </form>
    </Modal>
  );
}

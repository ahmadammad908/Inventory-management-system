"use client";

import React, { useMemo } from "react";
import { 
  BookOpen, 
  Phone, 
  Send, 
  Printer, 
  PlusCircle, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertCircle,
  FileText,
  User
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Customer, LedgerEntry, StoreSettings } from "@/types";
import { formatPKR, formatDate, formatTime, generateWhatsAppReminderLink } from "@/lib/utils";

interface CustomerLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  ledger: LedgerEntry[];
  settings: StoreSettings;
  onOpenPaymentModal: (customer: Customer) => void;
}

export function CustomerLedgerModal({
  isOpen,
  onClose,
  customer,
  ledger,
  settings,
  onOpenPaymentModal,
}: CustomerLedgerModalProps) {
  if (!customer) return null;

  // Filter ledger for this customer, sorted chronologically (newest first or oldest first for statement)
  const customerEntries = useMemo(() => {
    return ledger
      .filter((e) => e.customerId === customer.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [ledger, customer.id]);

  const whatsappUrl = generateWhatsAppReminderLink(
    customer.name,
    customer.phone,
    customer.currentBalance,
    settings.storeName,
    settings.phone
  );

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customer Khata Ledger &amp; History"
      subtitle={`${customer.name} • Contact: ${customer.phone}`}
      icon={<BookOpen className="w-5 h-5" />}
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Customer Header Summary Card */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-extrabold text-slate-900 text-base">{customer.name}</h3>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                {customer.phone}
              </span>
            </div>
            {customer.address && (
              <p className="text-xs text-slate-500 mt-0.5">{customer.address}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Credit Limit: <span className="font-semibold text-slate-700">{formatPKR(customer.creditLimit)}</span>
            </p>
          </div>

          <div className="flex flex-col sm:items-end">
            <span className="text-xs text-slate-500 font-medium">Outstanding Udhaar Balance:</span>
            <span className="text-2xl font-black text-rose-600 font-mono tracking-tight">
              {formatPKR(customer.currentBalance)}
            </span>
          </div>
        </div>

        {/* Action Buttons: WhatsApp Reminder + Receive Payment + Print */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center space-x-2">
            {/* WhatsApp Reminder Button */}
            {customer.currentBalance > 0 && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send WhatsApp Reminder</span>
              </a>
            )}

            <button
              onClick={handlePrintStatement}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print Statement</span>
            </button>
          </div>

          {/* Receive Payment Button */}
          <button
            onClick={() => {
              onClose();
              onOpenPaymentModal(customer);
            }}
            className="inline-flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-extrabold shadow-sm transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>Receive Payment</span>
          </button>
        </div>

        {/* Ledger Transaction History Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="px-3.5 py-2.5">Date &amp; Time</th>
                  <th className="px-3.5 py-2.5">Type &amp; Description</th>
                  <th className="px-3.5 py-2.5">Invoice / Ref</th>
                  <th className="px-3.5 py-2.5 text-right">Debit (+)</th>
                  <th className="px-3.5 py-2.5 text-right">Credit (-)</th>
                  <th className="px-3.5 py-2.5 text-right">Balance Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {customerEntries.length > 0 ? (
                  customerEntries.map((entry) => {
                    const isDebit = entry.type === "debit_sale" || (entry.type === "opening_balance" && entry.amount > 0);
                    const isCredit = entry.type === "credit_payment";

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-3.5 py-2.5 whitespace-nowrap text-slate-500">
                          {formatDate(entry.date)} {formatTime(entry.date)}
                        </td>
                        <td className="px-3.5 py-2.5">
                          <div className="flex items-center space-x-1.5">
                            {isDebit ? (
                              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                            ) : (
                              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-bold text-slate-900">
                                {isDebit
                                  ? "Credit Purchase (Bill)"
                                  : isCredit
                                  ? "Payment Received"
                                  : "Balance Adjustment"}
                              </p>
                              {entry.notes && (
                                <p className="text-[11px] text-slate-400 truncate max-w-xs">
                                  {entry.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3.5 py-2.5 font-mono text-slate-600">
                          {entry.invoiceNo || entry.referenceNo || "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-rose-600">
                          {isDebit ? formatPKR(entry.amount) : "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-bold text-emerald-600">
                          {isCredit ? formatPKR(entry.amount) : "-"}
                        </td>
                        <td className="px-3.5 py-2.5 text-right font-mono font-black text-slate-900">
                          {formatPKR(entry.balanceAfter)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                      <p className="font-semibold text-slate-600">No ledger entries recorded yet.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  );
}

"use client";

import React, { useRef } from "react";
import { Printer, X, Download, Share2, CheckCircle2, Store } from "lucide-react";
import { Sale, StoreSettings, Customer } from "@/types";
import { formatPKR, formatDate, formatTime } from "@/lib/utils";
import { BarcodeDisplay } from "@/components/barcode/BarcodeDisplay";

interface ThermalReceiptProps {
  sale: Sale | null;
  settings: StoreSettings;
  customer?: Customer | null;
  onClose: () => void;
}

export function ThermalReceipt({
  sale,
  settings,
  customer,
  onClose,
}: ThermalReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const paymentLabelMap = {
    cash: "CASH",
    card: "CARD",
    jazzcash_easypaisa: "JAZZCASH / EASYPAISA",
    udhaar: "UDHAAR (CREDIT)",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6">
        {/* Top Control Bar (Hidden during Print) */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white print:hidden">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm">Sale Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bill</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- THERMAL RECEIPT CONTAINER (80mm Width simulation) --- */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh] flex justify-center bg-slate-100/60 print:p-0 print:bg-white print:max-h-none">
          <div
            id="printable-receipt"
            ref={receiptRef}
            className="w-full max-w-[340px] bg-white p-4 shadow-sm border border-slate-200 rounded-lg text-slate-900 font-mono text-xs leading-tight print:border-none print:shadow-none print:p-2 print:m-0 print:w-full"
          >
            {/* Header / Store Info */}
            <div className="text-center pb-3 border-b border-dashed border-slate-400 space-y-1">
              <h2 className="font-black text-base uppercase tracking-tight text-slate-900">
                {settings.storeName}
              </h2>
              <p className="text-[11px] text-slate-600">{settings.tagline}</p>
              <p className="text-[11px] text-slate-600">{settings.address}</p>
              <p className="text-[11px] text-slate-600">
                Ph: {settings.phone} • {settings.city}
              </p>
              {settings.ntnNumber && (
                <p className="text-[10px] text-slate-500">
                  NTN: {settings.ntnNumber} {settings.strnNumber ? `| STRN: ${settings.strnNumber}` : ""}
                </p>
              )}
              {settings.receiptHeaderNotice && (
                <p className="text-[10px] uppercase font-bold text-slate-700 pt-0.5">
                  {settings.receiptHeaderNotice}
                </p>
              )}
            </div>

            {/* Bill Info */}
            <div className="py-2.5 border-b border-dashed border-slate-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Invoice #:</span>
                <span className="font-bold">{sale.invoiceNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Date &amp; Time:</span>
                <span>
                  {formatDate(sale.createdAt)} {formatTime(sale.createdAt)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{sale.cashierName || settings.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span>Customer:</span>
                <span className="font-bold">{sale.customerName || "Walk-in Customer"}</span>
              </div>
              {sale.customerPhone && (
                <div className="flex justify-between text-slate-600">
                  <span>Phone:</span>
                  <span>{sale.customerPhone}</span>
                </div>
              )}
            </div>

            {/* Items Table Header */}
            <div className="py-1.5 border-b border-slate-800 text-[11px] font-bold flex justify-between">
              <span className="w-1/2">Item Description</span>
              <span className="w-1/6 text-center">Qty</span>
              <span className="w-1/6 text-right">Rate</span>
              <span className="w-1/6 text-right">Amount</span>
            </div>

            {/* Item Rows */}
            <div className="py-1.5 divide-y divide-dashed divide-slate-200 text-[11px]">
              {sale.items.map((item, idx) => (
                <div key={idx} className="py-1 flex items-center justify-between">
                  <div className="w-1/2 pr-1">
                    <p className="font-bold truncate">{item.productName}</p>
                    {item.discount > 0 && (
                      <p className="text-[9px] text-slate-500">Disc: -{formatPKR(item.discount)}</p>
                    )}
                  </div>
                  <div className="w-1/6 text-center">
                    {item.quantity} {item.unit}
                  </div>
                  <div className="w-1/6 text-right font-mono">{item.unitPrice}</div>
                  <div className="w-1/6 text-right font-bold font-mono">{item.total}</div>
                </div>
              ))}
            </div>

            {/* Totals Section */}
            <div className="pt-2 border-t border-dashed border-slate-400 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono">{formatPKR(sale.subtotal)}</span>
              </div>

              {sale.discountTotal > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Discount:</span>
                  <span className="font-mono">- {formatPKR(sale.discountTotal)}</span>
                </div>
              )}

              {sale.taxAmount > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>Sales Tax ({sale.taxRate}%):</span>
                  <span className="font-mono">{formatPKR(sale.taxAmount)}</span>
                </div>
              )}

              {/* Grand Total */}
              <div className="pt-1 border-t border-slate-800 flex justify-between text-sm font-black">
                <span>TOTAL AMOUNT:</span>
                <span className="font-mono">{formatPKR(sale.grandTotal)}</span>
              </div>
            </div>

            {/* Payment Summary */}
            <div className="mt-2.5 pt-2 border-t border-dashed border-slate-400 text-[11px] space-y-0.5">
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-bold">{paymentLabelMap[sale.paymentMethod]}</span>
              </div>

              {sale.paymentMethod === "cash" && (
                <>
                  <div className="flex justify-between">
                    <span>Cash Tendered:</span>
                    <span className="font-mono">{formatPKR(sale.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Change Returned:</span>
                    <span className="font-mono">{formatPKR(sale.changeReturned)}</span>
                  </div>
                </>
              )}

              {sale.paymentReference && (
                <div className="flex justify-between text-slate-600">
                  <span>Ref / TID:</span>
                  <span className="font-mono">{sale.paymentReference}</span>
                </div>
              )}

              {/* Customer Khata Ledger summary if Udhaar */}
              {sale.paymentMethod === "udhaar" && customer && (
                <div className="mt-1 p-1.5 bg-slate-100 rounded text-[10px] space-y-0.5">
                  <div className="flex justify-between font-bold">
                    <span>Total Due in Khata:</span>
                    <span className="font-mono">{formatPKR(customer.currentBalance)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Barcode representation */}
            <div className="mt-4 pt-2 border-t border-dashed border-slate-400 flex flex-col items-center justify-center">
              <BarcodeDisplay
                value={sale.invoiceNo}
                width={1.2}
                height={35}
                fontSize={10}
                className="border-none p-0"
              />
            </div>

            {/* Urdu / English Footer Disclaimer */}
            <div className="mt-3 pt-2 border-t border-dashed border-slate-300 text-center space-y-1">
              <p className="text-[10px] font-semibold text-slate-700">
                {settings.receiptFooter}
              </p>
              <p className="text-[10px] font-bold text-slate-800">
                تشریف لانے کا شکریہ! Thank you for shopping with us.
              </p>
              <p className="text-[8px] text-slate-400 font-mono">
                System: Pakistan Retail POS Pro
              </p>
            </div>
          </div>
        </div>

        {/* Footer (Hidden during Print) */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500">80mm Thermal Receipt</span>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Print [Ctrl + P]</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Done / New Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Printer, X, Barcode, Copy, Check } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Product, StoreSettings } from "@/types";
import { BarcodeDisplay } from "@/components/barcode/BarcodeDisplay";
import { formatPKR } from "@/lib/utils";

interface PrintBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  settings: StoreSettings;
}

export function PrintBarcodeModal({
  isOpen,
  onClose,
  product,
  settings,
}: PrintBarcodeModalProps) {
  const [copies, setCopies] = useState<number>(6);
  const [copied, setCopied] = useState<boolean>(false);

  if (!product) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyBarcode = () => {
    navigator.clipboard.writeText(product.sku);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Print Barcode Labels"
      subtitle={`${product.name} (SKU: ${product.sku})`}
      icon={<Barcode className="w-5 h-5" />}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl print:hidden">
          <div className="flex items-center space-x-2">
            <label className="text-xs font-bold text-slate-700">Number of Stickers:</label>
            <select
              value={copies}
              onChange={(e) => setCopies(parseInt(e.target.value))}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800"
            >
              <option value="1">1 Label</option>
              <option value="4">4 Labels</option>
              <option value="6">6 Labels</option>
              <option value="12">12 Labels</option>
              <option value="24">24 Labels (Full Sheet)</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyBarcode}
              className="flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Barcode"}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Stickers</span>
            </button>
          </div>
        </div>

        {/* Printable Barcode Stickers Sheet */}
        <div className="p-4 bg-slate-100/60 rounded-xl border border-slate-200 overflow-y-auto max-h-[60vh] print:p-0 print:bg-white print:border-none print:max-h-none">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3 print:gap-2">
            {Array.from({ length: copies }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white p-2.5 rounded-lg border border-slate-300 shadow-xs flex flex-col items-center justify-between text-center min-h-[140px] print:border-slate-400 print:shadow-none"
              >
                {/* Store Name */}
                <p className="text-[10px] font-extrabold uppercase text-slate-800 tracking-tight truncate w-full">
                  {settings.storeName}
                </p>

                {/* Product Name */}
                <p className="text-[10px] font-bold text-slate-900 line-clamp-2 leading-tight my-1">
                  {product.name}
                </p>

                {/* Barcode Graphic */}
                <BarcodeDisplay
                  value={product.sku}
                  width={1.2}
                  height={32}
                  fontSize={10}
                  className="border-none p-0 my-0.5"
                />

                {/* Selling Price */}
                <p className="text-xs font-black text-slate-950 font-mono tracking-tight">
                  {formatPKR(product.sellingPrice)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

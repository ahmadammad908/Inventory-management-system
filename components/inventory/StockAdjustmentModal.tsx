"use client";

import React, { useState } from "react";
import { SlidersHorizontal, Plus, Minus, AlertCircle, Package } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Product } from "@/types";

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAdjust: (productId: string, delta: number, reason: string) => void;
}

export function StockAdjustmentModal({
  isOpen,
  onClose,
  product,
  onAdjust,
}: StockAdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add");
  const [quantity, setQuantity] = useState<string>("10");
  const [reason, setReason] = useState<string>("Supplier Shipment Received");
  const [customReason, setCustomReason] = useState<string>("");

  if (!product) return null;

  const numQty = parseInt(quantity) || 0;
  const delta = adjustmentType === "add" ? numQty : -numQty;
  const newStock = Math.max(0, product.stock + delta);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numQty <= 0) return;

    const finalReason = reason === "Other" ? customReason : reason;
    onAdjust(product.id, delta, finalReason || "Stock adjustment");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Product Stock"
      subtitle={`${product.name} (SKU: ${product.sku})`}
      icon={<SlidersHorizontal className="w-5 h-5" />}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Adjustment Type Switch */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setAdjustmentType("add");
              setReason("Supplier Shipment Received");
            }}
            className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
              adjustmentType === "add"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Add Stock (+)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAdjustmentType("subtract");
              setReason("Damaged / Expired Goods");
            }}
            className={`py-2 px-3 rounded-lg text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all ${
              adjustmentType === "subtract"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Minus className="w-4 h-4" />
            <span>Remove Stock (-)</span>
          </button>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Quantity to {adjustmentType === "add" ? "Add" : "Deduct"} ({product.unit}) *
          </label>
          <input
            type="number"
            min="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="10"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-lg font-black font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
        </div>

        {/* Reason Select */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Reason for Adjustment
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {adjustmentType === "add" ? (
              <>
                <option value="Supplier Shipment Received">Supplier Shipment / Stock In</option>
                <option value="Physical Inventory Audit Surplus">Physical Stock Audit Surplus</option>
                <option value="Customer Return / Exchange">Customer Return / Exchange</option>
                <option value="Other">Other</option>
              </>
            ) : (
              <>
                <option value="Damaged / Expired Goods">Damaged / Expired Goods</option>
                <option value="Physical Stock Audit Shrinkage">Physical Audit Shortage / Lost</option>
                <option value="Returned to Supplier">Returned to Wholesaler / Supplier</option>
                <option value="Personal / Store Consumption">Store / Personal Consumption</option>
                <option value="Other">Other</option>
              </>
            )}
          </select>
        </div>

        {reason === "Other" && (
          <div>
            <input
              type="text"
              required
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Specify custom reason..."
              className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        )}

        {/* Stock Level Preview */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Current: <span className="font-bold text-slate-800">{product.stock} {product.unit}</span>
          </div>
          <div className="font-extrabold text-slate-900">
            ➔ New Stock:{" "}
            <span
              className={`font-mono text-sm ${
                newStock <= product.minStockAlert ? "text-amber-600 font-bold" : "text-emerald-700"
              }`}
            >
              {newStock} {product.unit}
            </span>
          </div>
        </div>

        {/* Buttons */}
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
            Apply Adjustment
          </button>
        </div>
      </form>
    </Modal>
  );
}

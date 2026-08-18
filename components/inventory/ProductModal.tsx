"use client";

import React, { useState, useEffect } from "react";
import { 
  Package, 
  Barcode, 
  DollarSign, 
  Layers, 
  AlertTriangle, 
  Sparkles,
  TrendingUp,
  Tag
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Product, ProductCategory, ProductUnit } from "@/types";
import { generateSKU, formatPKR } from "@/lib/utils";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Omit<Product, "id" | "createdAt" | "updatedAt">) => void;
  initialProduct?: Product | null;
  categories: { id: string; name: string }[];
}

export function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  initialProduct,
  categories,
}: ProductModalProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [category, setCategory] = useState("Groceries");
  const [costPrice, setCostPrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStockAlert, setMinStockAlert] = useState("10");
  const [unit, setUnit] = useState<ProductUnit>("pcs");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name);
      setSku(initialProduct.sku);
      setCategory(initialProduct.category);
      setCostPrice(initialProduct.costPrice.toString());
      setSellingPrice(initialProduct.sellingPrice.toString());
      setStock(initialProduct.stock.toString());
      setMinStockAlert(initialProduct.minStockAlert.toString());
      setUnit(initialProduct.unit);
      setDescription(initialProduct.description || "");
    } else {
      setName("");
      setSku(generateSKU());
      setCategory(categories[0]?.name || "Groceries");
      setCostPrice("");
      setSellingPrice("");
      setStock("20");
      setMinStockAlert("10");
      setUnit("pcs");
      setDescription("");
    }
    setError(null);
  }, [initialProduct, isOpen, categories]);

  // Real-time Margin preview
  const numCost = parseFloat(costPrice) || 0;
  const numSell = parseFloat(sellingPrice) || 0;
  const profitMarginAmount = numSell - numCost;
  const profitMarginPercent = numSell > 0 ? Math.round((profitMarginAmount / numSell) * 100) : 0;

  const handleGenerateNewSKU = () => {
    setSku(generateSKU());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!sku.trim()) {
      setError("Barcode / SKU is required.");
      return;
    }

    const numCostParsed = parseFloat(costPrice);
    const numSellParsed = parseFloat(sellingPrice);
    const numStockParsed = parseInt(stock);
    const numAlertParsed = parseInt(minStockAlert);

    if (isNaN(numCostParsed) || numCostParsed < 0) {
      setError("Please provide a valid Cost Price.");
      return;
    }
    if (isNaN(numSellParsed) || numSellParsed < 0) {
      setError("Please provide a valid Selling Price.");
      return;
    }
    if (isNaN(numStockParsed) || numStockParsed < 0) {
      setError("Please provide a valid Stock quantity.");
      return;
    }

    onSubmit({
      name: name.trim(),
      sku: sku.trim(),
      category: category.trim(),
      costPrice: numCostParsed,
      sellingPrice: numSellParsed,
      stock: numStockParsed,
      minStockAlert: isNaN(numAlertParsed) ? 10 : numAlertParsed,
      unit,
      description: description.trim() || undefined,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialProduct ? "Edit Product Details" : "Add New Inventory Item"}
      subtitle="Item Master, Barcode, Pricing and Stock Levels"
      icon={<Package className="w-5 h-5" />}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Product Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Product / Item Name *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Shan Special Bombay Biryani Masala 50g"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            autoFocus
          />
        </div>

        {/* Barcode & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Barcode / SKU *
              </label>
              <button
                type="button"
                onClick={handleGenerateNewSKU}
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Auto-Gen</span>
              </button>
            </div>
            <div className="relative">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="896400010101"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing: Cost vs Selling */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Cost Price (PKR) *
            </label>
            <div className="relative">
              <span className="text-slate-400 font-bold text-xs absolute left-3.5 top-1/2 -translate-y-1/2">
                Rs.
              </span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="110"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Selling Price (PKR) *
            </label>
            <div className="relative">
              <span className="text-slate-400 font-bold text-xs absolute left-3.5 top-1/2 -translate-y-1/2">
                Rs.
              </span>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="140"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Margin indicator */}
          <div className="col-span-full pt-1 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Profit per item:
            </span>
            <span
              className={`font-mono ${
                profitMarginAmount >= 0 ? "text-emerald-700 font-bold" : "text-rose-600 font-bold"
              }`}
            >
              {formatPKR(profitMarginAmount)} ({profitMarginPercent}% Margin)
            </span>
          </div>
        </div>

        {/* Stock, Unit & Reorder Threshold */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Current Stock *
            </label>
            <input
              type="number"
              min="0"
              required
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder="50"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Unit of Measure
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as ProductUnit)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="pcs">Pieces (pcs)</option>
              <option value="pack">Pack / Pouch</option>
              <option value="bottle">Bottle / Pet</option>
              <option value="kg">Kilogram (kg)</option>
              <option value="g">Gram (g)</option>
              <option value="liter">Litre (L)</option>
              <option value="box">Box / Carton</option>
              <option value="dozen">Dozen</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Low Stock Alert
            </label>
            <input
              type="number"
              min="1"
              value={minStockAlert}
              onChange={(e) => setMinStockAlert(e.target.value)}
              placeholder="10"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Description / Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Description / Supplier (Optional)
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Item details, distributor name, or shelf location..."
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2.5">
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
            {initialProduct ? "Update Product" : "Save to Inventory"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

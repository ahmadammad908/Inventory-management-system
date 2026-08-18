"use client";

import React, { useState, useMemo } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  Printer, 
  Edit3, 
  Trash2, 
  Download, 
  AlertTriangle,
  Barcode,
  ArrowUpDown,
  Filter,
  CheckCircle2
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Product } from "@/types";
import { formatPKR, formatDate } from "@/lib/utils";
import { Badge } from "@/components/common/Badge";
import { ProductModal } from "./ProductModal";
import { StockAdjustmentModal } from "./StockAdjustmentModal";
import { PrintBarcodeModal } from "./PrintBarcodeModal";
import { BarcodeDisplay } from "@/components/barcode/BarcodeDisplay";

export function InventoryView() {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    settings,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [stockStatusFilter, setStockStatusFilter] = useState<"all" | "in_stock" | "low_stock" | "out_of_stock">("all");
  const [sortBy, setSortBy] = useState<"name" | "stock_asc" | "stock_desc" | "price_asc" | "price_desc">("name");

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  const [isPrintBarcodeModalOpen, setIsPrintBarcodeModalOpen] = useState<boolean>(false);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchSearch =
          searchTerm === "" ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchTerm.toLowerCase());

        const matchCategory =
          selectedCategory === "all" ||
          p.category.toLowerCase() === selectedCategory.toLowerCase();

        let matchStatus = true;
        if (stockStatusFilter === "in_stock") matchStatus = p.stock > p.minStockAlert;
        if (stockStatusFilter === "low_stock") matchStatus = p.stock > 0 && p.stock <= p.minStockAlert;
        if (stockStatusFilter === "out_of_stock") matchStatus = p.stock <= 0;

        return matchSearch && matchCategory && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "stock_asc") return a.stock - b.stock;
        if (sortBy === "stock_desc") return b.stock - a.stock;
        if (sortBy === "price_asc") return a.sellingPrice - b.sellingPrice;
        if (sortBy === "price_desc") return b.sellingPrice - a.sellingPrice;
        return 0;
      });
  }, [products, searchTerm, selectedCategory, stockStatusFilter, sortBy]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Product Name", "SKU / Barcode", "Category", "Cost Price (PKR)", "Selling Price (PKR)", "Current Stock", "Unit", "Min Alert"];
    const rows = filteredProducts.map((p) => [
      `"${p.name.replace(/"/g, '""')}"`,
      `"${p.sku}"`,
      `"${p.category}"`,
      p.costPrice,
      p.sellingPrice,
      p.stock,
      p.unit,
      p.minStockAlert,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory_stock_list_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("CSV inventory exported!");
  };

  const handleDelete = (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.name}" from inventory?`)) {
      deleteProduct(product.id);
      showToast("Product deleted from inventory.");
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />
            Inventory &amp; Stock Master
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage products, barcodes, buying/selling prices, and stock reorders.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar Card */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by product name or barcode SKU..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories ({products.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value as typeof stockStatusFilter)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Stock Status</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">⚠️ Low Stock Alert</option>
              <option value="out_of_stock">❌ Out of Stock</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="name">Sort by Name</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Quick Result Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong className="text-slate-800">{filteredProducts.length}</strong> of {products.length} products
          </span>
          {stockStatusFilter === "low_stock" && (
            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Low Stock Reorder View
            </span>
          )}
        </div>
      </div>

      {/* Inventory Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Product &amp; SKU</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-right">Cost Price</th>
                <th className="px-4 py-3.5 text-right">Selling Price</th>
                <th className="px-4 py-3.5 text-center">Margin</th>
                <th className="px-4 py-3.5 text-center">Current Stock</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
                  const profitAmt = product.sellingPrice - product.costPrice;
                  const profitPct = product.sellingPrice > 0 ? Math.round((profitAmt / product.sellingPrice) * 100) : 0;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Product Name + SKU */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {product.unit}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">{product.name}</p>
                            <div className="flex items-center space-x-1.5 font-mono text-xs text-slate-400 mt-0.5">
                              <Barcode className="w-3.5 h-3.5 text-slate-400" />
                              <span>{product.sku}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          {product.category}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-600">
                        {formatPKR(product.costPrice)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900">
                        {formatPKR(product.sellingPrice)}
                      </td>

                      {/* Margin % */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
                            profitAmt >= 0
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {profitPct}%
                        </span>
                      </td>

                      {/* Stock Level */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold font-mono ${
                            isOutOfStock
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : isLowStock
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {isOutOfStock ? (
                            "0 Out of Stock"
                          ) : (
                            <>
                              {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                              <span>
                                {product.stock} {product.unit}
                              </span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Stock Adjust button */}
                          <button
                            onClick={() => {
                              setAdjustingProduct(product);
                              setIsAdjustModalOpen(true);
                            }}
                            title="Adjust Stock Quantity (+ / -)"
                            className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <SlidersHorizontal className="w-4 h-4" />
                          </button>

                          {/* Print Barcode button */}
                          <button
                            onClick={() => {
                              setBarcodeProduct(product);
                              setIsPrintBarcodeModalOpen(true);
                            }}
                            title="Print Barcode Sticker"
                            className="p-1.5 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {/* Edit button */}
                          <button
                            onClick={() => {
                              setEditingProduct(product);
                              setIsProductModalOpen(true);
                            }}
                            title="Edit Product"
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete button */}
                          <button
                            onClick={() => handleDelete(product)}
                            title="Delete Product"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No matching inventory items</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try searching or clearing filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        initialProduct={editingProduct}
        categories={categories}
        onSubmit={(productData) => {
          if (editingProduct) {
            updateProduct(editingProduct.id, productData);
            showToast("Product updated successfully.");
          } else {
            addProduct(productData);
            showToast("New product added to inventory.");
          }
        }}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        product={adjustingProduct}
        onAdjust={(productId, delta, reason) => {
          adjustStock(productId, delta, reason);
          showToast(`Stock updated (${delta > 0 ? `+${delta}` : delta})`);
        }}
      />

      {/* Print Barcode Sheet Modal */}
      <PrintBarcodeModal
        isOpen={isPrintBarcodeModalOpen}
        onClose={() => setIsPrintBarcodeModalOpen(false)}
        product={barcodeProduct}
        settings={settings}
      />

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold border border-slate-700 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useMemo, useState } from "react";
import { Plus, ShoppingBag } from "lucide-react";
import { Product, Category } from "@/types";
import { formatPKR } from "@/lib/utils";

interface ProductCatalogGridProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (product: Product) => void;
}

export function ProductCatalogGrid({
  products,
  categories,
  onAddToCart,
}: ProductCatalogGridProps) {
  // "all" ya category ki MongoDB _id
  const [selectedCategoryId, setSelectedCategoryId] =
    useState<string>("all");

  const [searchTerm, setSearchTerm] = useState<string>("");

  // ==================================================
  // CATEGORY ID -> NAME LOOKUP (product card pe naam dikhane ke liye)
  // ==================================================

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();

    categories.forEach((cat) => {
      map.set(cat.id, cat.name);
    });

    return map;
  }, [categories]);

  const getCategoryName = (categoryId?: string) =>
    (categoryId && categoryNameById.get(categoryId)) ||
    "Uncategorized";

  // ==================================================
  // FILTER
  // ==================================================

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCategory =
        selectedCategoryId === "all" ||
        (p as any).categoryId === selectedCategoryId;

      const matchSearch =
        searchTerm === "" ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase());

      return matchCategory && matchSearch;
    });
  }, [products, selectedCategoryId, searchTerm]);

  return (
    <div className="flex flex-col h-full bg-slate-50/50 rounded-2xl border border-slate-200/80 p-4">
      {/* Category Pills Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none shrink-0">
        <button
          onClick={() => setSelectedCategoryId("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap leading-none transition-all ${
            selectedCategoryId === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All Items ({products.length})
        </button>

        {categories.map((cat) => {
          const count = products.filter(
            (p) => (p as any).categoryId === cat.id
          ).length;

          const isSelected = selectedCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap leading-none transition-all ${
                isSelected
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid of Product Cards */}
      <div className="mt-3 flex-1 overflow-y-auto pr-1">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;

              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={isOutOfStock}
                  onClick={() => onAddToCart(product)}
                  className={`group relative flex flex-col justify-between text-left p-3.5 rounded-xl bg-white border transition-all duration-150 shadow-xs min-h-[140px] h-full ${
                    isOutOfStock
                      ? "opacity-50 border-slate-200 bg-slate-50 cursor-not-allowed"
                      : "border-slate-200 hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
                  }`}
                >
                  {/* Card Top: Category and Stock Badge */}
                  <div className="flex items-center justify-between gap-1.5 w-full mb-2 shrink-0">
                    <span className="text-[10px] font-semibold text-slate-500 truncate bg-slate-100 px-2 py-0.5 rounded-md leading-none max-w-[60%]">
                      {getCategoryName((product as any).categoryId)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap leading-none ${
                        isOutOfStock
                          ? "bg-rose-100 text-rose-700"
                          : isLowStock
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {isOutOfStock ? "Out" : `${product.stock} ${product.unit}`}
                    </span>
                  </div>

                  {/* Card Center: Product Name & SKU */}
                  <div className="my-1 flex-1 flex flex-col justify-start">
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug group-hover:text-emerald-700 transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-1 truncate leading-none">
                      {product.sku}
                    </p>
                  </div>

                  {/* Card Bottom: Price and Add Plus Button */}
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 w-full shrink-0">
                    <span className="font-extrabold text-slate-900 text-xs sm:text-sm font-mono whitespace-nowrap leading-none truncate">
                      {formatPKR(product.sellingPrice)}
                    </span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isOutOfStock
                          ? "bg-slate-200 text-slate-400"
                          : "bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white"
                      }`}
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
            <ShoppingBag className="w-12 h-12 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-600 text-sm whitespace-nowrap">No products in this category</p>
            <p className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">Try selecting another category or clear filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
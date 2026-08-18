"use client";

import React, { useState, useRef, useEffect } from "react";
import { Barcode, Search, Camera, Sparkles, X, Plus } from "lucide-react";
import { Product } from "@/types";
import { formatPKR } from "@/lib/utils";

interface BarcodeScannerInputProps {
  products: Product[];
  onProductSelect: (product: Product, quantity?: number) => void;
  onOpenLiveScanner: () => void;
}

export function BarcodeScannerInput({
  products,
  onProductSelect,
  onOpenLiveScanner,
}: BarcodeScannerInputProps) {
  const [query, setQuery] = useState<string>("");
  const [isOpenSuggestions, setIsOpenSuggestions] = useState<boolean>(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-focus on initial mount and on key shortcuts
  useEffect(() => {
    inputRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 or '/' to focus barcode search
      if (e.key === "F2" || (e.key === "/" && document.activeElement?.tagName !== "INPUT")) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter products by SKU or Name
  const searchResults = React.useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return products
      .filter((p) => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
      .slice(0, 7);
  }, [query, products]);

  // Handle barcode scanner submission or Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const rawQuery = query.trim();
      if (!rawQuery) return;

      // 1. Check exact barcode match first (standard physical USB barcode scanner behavior)
      const exactMatch = products.find(
        (p) => p.sku.toLowerCase() === rawQuery.toLowerCase()
      );

      if (exactMatch) {
        onProductSelect(exactMatch, 1);
        setQuery("");
        setIsOpenSuggestions(false);
        return;
      }

      // 2. If highlighted in dropdown suggestions
      if (searchResults.length > 0) {
        const target = searchResults[highlightedIndex] || searchResults[0];
        onProductSelect(target, 1);
        setQuery("");
        setIsOpenSuggestions(false);
        return;
      }
    } else if (e.key === "Escape") {
      setIsOpenSuggestions(false);
    }
  };

  const handleSelectProduct = (product: Product) => {
    onProductSelect(product, 1);
    setQuery("");
    setIsOpenSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative flex items-center bg-white rounded-2xl border-2 border-emerald-600/60 shadow-sm hover:border-emerald-600 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/20 transition-all">
        {/* Barcode Icon */}
        <div className="pl-4 pr-2 text-emerald-600 flex items-center">
          <Barcode className="w-6 h-6" />
        </div>

        {/* Barcode Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpenSuggestions(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => setIsOpenSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Scan Barcode (USB Scanner) or type item name / SKU... [F2]"
          className="w-full py-3.5 pr-24 text-sm sm:text-base font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
          autoComplete="off"
          autoFocus
        />

        {/* Clear query button */}
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 mr-2 rounded-full hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Camera Scanner Trigger */}
        <div className="pr-2 flex items-center space-x-1.5">
          <button
            type="button"
            onClick={onOpenLiveScanner}
            title="Scan with Webcam / Mobile Camera"
            className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-colors shadow-xs"
          >
            <Camera className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Camera</span>
          </button>
        </div>
      </div>

      {/* Autocomplete / Search Suggestions Dropdown */}
      {isOpenSuggestions && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-2 z-40 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-80 overflow-y-auto animate-in fade-in-50 duration-100">
          {searchResults.length > 0 ? (
            <div className="py-1 divide-y divide-slate-100">
              {searchResults.map((product, idx) => {
                const isSelected = idx === highlightedIndex;
                const isOutOfStock = product.stock <= 0;

                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleSelectProduct(product)}
                    className={`w-full px-4 py-3 text-left flex items-center justify-between transition-colors ${
                      isSelected ? "bg-emerald-50 text-emerald-900" : "hover:bg-slate-50"
                    } ${isOutOfStock ? "opacity-60 cursor-not-allowed bg-slate-50/50" : ""}`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                          isOutOfStock
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {product.unit}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-slate-800 text-sm truncate">{product.name}</p>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5 font-mono">
                          <span>SKU: {product.sku}</span>
                          <span>•</span>
                          <span className="text-slate-600">{product.category}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right pl-3 flex-shrink-0">
                      <p className="font-extrabold text-slate-900 text-sm font-mono">
                        {formatPKR(product.sellingPrice)}
                      </p>
                      <span
                        className={`text-[11px] font-bold ${
                          isOutOfStock
                            ? "text-rose-600"
                            : product.stock <= product.minStockAlert
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {isOutOfStock ? "Out of Stock" : `Stock: ${product.stock}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-sm">
              <p className="font-semibold text-slate-700">No matching products found</p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching with a different name or scan another barcode.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

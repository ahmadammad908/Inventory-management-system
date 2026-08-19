"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  Barcode,
  AlertTriangle,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import { Modal } from "@/components/common/Modal";
import { Product, ProductUnit } from "@/types";
import { generateSKU, formatPKR } from "@/lib/utils";

interface CategoryOption {
  id: string; // MongoDB _id
  name: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;

  // Parent ko newly created / updated product dene ke liye
  onSubmit: (
    productData: Omit<
      Product,
      "id" | "createdAt" | "updatedAt"
    >
  ) => void;

  // Edit mode
  initialProduct?: Product | null;

  // Parent se real DB categories (_id + name) yahan aani chahiye
  categories?: CategoryOption[];
}

export function ProductModal({
  isOpen,
  onClose,
  onSubmit,
  initialProduct,
  categories = [],
}: ProductModalProps) {
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");

  // Category ab naam se nahi, ObjectId se track hoti hai
  const [categoryId, setCategoryId] =
    useState<string>("");

  const [costPrice, setCostPrice] =
    useState("");

  const [sellingPrice, setSellingPrice] =
    useState("");

  const [stock, setStock] =
    useState("");

  const [minStockAlert, setMinStockAlert] =
    useState("10");

  const [unit, setUnit] =
    useState<ProductUnit>("pcs");

  const [description, setDescription] =
    useState("");

  const [error, setError] =
    useState<string | null>(null);

  const [isSaving, setIsSaving] =
    useState(false);

  // ==================================================
  // CATEGORY LIST (mutable — naye categories add hote hain)
  // ==================================================

  const [categoryList, setCategoryList] = useState<
    CategoryOption[]
  >(categories);

  const [isAddingCategory, setIsAddingCategory] =
    useState(false);

  const [newCategoryName, setNewCategoryName] =
    useState("");

  const [isSavingCategory, setIsSavingCategory] =
    useState(false);

  // Parent se naye categories prop aayein to sync karo
  useEffect(() => {
    setCategoryList(categories);
  }, [categories]);

  // ==================================================
  // LOAD / RESET PRODUCT FORM
  // ==================================================

  useEffect(() => {
    if (initialProduct) {
      // ----------------------------------------------
      // EDIT PRODUCT
      // ----------------------------------------------

      setName(initialProduct.name);

      setSku(initialProduct.sku);

      const initialCategoryId =
        (initialProduct as any).categoryId
          ?.toString?.() ||
        (initialProduct as any).categoryId ||
        "";

      setCategoryId(
        initialCategoryId ||
          categoryList[0]?.id ||
          ""
      );

      setCostPrice(
        initialProduct.costPrice?.toString() || ""
      );

      setSellingPrice(
        initialProduct.sellingPrice?.toString() ||
          ""
      );

      setStock(
        initialProduct.stock?.toString() || "0"
      );

      setMinStockAlert(
        initialProduct.minStockAlert?.toString() ||
          "10"
      );

      setUnit(
        initialProduct.unit || "pcs"
      );

      setDescription(
        initialProduct.description || ""
      );
    } else {
      // ----------------------------------------------
      // NEW PRODUCT
      // ----------------------------------------------

      setName("");

      setSku(generateSKU());

      setCategoryId(categoryList[0]?.id || "");

      setCostPrice("");

      setSellingPrice("");

      setStock("20");

      setMinStockAlert("10");

      setUnit("pcs");

      setDescription("");
    }

    setError(null);
    setIsAddingCategory(false);
    setNewCategoryName("");
  }, [
    initialProduct,
    isOpen,
    categories,
  ]);

  // ==================================================
  // PROFIT / MARGIN
  // ==================================================

  const numCost =
    parseFloat(costPrice) || 0;

  const numSell =
    parseFloat(sellingPrice) || 0;

  const profitMarginAmount =
    numSell - numCost;

  const profitMarginPercent =
    numSell > 0
      ? Math.round(
          (profitMarginAmount /
            numSell) *
            100
        )
      : 0;

  // ==================================================
  // GENERATE NEW SKU
  // ==================================================

  const handleGenerateNewSKU = () => {
    if (isSaving) return;

    setSku(generateSKU());
  };

  // ==================================================
  // SAVE NEW CATEGORY (MongoDB)
  // ==================================================

  const handleSaveNewCategory = async () => {
    const trimmed = newCategoryName.trim();

    if (!trimmed) return;

    try {
      setIsSavingCategory(true);
      setError(null);

      const response = await fetch(
        "/api/categories",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            name: trimmed,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.error ||
            data?.message ||
            "Category save nahi ho saki."
        );
        return;
      }

      const newCat: CategoryOption = {
        id:
          data._id?.toString() ||
          data.id?.toString(),
        name: data.name || trimmed,
      };

      setCategoryList((prev) => {
        const already = prev.some(
          (c) => c.id === newCat.id
        );

        return already
          ? prev
          : [...prev, newCat];
      });

      setCategoryId(newCat.id);
      setIsAddingCategory(false);
      setNewCategoryName("");
    } catch (err) {
      console.error(
        "Category API Error:",
        err
      );

      setError(
        "Category save karte waqt masla hua."
      );
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleCancelAddCategory = () => {
    setIsAddingCategory(false);
    setNewCategoryName("");
  };

  // ==================================================
  // SUBMIT
  // ==================================================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    if (isSaving) return;

    setError(null);

    // ==================================================
    // BASIC VALIDATION
    // ==================================================

    if (!name.trim()) {
      setError(
        "Product name is required."
      );
      return;
    }

    if (!sku.trim()) {
      setError(
        "Barcode / SKU is required."
      );
      return;
    }

    if (!categoryId) {
      setError(
        "Please select or add a category."
      );
      return;
    }

    // ==================================================
    // PARSE VALUES
    // ==================================================

    const numCostParsed =
      parseFloat(costPrice);

    const numSellParsed =
      parseFloat(sellingPrice);

    const numStockParsed =
      parseInt(stock);

    const numAlertParsed =
      parseInt(minStockAlert);

    // ==================================================
    // COST PRICE
    // ==================================================

    if (
      Number.isNaN(numCostParsed) ||
      numCostParsed < 0
    ) {
      setError(
        "Please provide a valid Cost Price."
      );
      return;
    }

    // ==================================================
    // SELLING PRICE
    // ==================================================

    if (
      Number.isNaN(numSellParsed) ||
      numSellParsed < 0
    ) {
      setError(
        "Please provide a valid Selling Price."
      );
      return;
    }

    // ==================================================
    // STOCK
    // ==================================================

    if (
      Number.isNaN(numStockParsed) ||
      numStockParsed < 0
    ) {
      setError(
        "Please provide a valid Stock quantity."
      );
      return;
    }

    // ==================================================
    // LOW STOCK ALERT
    // ==================================================

    const finalAlert =
      Number.isNaN(numAlertParsed) ||
      numAlertParsed < 1
        ? 10
        : numAlertParsed;

    // ==================================================
    // PRODUCT DATA — categoryId (ObjectId), category naam nahi
    // ==================================================

    const productData = {
      name: name.trim(),

      sku: sku.trim(),

      categoryId,

      costPrice: numCostParsed,

      sellingPrice: numSellParsed,

      stock: numStockParsed,

      minStockAlert: finalAlert,

      unit,

      description:
        description.trim() || undefined,
    };

    try {
      setIsSaving(true);

      // ==================================================
      // EDIT PRODUCT
      // ==================================================

      if (initialProduct) {
        const productId =
          (initialProduct as any)._id?.toString() ||
          (initialProduct as any).id?.toString();

        if (!productId) {
          setError(
            "Product ID is missing. Cannot update product."
          );
          return;
        }

        const response = await fetch(
          `/api/products/${productId}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              productData
            ),
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          setError(
            data?.error ||
              data?.message ||
              "Failed to update product."
          );

          return;
        }

        console.log(
          "Product updated successfully:",
          data
        );

        onSubmit(data);

        onClose();

        return;
      }

      // ==================================================
      // CREATE PRODUCT
      // ==================================================

      const response = await fetch(
        "/api/products",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            productData
          ),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data?.error ||
            data?.message ||
            "Failed to save product."
        );

        return;
      }

      console.log(
        "Product created successfully:",
        data
      );

      onSubmit(data);

      onClose();
    } catch (error) {
      console.error(
        "Product API Error:",
        error
      );

      setError(
        "Something went wrong while saving the product. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // ==================================================
  // UI
  // ==================================================

  return (
    <Modal
      isOpen={isOpen}
      onClose={
        isSaving
          ? () => {}
          : onClose
      }
      title={
        initialProduct
          ? "Edit Product Details"
          : "Add New Inventory Item"
      }
      subtitle="Item Master, Barcode, Pricing and Stock Levels"
      icon={
        <Package className="w-5 h-5" />
      }
      maxWidth="2xl"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        {/* ==========================================
            ERROR
        ========================================== */}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-xs text-rose-700 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {/* ==========================================
            PRODUCT NAME
        ========================================== */}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Product / Item Name *
          </label>

          <input
            type="text"
            required
            value={name}
            disabled={isSaving}
            onChange={(e) =>
              setName(e.target.value)
            }
            placeholder="e.g. Shan Special Bombay Biryani Masala 50g"
            className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
            autoFocus
          />
        </div>

        {/* ==========================================
            BARCODE + CATEGORY
        ========================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* SKU */}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Barcode / SKU *
              </label>

              <button
                type="button"
                onClick={
                  handleGenerateNewSKU
                }
                disabled={isSaving}
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
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
                disabled={isSaving}
                onChange={(e) =>
                  setSku(
                    e.target.value
                  )
                }
                placeholder="896400010101"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* CATEGORY */}

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700 uppercase">
                Category *
              </label>

              {!isAddingCategory && (
                <button
                  type="button"
                  onClick={() =>
                    setIsAddingCategory(true)
                  }
                  disabled={isSaving}
                  className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>New Category</span>
                </button>
              )}
            </div>

            {!isAddingCategory ? (
              <select
                value={categoryId}
                disabled={isSaving}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value
                  )
                }
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
              >
                <option value="" disabled>
                  {categoryList.length === 0
                    ? "No categories yet — add one"
                    : "Select category"}
                </option>

                {categoryList.map(
                  (c) => (
                    <option
                      key={c.id}
                      value={c.id}
                    >
                      {c.name}
                    </option>
                  )
                )}
              </select>
            ) : (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  autoFocus
                  value={newCategoryName}
                  disabled={isSavingCategory}
                  onChange={(e) =>
                    setNewCategoryName(
                      e.target.value
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSaveNewCategory();
                    }
                  }}
                  placeholder="e.g. Dairy Products"
                  className="flex-1 min-w-0 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                />

                <button
                  type="button"
                  onClick={handleSaveNewCategory}
                  disabled={
                    isSavingCategory ||
                    !newCategoryName.trim()
                  }
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingCategory
                    ? "..."
                    : "Save"}
                </button>

                <button
                  type="button"
                  onClick={handleCancelAddCategory}
                  disabled={isSavingCategory}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ==========================================
            PRICING
        ========================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
          {/* COST */}

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
                disabled={isSaving}
                onChange={(e) =>
                  setCostPrice(
                    e.target.value
                  )
                }
                placeholder="110"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* SELLING */}

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
                disabled={isSaving}
                onChange={(e) =>
                  setSellingPrice(
                    e.target.value
                  )
                }
                placeholder="140"
                className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* PROFIT */}

          <div className="col-span-full pt-1 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />

              Profit per item:
            </span>

            <span
              className={`font-mono ${
                profitMarginAmount >=
                0
                  ? "text-emerald-700 font-bold"
                  : "text-rose-600 font-bold"
              }`}
            >
              {formatPKR(
                profitMarginAmount
              )}{" "}
              (
              {
                profitMarginPercent
              }
              % Margin)
            </span>
          </div>
        </div>

        {/* ==========================================
            STOCK / UNIT / LOW STOCK
        ========================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* STOCK */}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Current Stock *
            </label>

            <input
              type="number"
              min="0"
              required
              value={stock}
              disabled={isSaving}
              onChange={(e) =>
                setStock(
                  e.target.value
                )
              }
              placeholder="50"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* UNIT */}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Unit of Measure
            </label>

            <select
              value={unit}
              disabled={isSaving}
              onChange={(e) =>
                setUnit(
                  e.target.value as ProductUnit
                )
              }
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              <option value="pcs">
                Pieces (pcs)
              </option>

              <option value="pack">
                Pack / Pouch
              </option>

              <option value="bottle">
                Bottle / Pet
              </option>

              <option value="kg">
                Kilogram (kg)
              </option>

              <option value="g">
                Gram (g)
              </option>

              <option value="liter">
                Litre (L)
              </option>

              <option value="box">
                Box / Carton
              </option>

              <option value="dozen">
                Dozen
              </option>
            </select>
          </div>

          {/* LOW STOCK */}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Low Stock Alert
            </label>

            <input
              type="number"
              min="1"
              value={minStockAlert}
              disabled={isSaving}
              onChange={(e) =>
                setMinStockAlert(
                  e.target.value
                )
              }
              placeholder="10"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* ==========================================
            DESCRIPTION
        ========================================== */}

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Description / Supplier (Optional)
          </label>

          <textarea
            rows={2}
            value={description}
            disabled={isSaving}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            placeholder="Item details, distributor name, or shelf location..."
            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* ==========================================
            ACTION BUTTONS
        ========================================== */}

        <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving
              ? initialProduct
                ? "Updating..."
                : "Saving..."
              : initialProduct
              ? "Update Product"
              : "Save to Inventory"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import { useApp } from "@/context/AppContext";
import { Product } from "@/types";
import { formatPKR } from "@/lib/utils";

import { ProductModal } from "./ProductModal";
import { StockAdjustmentModal } from "./StockAdjustmentModal";
import { PrintBarcodeModal } from "./PrintBarcodeModal";

interface CategoryOption {
  id: string; // MongoDB _id
  name: string;
}

export function InventoryView() {
  const { settings } = useApp();

  // =========================================================
  // PRODUCTS
  // =========================================================

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // =========================================================
  // CATEGORIES (ab MongoDB se, products se nahi)
  // =========================================================

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // =========================================================
  // SEARCH / FILTER / SORT
  // =========================================================

  const [searchTerm, setSearchTerm] = useState("");

  // "all" ya category ki MongoDB _id
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");

  const [stockStatusFilter, setStockStatusFilter] = useState<
    "all" | "in_stock" | "low_stock" | "out_of_stock"
  >("all");

  const [sortBy, setSortBy] = useState<
    "name" | "stock_asc" | "stock_desc" | "price_asc" | "price_desc"
  >("name");

  // =========================================================
  // MODALS
  // =========================================================

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] =
    useState<Product | null>(null);

  const [isPrintBarcodeModalOpen, setIsPrintBarcodeModalOpen] =
    useState(false);

  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);

  // =========================================================
  // TOAST
  // =========================================================

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // =========================================================
  // FETCH PRODUCTS FROM MONGODB
  // =========================================================

  const fetchProducts = async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();

      const normalizedProducts: Product[] = data.map((product: any) => ({
        ...product,
        id: product._id?.toString() || product.id,
        categoryId:
          product.categoryId?.toString?.() ||
          product.categoryId ||
          "",
      }));

      setProducts(normalizedProducts);
    } catch (error) {
      console.error("Fetch products error:", error);
      showToast("Failed to load products");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // =========================================================
  // FETCH CATEGORIES FROM MONGODB
  // =========================================================

  const fetchCategories = async () => {
    try {
      setIsCategoriesLoading(true);

      const response = await fetch("/api/categories", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch categories");
      }

      const data = await response.json();

      const normalizedCategories: CategoryOption[] = data.map(
        (category: any) => ({
          id: category._id?.toString() || category.id,
          name: category.name,
        })
      );

      setCategories(normalizedCategories);
    } catch (error) {
      console.error("Fetch categories error:", error);
      showToast("Failed to load categories");
    } finally {
      setIsCategoriesLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // =========================================================
  // CATEGORY ID -> NAME LOOKUP
  // =========================================================

  const categoryNameById = useMemo(() => {
    const map = new Map<string, string>();

    categories.forEach((category) => {
      map.set(category.id, category.name);
    });

    return map;
  }, [categories]);

  const getCategoryName = (categoryId?: string) =>
    (categoryId && categoryNameById.get(categoryId)) ||
    "Uncategorized";

  // =========================================================
  // FILTER + SORT
  // =========================================================

  const filteredProducts = useMemo(() => {
    return [...products]
      .filter((product) => {
        const search = searchTerm.toLowerCase().trim();

        const matchSearch =
          search === "" ||
          product.name.toLowerCase().includes(search) ||
          product.sku.toLowerCase().includes(search);

        const matchCategory =
          selectedCategoryId === "all" ||
          (product as any).categoryId === selectedCategoryId;

        let matchStatus = true;

        if (stockStatusFilter === "in_stock") {
          matchStatus = product.stock > product.minStockAlert;
        }

        if (stockStatusFilter === "low_stock") {
          matchStatus =
            product.stock > 0 &&
            product.stock <= product.minStockAlert;
        }

        if (stockStatusFilter === "out_of_stock") {
          matchStatus = product.stock <= 0;
        }

        return matchSearch && matchCategory && matchStatus;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }

        if (sortBy === "stock_asc") {
          return a.stock - b.stock;
        }

        if (sortBy === "stock_desc") {
          return b.stock - a.stock;
        }

        if (sortBy === "price_asc") {
          return a.sellingPrice - b.sellingPrice;
        }

        if (sortBy === "price_desc") {
          return b.sellingPrice - a.sellingPrice;
        }

        return 0;
      });
  }, [
    products,
    searchTerm,
    selectedCategoryId,
    stockStatusFilter,
    sortBy,
  ]);

  // =========================================================
  // ADD / UPDATE PRODUCT
  // =========================================================

  const handleProductSubmit = async (productData: any) => {
    try {
      // =====================================================
      // UPDATE PRODUCT
      // =====================================================

      if (editingProduct) {
        const response = await fetch(
          `/api/products/${editingProduct.id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(productData),
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.error || "Failed to update product"
          );
        }

        const updatedProduct = await response.json();

        const normalizedProduct = {
          ...updatedProduct,
          id:
            updatedProduct._id?.toString() ||
            updatedProduct.id,
          categoryId:
            updatedProduct.categoryId?.toString?.() ||
            updatedProduct.categoryId ||
            "",
        };

        setProducts((previousProducts) =>
          previousProducts.map((product) =>
            product.id === editingProduct.id
              ? normalizedProduct
              : product
          )
        );

        showToast("Product updated successfully.");

        setIsProductModalOpen(false);
        setEditingProduct(null);

        return;
      }

      // =====================================================
      // CREATE PRODUCT
      // =====================================================

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.error || "Failed to create product"
        );
      }

      const createdProduct = await response.json();

      const normalizedProduct = {
        ...createdProduct,
        id:
          createdProduct._id?.toString() ||
          createdProduct.id,
        categoryId:
          createdProduct.categoryId?.toString?.() ||
          createdProduct.categoryId ||
          "",
      };

      setProducts((previousProducts) => [
        normalizedProduct,
        ...previousProducts,
      ]);

      showToast("New product added to inventory.");

      setIsProductModalOpen(false);
      setEditingProduct(null);
    } catch (error) {
      console.error("Product save error:", error);

      showToast(
        error instanceof Error
          ? error.message
          : "Request failed"
      );
    }
  };

  // =========================================================
  // DELETE PRODUCT
  // =========================================================

  const handleDelete = async (product: Product) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${product.name}" from inventory?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `/api/products/${product.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.error || "Failed to delete product"
        );
      }

      setProducts((previousProducts) =>
        previousProducts.filter(
          (item) => item.id !== product.id
        )
      );

      showToast("Product deleted from inventory.");
    } catch (error) {
      console.error("Delete product error:", error);

      showToast(
        error instanceof Error
          ? error.message
          : "Request failed"
      );
    }
  };

  // =========================================================
  // STOCK ADJUSTMENT
  // =========================================================

  const handleStockAdjustment = async (
    productId: string,
    delta: number,
    reason: string
  ) => {
    try {
      const response = await fetch(
        `/api/products/${productId}/stock`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            delta,
            reason,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        throw new Error(
          errorData?.error || "Failed to update stock"
        );
      }

      const updatedProduct = await response.json();

      const normalizedProduct = {
        ...updatedProduct,
        id:
          updatedProduct._id?.toString() ||
          updatedProduct.id,
        categoryId:
          updatedProduct.categoryId?.toString?.() ||
          updatedProduct.categoryId ||
          "",
      };

      setProducts((previousProducts) =>
        previousProducts.map((product) =>
          product.id === productId
            ? normalizedProduct
            : product
        )
      );

      showToast(
        `Stock updated (${
          delta > 0 ? `+${delta}` : delta
        })`
      );

      setIsAdjustModalOpen(false);
      setAdjustingProduct(null);
    } catch (error) {
      console.error("Stock adjustment error:", error);

      showToast(
        error instanceof Error
          ? error.message
          : "Request failed"
      );
    }
  };

  // =========================================================
  // EXPORT CSV
  // =========================================================

  const handleExportCSV = () => {
    const headers = [
      "Product Name",
      "SKU / Barcode",
      "Category",
      "Cost Price (PKR)",
      "Selling Price (PKR)",
      "Current Stock",
      "Unit",
      "Min Alert",
    ];

    const rows = filteredProducts.map((product) => [
      `"${product.name.replace(/"/g, '""')}"`,
      `"${product.sku}"`,
      `"${getCategoryName((product as any).categoryId)}"`,
      product.costPrice,
      product.sellingPrice,
      product.stock,
      product.unit,
      product.minStockAlert,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download = `inventory_stock_list_${
      new Date().toISOString().split("T")[0]
    }.csv`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    showToast("CSV inventory exported!");
  };

  // =========================================================
  // OPEN ADD PRODUCT
  // =========================================================

  const handleAddProduct = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  // =========================================================
  // OPEN EDIT PRODUCT
  // =========================================================

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  // =========================================================
  // LOADING STATE
  // =========================================================

  if (isLoading) {
    return (
      <div className="min-h-full p-4 lg:p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin" />

            <p className="text-sm font-semibold text-slate-600">
              Loading inventory...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-emerald-600" />

            Inventory & Stock Master
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manage products, barcodes, buying/selling prices,
            and stock reorders.
          </p>
        </div>

        <div className="flex items-center space-x-2">

          {/* Refresh */}

          <button
            onClick={() => {
              fetchProducts(true);
              fetchCategories();
            }}
            disabled={isRefreshing}
            title="Refresh inventory"
            className="flex items-center justify-center w-9 h-9 bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-200 shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
          </button>

          {/* Export */}

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />

            <span>Export CSV</span>
          </button>

          {/* Add */}

          <button
            onClick={handleAddProduct}
            className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />

            <span>Add Product</span>
          </button>

        </div>
      </div>

      {/* =====================================================
          FILTERS
      ===================================================== */}

      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">

          {/* Search */}

          <div className="sm:col-span-5 relative">

            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

            <input
              type="text"
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
              placeholder="Search by product name or barcode SKU..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />

          </div>

          {/* Category */}

          <div className="sm:col-span-3">

            <select
              value={selectedCategoryId}
              onChange={(event) =>
                setSelectedCategoryId(event.target.value)
              }
              disabled={isCategoriesLoading}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
            >

              <option value="all">
                All Categories ({products.length})
              </option>

              {categories.map((category) => (
                <option
                  key={category.id}
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}

            </select>

          </div>

          {/* Stock */}

          <div className="sm:col-span-2">

            <select
              value={stockStatusFilter}
              onChange={(event) =>
                setStockStatusFilter(
                  event.target.value as typeof stockStatusFilter
                )
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >

              <option value="all">
                All Stock Status
              </option>

              <option value="in_stock">
                In Stock
              </option>

              <option value="low_stock">
                ⚠️ Low Stock Alert
              </option>

              <option value="out_of_stock">
                ❌ Out of Stock
              </option>

            </select>

          </div>

          {/* Sort */}

          <div className="sm:col-span-2">

            <select
              value={sortBy}
              onChange={(event) =>
                setSortBy(
                  event.target.value as typeof sortBy
                )
              }
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >

              <option value="name">
                Sort by Name
              </option>

              <option value="stock_asc">
                Stock: Low to High
              </option>

              <option value="stock_desc">
                Stock: High to Low
              </option>

              <option value="price_asc">
                Price: Low to High
              </option>

              <option value="price_desc">
                Price: High to Low
              </option>

            </select>

          </div>

        </div>

        {/* Result */}

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">

          <span>
            Showing{" "}
            <strong className="text-slate-800">
              {filteredProducts.length}
            </strong>{" "}
            of {products.length} products
          </span>

          {stockStatusFilter === "low_stock" && (
            <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Low Stock Reorder View
            </span>
          )}

        </div>

      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full text-left text-xs sm:text-sm">

            <thead className="bg-slate-50/80 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">

              <tr>

                <th className="px-4 py-3.5">
                  Product & SKU
                </th>

                <th className="px-4 py-3.5">
                  Category
                </th>

                <th className="px-4 py-3.5 text-right">
                  Cost Price
                </th>

                <th className="px-4 py-3.5 text-right">
                  Selling Price
                </th>

                <th className="px-4 py-3.5 text-center">
                  Margin
                </th>

                <th className="px-4 py-3.5 text-center">
                  Current Stock
                </th>

                <th className="px-4 py-3.5 text-right">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">

              {filteredProducts.length > 0 ? (

                filteredProducts.map((product) => {

                  const isOutOfStock =
                    product.stock <= 0;

                  const isLowStock =
                    product.stock > 0 &&
                    product.stock <=
                      product.minStockAlert;

                  const profitAmt =
                    product.sellingPrice -
                    product.costPrice;

                  const profitPct =
                    product.sellingPrice > 0
                      ? Math.round(
                          (profitAmt /
                            product.sellingPrice) *
                            100
                        )
                      : 0;

                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >

                      {/* Product */}

                      <td className="px-4 py-3">

                        <div className="flex items-center space-x-3">

                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {product.unit}
                          </div>

                          <div>

                            <p className="font-bold text-slate-900 leading-snug">
                              {product.name}
                            </p>

                            <div className="flex items-center space-x-1.5 font-mono text-xs text-slate-400 mt-0.5">

                              <Barcode className="w-3.5 h-3.5 text-slate-400" />

                              <span>
                                {product.sku}
                              </span>

                            </div>

                          </div>

                        </div>

                      </td>

                      {/* Category */}

                      <td className="px-4 py-3">

                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          {getCategoryName(
                            (product as any).categoryId
                          )}
                        </span>

                      </td>

                      {/* Cost */}

                      <td className="px-4 py-3 text-right font-mono font-semibold text-slate-600">
                        {formatPKR(product.costPrice)}
                      </td>

                      {/* Selling */}

                      <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900">
                        {formatPKR(product.sellingPrice)}
                      </td>

                      {/* Margin */}

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

                      {/* Stock */}

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
                              {isLowStock && (
                                <AlertTriangle className="w-3 h-3 text-amber-600" />
                              )}

                              <span>
                                {product.stock}{" "}
                                {product.unit}
                              </span>
                            </>
                          )}

                        </span>

                      </td>

                      {/* Actions */}

                      <td className="px-4 py-3 text-right">

                        <div className="flex items-center justify-end space-x-1">

                          {/* Stock */}

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

                          {/* Barcode */}

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

                          {/* Edit */}

                          <button
                            onClick={() =>
                              handleEditProduct(product)
                            }
                            title="Edit Product"
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete */}

                          <button
                            onClick={() =>
                              handleDelete(product)
                            }
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

                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-400"
                  >

                    <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />

                    <p className="font-bold text-slate-700 text-sm">
                      No matching inventory items
                    </p>

                    <p className="text-xs text-slate-400 mt-0.5">
                      Try searching or clearing filters.
                    </p>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          PRODUCT MODAL
      ===================================================== */}

      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        initialProduct={editingProduct}
        categories={categories}
        onSubmit={handleProductSubmit}
      />

      {/* =====================================================
          STOCK MODAL
      ===================================================== */}

      <StockAdjustmentModal
        isOpen={isAdjustModalOpen}
        onClose={() => {
          setIsAdjustModalOpen(false);
          setAdjustingProduct(null);
        }}
        product={adjustingProduct}
        onAdjust={handleStockAdjustment}
      />

      {/* =====================================================
          PRINT BARCODE
      ===================================================== */}

      <PrintBarcodeModal
        isOpen={isPrintBarcodeModalOpen}
        onClose={() =>
          setIsPrintBarcodeModalOpen(false)
        }
        product={barcodeProduct}
        settings={settings}
      />

      {/* =====================================================
          TOAST
      ===================================================== */}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold border border-slate-700 animate-in slide-in-from-bottom-2">

          <CheckCircle2 className="w-4 h-4 text-emerald-400" />

          <span>{toastMessage}</span>

        </div>
      )}

    </div>
  );
}
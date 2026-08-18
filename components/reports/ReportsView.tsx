"use client";

import React, { useState, useMemo } from "react";
import { 
  BarChart3, 
  Calendar, 
  Download, 
  Printer, 
  Receipt, 
  RotateCcw, 
  TrendingUp, 
  AlertTriangle,
  Search,
  CheckCircle2,
  DollarSign,
  PackageCheck
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Sale, Product } from "@/types";
import { formatPKR, formatDate, formatTime } from "@/lib/utils";
import { ThermalReceipt } from "@/components/pos/ThermalReceipt";

export function ReportsView() {
  const { sales, products, settings, voidSale } = useApp();

  const [dateFilter, setDateFilter] = useState<"today" | "yesterday" | "last7" | "this_month" | "all">("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"sales" | "reorder">("sales");
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter Sales based on date
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const currentYearMonth = todayStr.substring(0, 7); // "YYYY-MM"

    return sales.filter((s) => {
      const saleDate = new Date(s.createdAt);
      const saleDateStr = s.createdAt.split("T")[0];

      let matchDate = true;
      if (dateFilter === "today") matchDate = saleDateStr === todayStr;
      if (dateFilter === "yesterday") matchDate = saleDateStr === yesterdayStr;
      if (dateFilter === "last7") matchDate = saleDate >= sevenDaysAgo;
      if (dateFilter === "this_month") matchDate = saleDateStr.startsWith(currentYearMonth);

      const matchSearch =
        searchTerm === "" ||
        s.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.customerName && s.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.customerPhone && s.customerPhone.includes(searchTerm));

      return matchDate && matchSearch;
    });
  }, [sales, dateFilter, searchTerm]);

  // Aggregated financials for selected period
  const financialSummary = useMemo(() => {
    const completed = filteredSales.filter((s) => s.status === "completed");

    const totalRevenue = completed.reduce((sum, s) => sum + s.grandTotal, 0);

    const totalCost = completed.reduce((sum, s) => {
      const saleCost = s.items.reduce((iSum, i) => iSum + i.costPrice * i.quantity, 0);
      return sum + saleCost;
    }, 0);

    const grossProfit = Math.max(0, totalRevenue - totalCost);
    const profitMarginPct = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 100) : 0;
    const avgOrderValue = completed.length > 0 ? Math.round(totalRevenue / completed.length) : 0;

    return {
      totalRevenue,
      totalCost,
      grossProfit,
      profitMarginPct,
      avgOrderValue,
      orderCount: completed.length,
    };
  }, [filteredSales]);

  // Low stock reorder list
  const reorderList = useMemo(() => {
    return products
      .filter((p) => p.stock <= p.minStockAlert)
      .map((p) => ({
        ...p,
        suggestedReorder: Math.max(20, (p.minStockAlert * 3) - p.stock),
        estimatedCost: Math.max(20, (p.minStockAlert * 3) - p.stock) * p.costPrice,
      }));
  }, [products]);

  // Export Sales CSV
  const handleExportSalesCSV = () => {
    const headers = [
      "Invoice #",
      "Date",
      "Time",
      "Customer",
      "Payment Mode",
      "Items Count",
      "Subtotal (PKR)",
      "Discount (PKR)",
      "Tax (PKR)",
      "Grand Total (PKR)",
      "Status",
    ];

    const rows = filteredSales.map((s) => [
      `"${s.invoiceNo}"`,
      `"${formatDate(s.createdAt)}"`,
      `"${formatTime(s.createdAt)}"`,
      `"${s.customerName || "Walk-in"}"`,
      `"${s.paymentMethod}"`,
      s.items.length,
      s.subtotal,
      s.discountTotal,
      s.taxAmount,
      s.grandTotal,
      s.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sales_report_${dateFilter}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("Sales log exported to CSV.");
  };

  const handleVoidSale = (sale: Sale) => {
    if (confirm(`Are you sure you want to void / refund Invoice ${sale.invoiceNo}? This will restock all items back into inventory and reverse any Khata debit.`)) {
      voidSale(sale.id);
      showToast(`Invoice ${sale.invoiceNo} refunded and restocked.`);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-emerald-600" />
            Reports, Analytics &amp; Audit Log
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Detailed sales registers, gross profit breakdown, low stock replenishment, and transaction refunds.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-xl">
          <button
            onClick={() => setActiveTab("sales")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "sales"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sales Log &amp; Profits
          </button>
          <button
            onClick={() => setActiveTab("reorder")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "reorder"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Reorder Sheet ({reorderList.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "sales" ? (
        <>
          {/* Financial KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Revenue
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
                {formatPKR(financialSummary.totalRevenue)}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                {financialSummary.orderCount} completed bills
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Cost of Goods (COGS)
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-slate-600 font-mono mt-1">
                {formatPKR(financialSummary.totalCost)}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                Inventory wholesale cost
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Net Gross Profit
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-700 font-mono mt-1">
                {formatPKR(financialSummary.grossProfit)}
              </h3>
              <span className="text-[11px] text-emerald-600 font-bold mt-0.5 block">
                {financialSummary.profitMarginPct}% Gross Margin
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Avg. Basket Size (AOV)
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-indigo-700 font-mono mt-1">
                {formatPKR(financialSummary.avgOrderValue)}
              </h3>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5 block">
                Per invoice average
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {/* Date Pills */}
              {(
                [
                  ["all", "All Time"],
                  ["today", "Today"],
                  ["yesterday", "Yesterday"],
                  ["last7", "Last 7 Days"],
                  ["this_month", "This Month"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setDateFilter(val)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    dateFilter === val
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter by invoice # or customer..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleExportSalesCSV}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Sales Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5">Invoice #</th>
                    <th className="px-4 py-3.5">Date &amp; Time</th>
                    <th className="px-4 py-3.5">Customer &amp; Mode</th>
                    <th className="px-4 py-3.5">Items Summary</th>
                    <th className="px-4 py-3.5 text-right">Revenue</th>
                    <th className="px-4 py-3.5 text-right">Profit</th>
                    <th className="px-4 py-3.5 text-center">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredSales.length > 0 ? (
                    filteredSales.map((sale) => {
                      const isRefunded = sale.status === "refunded";
                      const cost = sale.items.reduce((s, i) => s + i.costPrice * i.quantity, 0);
                      const profit = Math.max(0, sale.grandTotal - cost);

                      return (
                        <tr
                          key={sale.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isRefunded ? "bg-rose-50/40 text-slate-400" : ""
                          }`}
                        >
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            {sale.invoiceNo}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                            {formatDate(sale.createdAt)} {formatTime(sale.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-800">{sale.customerName || "Walk-in"}</p>
                            <span className="inline-block text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              {sale.paymentMethod}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600 truncate max-w-xs">
                            {sale.items.map((i) => `${i.productName} (${i.quantity})`).join(", ")}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900">
                            {formatPKR(sale.grandTotal)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                            {isRefunded ? "-" : formatPKR(profit)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isRefunded
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {isRefunded ? "Refunded" : "Completed"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Print Receipt */}
                              <button
                                onClick={() => setSelectedReceiptSale(sale)}
                                title="View & Print Thermal Receipt"
                                className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                              >
                                <Receipt className="w-4 h-4" />
                              </button>

                              {/* Void / Refund Sale */}
                              {!isRefunded && (
                                <button
                                  onClick={() => handleVoidSale(sale)}
                                  title="Void Sale & Restock Products"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                        <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                        <p className="font-bold text-slate-700 text-sm">No sales records found for this period</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Reorder Sheet Tab */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Low Stock Wholesale Reorder Sheet
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Items currently at or below minimum threshold with estimated reorder amounts.
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all self-start sm:self-auto"
            >
              <Printer className="w-4 h-4" />
              <span>Print Reorder Sheet</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Item Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Current Stock</th>
                  <th className="px-4 py-3 text-center">Alert Level</th>
                  <th className="px-4 py-3 text-center">Suggested Order</th>
                  <th className="px-4 py-3 text-right">Cost (PKR)</th>
                  <th className="px-4 py-3 text-right">Total Est. Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {reorderList.length > 0 ? (
                  reorderList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 font-bold text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-slate-600">{item.category}</td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-rose-600">
                        {item.stock} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-500">
                        {item.minStockAlert} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-emerald-700 bg-emerald-50/50">
                        {item.suggestedReorder} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {formatPKR(item.costPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-slate-900">
                        {formatPKR(item.estimatedCost)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                      <PackageCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">All items are sufficiently stocked!</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Printable Receipt Modal */}
      {selectedReceiptSale && (
        <ThermalReceipt
          sale={selectedReceiptSale}
          settings={settings}
          onClose={() => setSelectedReceiptSale(null)}
        />
      )}

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

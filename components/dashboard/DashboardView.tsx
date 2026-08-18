"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Users, 
  AlertTriangle, 
  DollarSign, 
  ArrowUpRight, 
  CreditCard, 
  Sparkles, 
  Plus, 
  ChevronRight,
  Receipt,
  Printer,
  BarChart3,
  Percent
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatPKR, formatDate, formatTime } from "@/lib/utils";
import { ThermalReceipt } from "@/components/pos/ThermalReceipt";
import { Sale } from "@/types";

export function DashboardView() {
  const { stats, products, sales, customers, settings } = useApp();
  const [selectedReceiptSale, setSelectedReceiptSale] = useState<Sale | null>(null);

  // Top Selling Products calculation
  const topSellingProducts = React.useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number; unit: string }>();

    sales.forEach((s) => {
      if (s.status === "completed") {
        s.items.forEach((i) => {
          const current = map.get(i.productId) || {
            name: i.productName,
            quantity: 0,
            revenue: 0,
            unit: i.unit,
          };
          map.set(i.productId, {
            name: i.productName,
            quantity: current.quantity + i.quantity,
            revenue: current.revenue + i.total,
            unit: i.unit,
          });
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales]);

  // Payment Breakdown
  const paymentBreakdown = React.useMemo(() => {
    const methods = { cash: 0, jazzcash_easypaisa: 0, card: 0, udhaar: 0 };
    sales.forEach((s) => {
      if (s.status === "completed") {
        if (methods[s.paymentMethod] !== undefined) {
          methods[s.paymentMethod] += s.grandTotal;
        }
      }
    });

    const totalSalesVol = Object.values(methods).reduce((a, b) => a + b, 0);

    return {
      cash: { amount: methods.cash, pct: totalSalesVol > 0 ? Math.round((methods.cash / totalSalesVol) * 100) : 0 },
      jazzcash: { amount: methods.jazzcash_easypaisa, pct: totalSalesVol > 0 ? Math.round((methods.jazzcash_easypaisa / totalSalesVol) * 100) : 0 },
      card: { amount: methods.card, pct: totalSalesVol > 0 ? Math.round((methods.card / totalSalesVol) * 100) : 0 },
      udhaar: { amount: methods.udhaar, pct: totalSalesVol > 0 ? Math.round((methods.udhaar / totalSalesVol) * 100) : 0 },
      totalSalesVol,
    };
  }, [sales]);

  // Low Stock Items list
  const lowStockItems = React.useMemo(() => {
    return products
      .filter((p) => p.stock <= p.minStockAlert)
      .sort((a, b) => a.stock - b.stock)
      .slice(0, 5);
  }, [products]);

  // Recent 5 Transactions
  const recentSales = React.useMemo(() => {
    return sales.slice(0, 5);
  }, [sales]);

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Top Banner / Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-5 sm:p-7 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              Retail Dashboard
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            {settings.storeName}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Live overview of store revenue, Khata receivables, inventory valuation, and stock alerts.
          </p>
        </div>

        {/* Quick Action POS Button */}
        <div className="flex items-center space-x-3">
          <Link
            href="/pos"
            className="flex items-center space-x-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02]"
          >
            <ShoppingCart className="w-5 h-5" />
            <span>Launch POS Terminal</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid (5 core indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Sales */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Today&apos;s Revenue
            </span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 font-mono">
              {formatPKR(stats.todayRevenue)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              <strong className="text-emerald-700">{stats.todaySalesCount} orders</strong> completed today
            </p>
          </div>
        </div>

        {/* Today's Gross Profit */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Today&apos;s Gross Profit
            </span>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-teal-700 font-mono">
              {formatPKR(stats.todayProfit)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Margin:{" "}
              <strong className="text-slate-800">
                {stats.todayRevenue > 0
                  ? `${Math.round((stats.todayProfit / stats.todayRevenue) * 100)}%`
                  : "0%"}
              </strong>
            </p>
          </div>
        </div>

        {/* Total Outstanding Khata */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Khata Udhaar Due
            </span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-rose-600 font-mono">
              {formatPKR(stats.totalUdhaarReceivables)}
            </h3>
            <Link
              href="/khata"
              className="text-xs text-rose-700 font-semibold hover:underline inline-flex items-center gap-1 mt-1"
            >
              <span>View Customer Ledgers</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Total Stock Valuation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">
              Total Stock Valuation
            </span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-black text-slate-900 font-mono">
              {formatPKR(stats.totalInventoryValuation)}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cost: <span className="font-mono font-medium">{formatPKR(stats.totalInventoryCost)}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Left (Top Sellers + Payment Breakdown) | Right (Low Stock + Recent Sales) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Top Selling Products */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                Top-Selling Products (by Revenue)
              </h3>
              <Link
                href="/inventory"
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                View Master
              </Link>
            </div>

            <div className="space-y-3">
              {topSellingProducts.length > 0 ? (
                topSellingProducts.map((prod, idx) => {
                  const maxRev = topSellingProducts[0]?.revenue || 1;
                  const pct = Math.round((prod.revenue / maxRev) * 100);

                  return (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800 truncate max-w-[240px]">
                          {idx + 1}. {prod.name}
                        </span>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-slate-500">{prod.quantity} {prod.unit}</span>
                          <span className="font-black text-slate-900">{formatPKR(prod.revenue)}</span>
                        </div>
                      </div>
                      {/* Visual bar */}
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400 py-4 text-center">No sales completed yet.</p>
              )}
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-extrabold text-slate-900 text-base mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Sales Payment Method Share
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <span className="text-[11px] font-bold text-emerald-800">Cash Counter</span>
                <p className="text-base font-black text-emerald-950 font-mono mt-0.5">
                  {formatPKR(paymentBreakdown.cash.amount)}
                </p>
                <span className="text-[10px] text-emerald-600 font-bold">
                  {paymentBreakdown.cash.pct}% share
                </span>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-center">
                <span className="text-[11px] font-bold text-purple-800">JazzCash / EP</span>
                <p className="text-base font-black text-purple-950 font-mono mt-0.5">
                  {formatPKR(paymentBreakdown.jazzcash.amount)}
                </p>
                <span className="text-[10px] text-purple-600 font-bold">
                  {paymentBreakdown.jazzcash.pct}% share
                </span>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                <span className="text-[11px] font-bold text-blue-800">Card Terminal</span>
                <p className="text-base font-black text-blue-950 font-mono mt-0.5">
                  {formatPKR(paymentBreakdown.card.amount)}
                </p>
                <span className="text-[10px] text-blue-600 font-bold">
                  {paymentBreakdown.card.pct}% share
                </span>
              </div>

              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                <span className="text-[11px] font-bold text-rose-800">Udhaar (Credit)</span>
                <p className="text-base font-black text-rose-950 font-mono mt-0.5">
                  {formatPKR(paymentBreakdown.udhaar.amount)}
                </p>
                <span className="text-[10px] text-rose-600 font-bold">
                  {paymentBreakdown.udhaar.pct}% share
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side (5 cols): Low Stock Alerts & Recent Transactions */}
        <div className="lg:col-span-5 space-y-5">
          {/* Low Stock Alerts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Low Stock Alerts
              </h3>
              <Link
                href="/inventory?filter=low_stock"
                className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 hover:bg-amber-100"
              >
                Reorder List
              </Link>
            </div>

            {lowStockItems.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-800 truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">SKU: {item.sku}</p>
                    </div>
                    <span
                      className={`font-bold font-mono px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                        item.stock <= 0
                          ? "bg-rose-100 text-rose-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.stock <= 0 ? "Out of Stock" : `${item.stock} left (Min: ${item.minStockAlert})`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">
                All inventory items are well-stocked!
              </p>
            )}
          </div>

          {/* Recent Sales Feed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Recent Sales Feed
              </h3>
              <Link
                href="/reports"
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Full Log
              </Link>
            </div>

            {recentSales.length > 0 ? (
              <div className="divide-y divide-slate-100 text-xs">
                {recentSales.map((sale) => (
                  <div
                    key={sale.id}
                    onClick={() => setSelectedReceiptSale(sale)}
                    className="py-2.5 flex items-center justify-between hover:bg-slate-50/80 px-1 rounded-lg cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-800 font-mono">
                          {sale.invoiceNo}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase font-semibold">
                          {sale.paymentMethod}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {sale.customerName || "Walk-in"} • {formatTime(sale.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-slate-900 font-mono text-sm">
                        {formatPKR(sale.grandTotal)}
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        {sale.items.length} items
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-4 text-center">No sales recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Printable Receipt Modal if clicked */}
      {selectedReceiptSale && (
        <ThermalReceipt
          sale={selectedReceiptSale}
          settings={settings}
          onClose={() => setSelectedReceiptSale(null)}
        />
      )}
    </div>
  );
}

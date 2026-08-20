"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  FileText,
  TrendingUp,
  TrendingDown,
  Wallet,
  Package,
  Users,
  Truck,
  Loader2,
  Save,
  Printer,
  Calendar,
} from "lucide-react";
import { formatPKR } from "@/lib/utils";

type ReportType = "daily" | "monthly" | "annual";

interface ReportTotals {
  revenue: number;
  costOfInventorySold: number;
  grossProfit: number;
  employeePayments: number;
  supplierPayments: number;
  otherExpenses: number;
  totalExpenses: number;
  netProfit: number;
  currentInventoryValue: number;
  totalSalesCount: number;
}

interface ReportData {
  type: ReportType;
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  totals: ReportTotals;
  generatedAt: string;
}

function todayISO() {
  return new Date().toISOString().split("T")[0];
}
function thisMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function thisYearISO() {
  return String(new Date().getFullYear());
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportType>("daily");
  const [dailyDate, setDailyDate] = useState(todayISO());
  const [monthlyDate, setMonthlyDate] = useState(thisMonthISO());
  const [annualDate, setAnnualDate] = useState(thisYearISO());

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const currentDateParam =
    activeTab === "daily" ? dailyDate : activeTab === "monthly" ? monthlyDate : annualDate;

  const loadReport = useCallback(async (type: ReportType, date: string) => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`/api/reports?type=${type}&date=${date}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setReport(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to load report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport(activeTab, currentDateParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentDateParam]);

  const handleSaveSnapshot = async () => {
    try {
      setSaving(true);
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeTab, date: currentDateParam }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      alert("Report saved to archive.");
    } catch (err: any) {
      alert(err.message || "Failed to save report");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => window.print();

  const tabs: { key: ReportType; label: string }[] = [
    { key: "daily", label: "Daily" },
    { key: "monthly", label: "Monthly" },
    { key: "annual", label: "Annual" },
  ];

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto bg-slate-950 text-slate-100 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-400" />
            Financial Reports & Balance Sheet
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Daily, monthly, and annual profit &amp; loss summaries.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveSnapshot}
            disabled={saving || loading || !report}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-emerald-400" /> {saving ? "Saving..." : "Save to Archive"}
          </button>
          <button
            onClick={handlePrint}
            disabled={loading || !report}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition disabled:opacity-50"
          >
            <Printer className="w-4 h-4" /> Print / Export
          </button>
        </div>
      </div>

      {/* Tabs + Date Picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
        <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                activeTab === t.key
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          {activeTab === "daily" && (
            <input
              type="date"
              value={dailyDate}
              onChange={(e) => setDailyDate(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none"
            />
          )}
          {activeTab === "monthly" && (
            <input
              type="month"
              value={monthlyDate}
              onChange={(e) => setMonthlyDate(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none"
            />
          )}
          {activeTab === "annual" && (
            <input
              type="number"
              value={annualDate}
              onChange={(e) => setAnnualDate(e.target.value)}
              className="bg-transparent text-sm text-white w-20 focus:outline-none"
            />
          )}
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Generating report...
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Print header */}
          <div className="hidden print:block text-center mb-4">
            <h2 className="text-xl font-bold">Financial Report — {report.periodLabel}</h2>
            <p className="text-xs text-slate-500">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
          </div>

          <div className="text-center print:hidden">
            <span className="text-xs text-slate-500 uppercase tracking-wide">
              {activeTab} report for
            </span>
            <h2 className="text-xl font-bold text-white">{report.periodLabel}</h2>
          </div>

          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="Total Revenue"
              value={formatPKR(report.totals.revenue)}
              color="text-emerald-400"
              sub={`${report.totals.totalSalesCount} sales`}
            />
            <SummaryCard
              icon={<TrendingDown className="w-5 h-5" />}
              label="Total Expenses"
              value={formatPKR(report.totals.totalExpenses)}
              color="text-rose-400"
            />
            <SummaryCard
              icon={<Wallet className="w-5 h-5" />}
              label="Net Profit"
              value={formatPKR(report.totals.netProfit)}
              color={report.totals.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}
            />
            <SummaryCard
              icon={<Package className="w-5 h-5" />}
              label="Current Inventory Value"
              value={formatPKR(report.totals.currentInventoryValue)}
              color="text-amber-400"
            />
          </div>

          {/* Detailed Balance Sheet Breakdown */}
          <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-1">
            <h3 className="font-bold text-slate-200 text-lg mb-3">Income Statement</h3>

            <ReportRow label="Revenue (Total Sales)" value={report.totals.revenue} positive />
            <ReportRow
              label="Cost of Inventory Sold (COGS)"
              value={-report.totals.costOfInventorySold}
            />
            <ReportRow
              label="Gross Profit"
              value={report.totals.grossProfit}
              bold
              divider
            />

            <div className="h-2" />

            <ReportRow
              label={
                <span className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-500" /> Employee Salary Payments
                </span>
              }
              value={-report.totals.employeePayments}
            />
            <ReportRow label="Other Expenses" value={-report.totals.otherExpenses} />
            <ReportRow label="Net Profit" value={report.totals.netProfit} bold divider highlight />

            <div className="h-4" />
            <h3 className="font-bold text-slate-200 text-lg mb-1">Cash Flow (Reference)</h3>
            <ReportRow
              label={
                <span className="flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-slate-500" /> Paid to Suppliers (Inventory Purchases)
                </span>
              }
              value={-report.totals.supplierPayments}
            />
            <p className="text-[11px] text-slate-500 pt-2">
              Supplier payments reflect actual cash paid out for inventory during this period.
              This is tracked separately from Net Profit above to avoid double-counting inventory
              cost already captured in COGS.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  sub?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
      <div className={`flex items-center gap-2 text-xs text-slate-400 ${color}`}>
        {icon}
        <span className="text-slate-400">{label}</span>
      </div>
      <div className={`text-xl font-bold mt-2 font-mono ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function ReportRow({
  label,
  value,
  bold,
  positive,
  divider,
  highlight,
}: {
  label: React.ReactNode;
  value: number;
  bold?: boolean;
  positive?: boolean;
  divider?: boolean;
  highlight?: boolean;
}) {
  const isNegative = value < 0;
  return (
    <div
      className={`flex items-center justify-between py-2 text-sm ${
        divider ? "border-t border-slate-800 mt-1 pt-3" : ""
      } ${highlight ? "bg-emerald-500/5 -mx-2 px-2 rounded-lg" : ""}`}
    >
      <span className={`${bold ? "font-bold text-white" : "text-slate-300"}`}>{label}</span>
      <span
        className={`font-mono ${bold ? "font-bold" : ""} ${
          positive || (!isNegative && bold)
            ? "text-emerald-400"
            : isNegative
            ? "text-rose-400"
            : "text-slate-200"
        }`}
      >
        {isNegative ? `(${formatPKR(Math.abs(value))})` : formatPKR(value)}
      </span>
    </div>
  );
}
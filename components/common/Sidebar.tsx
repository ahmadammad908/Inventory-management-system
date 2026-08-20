"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  X,
  Store,
  Wallet,        // Added for Expenses
  UserCheck,     // Added for Employees & Salaries
  FileText,      // Added for Financial Reports
  ScanLine,      // Added for Barcode Manager
  Truck          // Added for Suppliers & Vendors
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { formatPKR } from "@/lib/utils";

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { stats, settings, cart } = useApp();

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      name: "POS & Billing",
      href: "/pos",
      icon: ShoppingCart,
      badge: cart.length > 0 ? `${cart.length} in cart` : undefined,
      badgeColor: "bg-emerald-600 text-white",
      highlight: true,
    },
    {
      name: "Inventory & Barcode",
      href: "/inventory",
      icon: Package,
      badge: stats.totalLowStockCount > 0 ? `${stats.totalLowStockCount} low` : undefined,
      badgeColor: "bg-amber-100 text-amber-800 border border-amber-300",
    },
    {
      name: "Suppliers & Vendors",
      href: "/suppliers",
      icon: Truck,
    },
    {
      name: "Employee Salaries",
      href: "/employees",
      icon: UserCheck,
    },
    {
      name: "Expense Tracker",
      href: "/expenses",
      icon: Wallet,
    },
    {
      name: "Financial Reports",
      href: "/report",
      icon: FileText,
    },
    {
      name: "Settings & Backup",
      href: "/settings",
      icon: Settings,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-40 h-screen w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out print:hidden ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Header & Navigation */}
        <div className="flex flex-col min-h-0 flex-1">
          {/* Header */}
          <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800 shrink-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-white text-sm tracking-wide leading-none truncate">
                  RETAIL PRO
                </span>
                <span className="text-[10px] text-emerald-400 font-mono font-medium leading-none mt-1 whitespace-nowrap">
                  PKR Edition v1.0
                </span>
              </div>
            </div>
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 shrink-0 flex items-center justify-center"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onCloseMobile}
                  className={`group flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 whitespace-nowrap ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                      : "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <Icon
                      className={`w-5 h-5 shrink-0 transition-transform duration-150 group-hover:scale-110 ${
                        isActive ? "text-white" : "text-slate-400 group-hover:text-emerald-400"
                      }`}
                    />
                    <span className="truncate leading-none">{item.name}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-md shrink-0 whitespace-nowrap leading-none ${
                        item.badgeColor || "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Store Snapshot */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 shrink-0">
          <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700/50 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400 whitespace-nowrap">
              <span>Today&apos;s Sales:</span>
              <span className="font-bold text-emerald-400 font-mono">
                {formatPKR(stats.todayRevenue)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 whitespace-nowrap">
              <span>Khata Receivables:</span>
              <span className="font-bold text-rose-400 font-mono">
                {formatPKR(stats.totalUdhaarReceivables)}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 whitespace-nowrap">
            <span className="truncate max-w-[120px]">{settings.city}, Pakistan</span>
            <span className="font-mono text-emerald-500 font-medium shrink-0">● LocalStorage</span>
          </div>
        </div>
      </aside>
    </>
  );
}
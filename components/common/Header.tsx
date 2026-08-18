"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShoppingCart, 
  Store, 
  AlertTriangle, 
  Download, 
  Clock, 
  Menu, 
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { downloadBackupFile } from "@/lib/storage/storage-manager";

export function Header({ onMobileMenuToggle }: { onMobileMenuToggle?: () => void }) {
  const { settings, stats, seedData, cart } = useApp();
  const pathname = usePathname();
  const [timeStr, setTimeStr] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString("en-GB", {
          weekday: "short",
          day: "numeric",
          month: "short",
        }) + " • " +
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSeed = () => {
    if (confirm("Populate or reload sample Pakistani retail inventory data? This will add realistic items, prices, and sample transactions.")) {
      seedData(true);
      showNotification("Sample data loaded successfully!");
    }
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleBackup = () => {
    downloadBackupFile();
    showNotification("Backup JSON downloaded!");
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs print:hidden">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16">
        {/* Left Side: Mobile Menu + Store Title */}
        <div className="flex items-center space-x-3 min-w-0">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none shrink-0"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-black text-lg shadow-sm shadow-emerald-500/20 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-slate-900 text-base lg:text-lg leading-none tracking-tight truncate">
                  {settings.storeName}
                </h1>
                <span className="hidden sm:inline-flex shrink-0 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold tracking-wide uppercase border border-emerald-200 leading-none">
                  POS & Khata
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block truncate max-w-xs mt-0.5">
                {settings.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Live Date & Time + Low Stock Notice */}
        <div className="hidden xl:flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 bg-slate-100/80 px-3 py-2 rounded-lg border border-slate-200/60 whitespace-nowrap leading-none">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>{timeStr}</span>
          </div>

          {stats.totalLowStockCount > 0 && (
            <Link
              href="/inventory?filter=low"
              className="flex items-center space-x-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100/90 border border-amber-200/80 px-3 py-2 rounded-lg transition-colors whitespace-nowrap leading-none"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 animate-pulse shrink-0" />
              <span>{stats.totalLowStockCount} items low in stock</span>
            </Link>
          )}
        </div>

        {/* Right Side: Quick Tools & POS Button */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Seed Sample Data button */}
          <button
            onClick={handleSeed}
            title="Reload Sample Pakistani Store Data (Shan, Tapal, Olpers, etc.)"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all shadow-xs whitespace-nowrap leading-none"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Seed Sample Data</span>
          </button>

          {/* Backup Download button */}
          <button
            onClick={handleBackup}
            title="Download JSON Backup"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/80 shrink-0 flex items-center justify-center"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* POS Quick Button */}
          <Link
            href="/pos"
            className={`relative inline-flex items-center space-x-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all whitespace-nowrap leading-none ${
              pathname === "/pos"
                ? "bg-slate-900 text-white shadow-slate-900/20 ring-2 ring-emerald-500"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:scale-[1.02]"
            }`}
          >
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="font-extrabold tracking-tight">Open POS</span>
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white">
                {cart.length}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="absolute top-18 right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-medium border border-slate-700 animate-in slide-in-from-top-2 whitespace-nowrap">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}
    </header>
  );
}
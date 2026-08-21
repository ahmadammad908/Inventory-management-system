"use client";

import React, { useState, useRef } from "react";
import { 
  Settings, 
  Store, 
  Database, 
  Download, 
  Upload, 
  RotateCcw, 
  Sparkles, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  Receipt,
  FileText
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { downloadBackupFile } from "@/lib/storage/storage-manager";
import { StoreSettings } from "@/types";

export function SettingsView() {
  const { settings, updateSettings, seedData, restoreData, resetData } = useApp();

  const [formData, setFormData] = useState<StoreSettings>(settings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleChange = (field: keyof StoreSettings, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await updateSettings(formData);
    if (ok) {
      showToast("Store settings saved successfully!");
    } else {
      alert("Failed to save settings. Please try again.");
    }
  };

  const handleDownloadBackup = async () => {
    try {
      await downloadBackupFile();
      showToast("Backup JSON file downloaded.");
    } catch (err) {
      alert("Failed to download backup. Please try again.");
    }
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const jsonContent = event.target?.result as string;
      if (jsonContent) {
        const result = await restoreData(jsonContent);
        if (result.success) {
          showToast("Data restored successfully!");
        } else {
          alert(`Restore failed: ${result.message}`);
        }
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSeed = async () => {
    if (confirm("Load full sample Pakistani retail inventory (Shan, Tapal, Olper's, Rooh Afza, Dalda, etc.) and sample customers?")) {
      const ok = await seedData(true);
      if (ok) {
        showToast("Sample data loaded successfully.");
      } else {
        alert("Failed to load sample data. Please try again.");
      }
    }
  };

  const handleReset = async () => {
    if (confirm("⚠️ WARNING: This will erase all products, transactions, and customer khata records from the database. Are you sure you want to proceed?")) {
      const ok = await resetData();
      if (ok) {
        showToast("Database has been reset.");
      } else {
        alert("Failed to reset database. Please try again.");
      }
    }
  };

  return (
    <div className="p-4 lg:p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-emerald-600" />
          Settings &amp; Data Management
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure store identity, thermal receipt branding, taxes, and JSON backup/restore.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* 1. Store Profile & Contact */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <Store className="w-5 h-5 text-emerald-600" />
            Store Information &amp; Header
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Store / Business Name *
              </label>
              <input
                type="text"
                required
                value={formData.storeName}
                onChange={(e) => handleChange("storeName", e.target.value)}
                placeholder="e.g. Al-Madina Super Mart"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tagline / Slogan
              </label>
              <input
                type="text"
                value={formData.tagline}
                onChange={(e) => handleChange("tagline", e.target.value)}
                placeholder="e.g. Quality Groceries at Wholesale Rates"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Store Phone Number *
              </label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="0300-1234567"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                City / Region
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="e.g. Karachi"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Full Store Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Shop #, Block, Area, Main Road"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                NTN / Tax Number (Optional)
              </label>
              <input
                type="text"
                value={formData.ntnNumber}
                onChange={(e) => handleChange("ntnNumber", e.target.value)}
                placeholder="7492104-9"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Default Cashier Name
              </label>
              <input
                type="text"
                value={formData.cashierName}
                onChange={(e) => handleChange("cashierName", e.target.value)}
                placeholder="Muhammad Ali (Counter 1)"
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* 2. Receipt & Tax Customization */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
            <Receipt className="w-5 h-5 text-indigo-600" />
            Thermal Receipt &amp; Tax Configuration
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Receipt Paper Width
              </label>
              <select
                value={formData.receiptPaperSize}
                onChange={(e) => handleChange("receiptPaperSize", e.target.value as "80mm" | "58mm")}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="80mm">80mm Standard POS Thermal Receipt</option>
                <option value="58mm">58mm Compact POS Receipt</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Default Low Stock Alert Threshold
              </label>
              <input
                type="number"
                min="1"
                value={formData.defaultLowStockThreshold}
                onChange={(e) => handleChange("defaultLowStockThreshold", parseInt(e.target.value) || 10)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Receipt Footer Note (Urdu / English)
              </label>
              <textarea
                rows={2}
                value={formData.receiptFooter}
                onChange={(e) => handleChange("receiptFooter", e.target.value)}
                placeholder="شکریہ! مال واپس یا تبدیل 3 دن کے اندر بل کے ساتھ ہوگا۔ No Cash Refund."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Store Settings</span>
          </button>
        </div>
      </form>

      {/* 3. Database Persistence & Backup Management */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
          <Database className="w-5 h-5 text-purple-600" />
          Database Backup &amp; Recovery
        </h3>
        <p className="text-xs text-slate-500">
          All your inventory items, sales records, customer ledgers, and settings are securely stored in your MongoDB database. You can export a JSON backup file anytime or restore from a previous backup.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Download Backup */}
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-center transition-all group"
          >
            <Download className="w-6 h-6 text-emerald-600 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="font-extrabold text-xs sm:text-sm text-slate-800">Download Backup JSON</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Save offline backup copy</span>
          </button>

          {/* Upload Restore */}
          <label className="flex flex-col items-center justify-center p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-center transition-all cursor-pointer group">
            <Upload className="w-6 h-6 text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="font-extrabold text-xs sm:text-sm text-slate-800">Restore from JSON</span>
            <span className="text-[11px] text-slate-500 mt-0.5">Upload a backup file</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleUploadFile}
              className="hidden"
            />
          </label>

          {/* Seed Sample Data */}
          <button
            type="button"
            onClick={handleSeed}
            className="flex flex-col items-center justify-center p-4 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl text-center transition-all group"
          >
            <Sparkles className="w-6 h-6 text-emerald-700 mb-1.5 group-hover:scale-110 transition-transform" />
            <span className="font-extrabold text-xs sm:text-sm text-emerald-900">Seed Sample Data</span>
            <span className="text-[11px] text-emerald-700 mt-0.5">Reload Pakistani grocery items</span>
          </button>
        </div>

        {/* Danger Zone: Factory Reset */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-rose-50/50 p-4 rounded-xl border border-rose-100">
          <div>
            <span className="font-bold text-rose-900 text-xs sm:text-sm">Factory Reset Database</span>
            <p className="text-xs text-rose-600 mt-0.5">
              Permanently erase all inventory, sales registers, and customer Khata balances.
            </p>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            Reset All Data
          </button>
        </div>
      </div>

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
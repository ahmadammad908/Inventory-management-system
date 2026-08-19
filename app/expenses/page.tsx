"use client";

import React, { useState } from "react";
import { 
  Wallet, 
  Plus, 
  Tag, 
  Calendar, 
  Trash2, 
  Filter, 
  TrendingDown, 
  Receipt,
  Search
} from "lucide-react";
import { formatPKR } from "@/lib/utils";

interface Expense {
  id: string;
  title: string;
  category: "Utilities" | "Rent" | "Tea & Refreshment" | "Maintenance" | "Miscellaneous";
  amount: number;
  date: string;
  notes?: string;
}

export default function ExpensesPage() {
  // Sample initial state (In production, load this from AppContext or LocalStorage)
  const [expenses, setExpenses] = useState<Expense[]>([
    { id: "EXP-001", title: "Electricity Bill - Shop", category: "Utilities", amount: 14500, date: "2026-08-15", notes: "Monthly LESCO Bill" },
    { id: "EXP-002", title: "Shop Tea & Refreshments", category: "Tea & Refreshment", amount: 1200, date: "2026-08-17", notes: "Daily guests & staff tea" },
    { id: "EXP-003", title: "Shop Rent (August)", category: "Rent", amount: 45000, date: "2026-08-01", notes: "Paid to landlord" },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Expense["category"]>("Utilities");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  // Add Expense
  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) return;

    const newExpense: Expense = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      title,
      category,
      amount: Number(amount),
      date,
      notes,
    };

    setExpenses([newExpense, ...expenses]);
    setTitle("");
    setAmount("");
    setNotes("");
    setIsAddModalOpen(false);
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    if (confirm("Kya aap waqai is kharche ko delete karna chahte hain?")) {
      setExpenses(expenses.filter((e) => e.id !== id));
    }
  };

  // Filter & Search Logic
  const filteredExpenses = expenses.filter((e) => {
    const matchesCategory = selectedCategoryFilter === "All" || e.category === selectedCategoryFilter;
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (e.notes && e.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const totalExpenseAmount = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-slate-950 text-slate-100 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Wallet className="w-7 h-7 text-rose-400" />
            Expense Tracker (دکان کے اخراجات)
          </h1>
          <p className="text-xs text-slate-400 mt-1">Record and categorize all daily shop operational expenses for net profit calculation.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-rose-900/30 transition"
        >
          <Plus className="w-4 h-4" /> Add New Expense
        </button>
      </div>

      {/* Summary Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Total Expenses (Filtered)</div>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1">{formatPKR(totalExpenseAmount)}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Total Entries Recorded</div>
          <div className="text-2xl font-bold text-white mt-1">{filteredExpenses.length} Logs</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Active Category Filter</div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{selectedCategoryFilter}</div>
        </div>
      </div>

      {/* Expense Table Section */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="font-bold text-slate-200 text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-400" /> Expense Logs
          </h2>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div className="relative w-48">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-rose-500"
              >
                <option value="All">All Categories</option>
                <option value="Utilities">Utilities (Bills, Net)</option>
                <option value="Rent">Shop Rent</option>
                <option value="Tea & Refreshment">Tea & Refreshment</option>
                <option value="Maintenance">Maintenance & Repairs</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>
          </div>
        </div>

        {/* Expense List Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Title & Details</th>
                <th className="p-3">Category</th>
                <th className="p-3">Amount</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-xs text-slate-400">{e.date}</td>
                    <td className="p-3">
                      <div className="font-bold text-white">{e.title}</div>
                      {e.notes && <div className="text-[11px] text-slate-400">{e.notes}</div>}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-1 rounded-md border border-slate-700">
                        {e.category}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-rose-400 font-bold">{formatPKR(e.amount)}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition"
                        title="Delete expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
                    Koi expense log nahi mila.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Expense */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Add New Expense Entry</h3>
            <form onSubmit={handleAddExpense} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Expense Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Electricity LESCO Bill"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="Utilities">Utilities (Bills, Internet, Water)</option>
                  <option value="Rent">Shop Rent</option>
                  <option value="Tea & Refreshment">Tea & Refreshment</option>
                  <option value="Maintenance">Shop Maintenance / Repairs</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Amount (PKR)</label>
                <input
                  required
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-semibold"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
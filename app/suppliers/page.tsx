"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Truck,
  Plus,
  Search,
  History,
  Trash2,
  Loader2,
  Package,
  Wallet,
  X,
  Pencil,
} from "lucide-react";
import { formatPKR } from "@/lib/utils";

interface Supplier {
  _id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  category?: string;
  status: "Active" | "Inactive";
  totalPurchased: number;
  totalPaid: number;
  outstandingDue: number;
}

interface PurchaseItem {
  productName: string;
  quantity: number;
  unitCost: number;
}

interface PurchaseOrder {
  _id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  purchaseDate: string;
  notes?: string;
}

const emptyItem: PurchaseItem = { productName: "", quantity: 1, unitCost: 0 };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isPayDueModalOpen, setIsPayDueModalOpen] = useState(false);

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    category: "",
  });

  const [editingSupplierId, setEditingSupplierId] = useState("");
  const [editSupplier, setEditSupplier] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    category: "",
    status: "Active" as "Active" | "Inactive",
  });

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([{ ...emptyItem }]);
  const [purchasePaid, setPurchasePaid] = useState("0");
  const [purchaseNotes, setPurchaseNotes] = useState("");

  const [historySupplier, setHistorySupplier] = useState<Supplier | null>(null);
  const [historyOrders, setHistoryOrders] = useState<PurchaseOrder[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [payDueOrder, setPayDueOrder] = useState<PurchaseOrder | null>(null);
  const [payDueAmount, setPayDueAmount] = useState("");

  // ---- Load suppliers ----
  const loadSuppliers = useCallback(async () => {
    const res = await fetch("/api/suppliers");
    const json = await res.json();
    if (json.success) setSuppliers(json.data);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadSuppliers();
      setLoading(false);
    })();
  }, [loadSuppliers]);

  // ---- Add Supplier ----
  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name || !newSupplier.phone) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSupplier),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setSuppliers((prev) => [{ ...json.data, outstandingDue: 0 }, ...prev]);
      setNewSupplier({ name: "", contactPerson: "", phone: "", email: "", address: "", category: "" });
      setIsAddSupplierOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to add supplier");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Edit Supplier ----
  const openEditModal = (supplier: Supplier) => {
    setEditingSupplierId(supplier._id);
    setEditSupplier({
      name: supplier.name,
      contactPerson: supplier.contactPerson || "",
      phone: supplier.phone,
      email: supplier.email || "",
      address: supplier.address || "",
      category: supplier.category || "",
      status: supplier.status,
    });
    setIsEditSupplierOpen(true);
  };

  const handleEditSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSupplierId || !editSupplier.name || !editSupplier.phone) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/suppliers/${editingSupplierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editSupplier),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setSuppliers((prev) =>
        prev.map((s) => (s._id === editingSupplierId ? { ...s, ...json.data } : s))
      );
      setIsEditSupplierOpen(false);
      setEditingSupplierId("");
    } catch (err: any) {
      alert(err.message || "Failed to update supplier");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Record Purchase ----
  const openPurchaseModal = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setPurchaseItems([{ ...emptyItem }]);
    setPurchasePaid("0");
    setPurchaseNotes("");
    setIsPurchaseModalOpen(true);
  };

  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: string) => {
    setPurchaseItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? { ...item, [field]: field === "productName" ? value : Number(value) }
          : item
      )
    );
  };

  const addPurchaseItemRow = () => setPurchaseItems((prev) => [...prev, { ...emptyItem }]);
  const removePurchaseItemRow = (index: number) =>
    setPurchaseItems((prev) => prev.filter((_, i) => i !== index));

  const purchaseTotal = purchaseItems.reduce(
    (sum, item) => sum + Number(item.quantity || 0) * Number(item.unitCost || 0),
    0
  );

  const handleRecordPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = purchaseItems.filter((i) => i.productName && i.quantity > 0);
    if (!selectedSupplierId || validItems.length === 0) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          items: validItems,
          paidAmount: Number(purchasePaid) || 0,
          notes: purchaseNotes,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      await loadSuppliers();
      setIsPurchaseModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to record purchase");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- View Purchase History ----
  const openHistoryModal = async (supplier: Supplier) => {
    setHistorySupplier(supplier);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/suppliers/${supplier._id}`);
      const json = await res.json();
      if (json.success) setHistoryOrders(json.data.purchaseHistory);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ---- Pay Due against a Purchase Order ----
  const openPayDueModal = (order: PurchaseOrder) => {
    setPayDueOrder(order);
    setPayDueAmount(order.dueAmount.toString());
    setIsPayDueModalOpen(true);
  };

  const handlePayDue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payDueOrder) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/purchase-orders/${payDueOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payAmount: Number(payDueAmount) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setHistoryOrders((prev) => prev.map((o) => (o._id === json.data._id ? json.data : o)));
      await loadSuppliers();
      setIsPayDueModalOpen(false);
      setPayDueOrder(null);
    } catch (err: any) {
      alert(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Delete Supplier ----
  const handleDeleteSupplier = async (id: string) => {
    if (!confirm("Remove this supplier?")) return;
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setSuppliers((prev) => prev.filter((s) => s._id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete supplier");
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOutstanding = suppliers.reduce((acc, s) => acc + (s.outstandingDue || 0), 0);
  const totalPurchasedAllTime = suppliers.reduce((acc, s) => acc + (s.totalPurchased || 0), 0);
  const totalPaidAllTime = suppliers.reduce((acc, s) => acc + (s.totalPaid || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-300">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading suppliers...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-slate-950 text-slate-100 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Truck className="w-7 h-7 text-emerald-400" />
            Suppliers & Vendors
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage vendor records, purchase orders, and outstanding dues.
          </p>
        </div>
        <button
          onClick={() => setIsAddSupplierOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition"
        >
          <Plus className="w-4 h-4" /> Add Supplier
        </button>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Total Purchased (Lifetime)</div>
          <div className="text-2xl font-bold text-white mt-1 font-mono">{formatPKR(totalPurchasedAllTime)}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Total Paid to Suppliers</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{formatPKR(totalPaidAllTime)}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Total Outstanding Dues</div>
          <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">{formatPKR(totalOutstanding)}</div>
        </div>
      </div>

      {/* Suppliers List */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-bold text-slate-200 text-lg">Vendor List</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Supplier</th>
                <th className="p-3">Category</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Total Purchased</th>
                <th className="p-3">Outstanding Due</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500 text-xs">
                    No suppliers found. Click "Add Supplier" to get started.
                  </td>
                </tr>
              )}
              {filteredSuppliers.map((s) => (
                <tr key={s._id} className="hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-bold text-white">{s.name}</div>
                    <div className="text-[11px] text-slate-500">{s.contactPerson || "—"}</div>
                  </td>
                  <td className="p-3 text-slate-300 text-xs">{s.category || "General"}</td>
                  <td className="p-3 font-mono text-xs">{s.phone}</td>
                  <td className="p-3 font-mono text-slate-300">{formatPKR(s.totalPurchased)}</td>
                  <td className="p-3 font-mono font-bold">
                    {s.outstandingDue > 0 ? (
                      <span className="text-rose-400">{formatPKR(s.outstandingDue)}</span>
                    ) : (
                      <span className="text-emerald-400">Cleared</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        s.status === "Active"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-700/50 text-slate-400"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => openPurchaseModal(s._id)}
                      className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-lg text-xs font-semibold"
                    >
                      New Purchase
                    </button>
                    <button
                      onClick={() => openHistoryModal(s)}
                      className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 rounded-lg text-xs"
                      title="Purchase history"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => openEditModal(s)}
                      className="px-2 py-1 bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 rounded-lg text-xs"
                      title="Edit supplier"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteSupplier(s._id)}
                      className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 rounded-lg text-xs"
                      title="Remove supplier"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Supplier */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Add New Supplier</h3>
            <form onSubmit={handleAddSupplier} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Supplier / Company Name</label>
                <input
                  required
                  type="text"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Contact Person</label>
                <input
                  type="text"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Phone Number</label>
                <input
                  required
                  type="text"
                  placeholder="0300-XXXXXXX"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Email (optional)</label>
                <input
                  type="email"
                  value={newSupplier.email}
                  onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Raw Material, Packaging"
                  value={newSupplier.category}
                  onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Address</label>
                <input
                  type="text"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddSupplierOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Supplier */}
      {isEditSupplierOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">Edit Supplier</h3>
            <form onSubmit={handleEditSupplier} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Supplier / Company Name</label>
                <input
                  required
                  type="text"
                  value={editSupplier.name}
                  onChange={(e) => setEditSupplier({ ...editSupplier, name: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Contact Person</label>
                <input
                  type="text"
                  value={editSupplier.contactPerson}
                  onChange={(e) => setEditSupplier({ ...editSupplier, contactPerson: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Phone Number</label>
                <input
                  required
                  type="text"
                  placeholder="0300-XXXXXXX"
                  value={editSupplier.phone}
                  onChange={(e) => setEditSupplier({ ...editSupplier, phone: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Email (optional)</label>
                <input
                  type="email"
                  value={editSupplier.email}
                  onChange={(e) => setEditSupplier({ ...editSupplier, email: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Category</label>
                <input
                  type="text"
                  placeholder="e.g. Raw Material, Packaging"
                  value={editSupplier.category}
                  onChange={(e) => setEditSupplier({ ...editSupplier, category: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Address</label>
                <input
                  type="text"
                  value={editSupplier.address}
                  onChange={(e) => setEditSupplier({ ...editSupplier, address: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Status</label>
                <select
                  value={editSupplier.status}
                  onChange={(e) =>
                    setEditSupplier({ ...editSupplier, status: e.target.value as "Active" | "Inactive" })
                  }
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditSupplierOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record New Purchase */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" /> Record New Purchase
            </h3>
            <form onSubmit={handleRecordPurchase} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Items Purchased</label>
                {purchaseItems.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Product name"
                      value={item.productName}
                      onChange={(e) => updatePurchaseItem(idx, "productName", e.target.value)}
                      className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updatePurchaseItem(idx, "quantity", e.target.value)}
                      className="w-20 p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    <input
                      type="number"
                      placeholder="Unit cost"
                      value={item.unitCost}
                      onChange={(e) => updatePurchaseItem(idx, "unitCost", e.target.value)}
                      className="w-28 p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                    />
                    {purchaseItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePurchaseItemRow(idx)}
                        className="text-rose-400 hover:text-rose-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addPurchaseItemRow}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
                >
                  + Add another item
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-lg p-3">
                <span className="text-xs text-slate-400">Total Purchase Amount</span>
                <span className="font-mono font-bold text-emerald-400">{formatPKR(purchaseTotal)}</span>
              </div>

              <div>
                <label className="text-xs text-slate-400">Amount Paid Now (leave 0 for full credit/due)</label>
                <input
                  type="number"
                  value={purchasePaid}
                  onChange={(e) => setPurchasePaid(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Notes (optional)</label>
                <input
                  type="text"
                  value={purchaseNotes}
                  onChange={(e) => setPurchaseNotes(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Purchase History */}
      {isHistoryModalOpen && historySupplier && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" /> {historySupplier.name} — Purchase History
              </h3>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {historyLoading ? (
              <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading history...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase font-semibold border-b border-slate-800">
                    <tr>
                      <th className="p-3">Date</th>
                      <th className="p-3">Total</th>
                      <th className="p-3">Paid</th>
                      <th className="p-3">Due</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {historyOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                          No purchases recorded yet for this supplier.
                        </td>
                      </tr>
                    )}
                    {historyOrders.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-800/40">
                        <td className="p-3 text-xs font-mono text-slate-400">
                          {new Date(o.purchaseDate).toLocaleDateString()}
                        </td>
                        <td className="p-3 font-mono">{formatPKR(o.totalAmount)}</td>
                        <td className="p-3 font-mono text-emerald-400">{formatPKR(o.paidAmount)}</td>
                        <td className="p-3 font-mono text-rose-400">{formatPKR(o.dueAmount)}</td>
                        <td className="p-3">
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              o.paymentStatus === "Paid"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : o.paymentStatus === "Partial"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {o.paymentStatus}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {o.dueAmount > 0 && (
                            <button
                              onClick={() => openPayDueModal(o)}
                              className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-lg text-xs font-semibold"
                            >
                              Pay Due
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Pay Due */}
      {isPayDueModalOpen && payDueOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Pay Outstanding Due</h3>
            <p className="text-xs text-slate-400">
              Remaining due for this purchase: <span className="text-rose-400 font-mono">{formatPKR(payDueOrder.dueAmount)}</span>
            </p>
            <form onSubmit={handlePayDue} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Amount to Pay (PKR)</label>
                <input
                  required
                  type="number"
                  max={payDueOrder.dueAmount}
                  value={payDueAmount}
                  onChange={(e) => setPayDueAmount(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsPayDueModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? "Recording..." : "Record Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
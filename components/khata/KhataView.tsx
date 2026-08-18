"use client";

import React, { useState, useMemo } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  BookOpen, 
  Phone, 
  Send, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  CreditCard,
  AlertTriangle,
  ArrowDownLeft,
  DollarSign
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Customer } from "@/types";
import { formatPKR, generateWhatsAppReminderLink } from "@/lib/utils";
import { CustomerModal } from "./CustomerModal";
import { CustomerLedgerModal } from "./CustomerLedgerModal";
import { PaymentModal } from "./PaymentModal";

export function KhataView() {
  const {
    customers,
    ledger,
    settings,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    recordCustomerPayment,
    stats,
  } = useApp();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [balanceFilter, setBalanceFilter] = useState<"all" | "has_balance" | "zero_balance">("all");
  const [sortBy, setSortBy] = useState<"balance_desc" | "name" | "limit_desc">("balance_desc");

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState<boolean>(false);
  const [selectedLedgerCustomer, setSelectedLedgerCustomer] = useState<Customer | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentCustomer, setPaymentCustomer] = useState<Customer | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        const matchSearch =
          searchTerm === "" ||
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.phone.includes(searchTerm) ||
          (c.cnic && c.cnic.includes(searchTerm));

        let matchBalance = true;
        if (balanceFilter === "has_balance") matchBalance = c.currentBalance > 0;
        if (balanceFilter === "zero_balance") matchBalance = c.currentBalance <= 0;

        return matchSearch && matchBalance;
      })
      .sort((a, b) => {
        if (sortBy === "balance_desc") return b.currentBalance - a.currentBalance;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "limit_desc") return b.creditLimit - a.creditLimit;
        return 0;
      });
  }, [customers, searchTerm, balanceFilter, sortBy]);

  const handleDelete = (customer: Customer) => {
    if (customer.currentBalance > 0) {
      if (!confirm(`Warning: ${customer.name} has an outstanding balance of ${formatPKR(customer.currentBalance)}. Are you sure you want to delete this customer?`)) {
        return;
      }
    } else {
      if (!confirm(`Are you sure you want to remove customer ${customer.name}?`)) {
        return;
      }
    }

    deleteCustomer(customer.id);
    showToast("Customer removed from Khata.");
  };

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Top Header & New Customer Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Customer Khata &amp; Udhaar Ledger
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Track customer credit balances, record payments, and send instant WhatsApp reminders.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingCustomer(null);
            setIsCustomerModalOpen(true);
          }}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-600/30 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Khata Customer</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Outstanding Udhaar</p>
            <h3 className="text-xl sm:text-2xl font-black text-rose-600 font-mono mt-1">
              {formatPKR(stats.totalUdhaarReceivables)}
            </h3>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Khata Accounts</p>
            <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">
              {customers.length} Customers
            </h3>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Customers with Pending Due</p>
            <h3 className="text-xl sm:text-2xl font-black text-amber-600 font-mono mt-1">
              {customers.filter((c) => c.currentBalance > 0).length} Accounts
            </h3>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customer name, phone number (0300...), or CNIC..."
              className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={balanceFilter}
              onChange={(e) => setBalanceFilter(e.target.value as typeof balanceFilter)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Customer Accounts</option>
              <option value="has_balance">🔴 Has Pending Udhaar ({customers.filter((c) => c.currentBalance > 0).length})</option>
              <option value="zero_balance">🟢 Zero / Cleared Balance</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="balance_desc">Highest Outstanding Due</option>
              <option value="name">Sort by Name</option>
              <option value="limit_desc">Highest Credit Limit</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">Customer Details</th>
                <th className="px-4 py-3.5">Phone &amp; Address</th>
                <th className="px-4 py-3.5 text-right">Credit Limit</th>
                <th className="px-4 py-3.5 text-right">Outstanding Khata</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => {
                  const hasDue = customer.currentBalance > 0;
                  const whatsappLink = generateWhatsAppReminderLink(
                    customer.name,
                    customer.phone,
                    customer.currentBalance,
                    settings.storeName,
                    settings.phone
                  );

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name & Notes */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">{customer.name}</p>
                            {customer.cnic && (
                              <p className="text-[11px] font-mono text-slate-400">
                                CNIC: {customer.cnic}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Phone & Address */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5 font-mono text-xs font-bold text-slate-800">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{customer.phone}</span>
                          </div>
                          {customer.address && (
                            <p className="text-xs text-slate-500 truncate max-w-xs">
                              {customer.address}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Credit Limit */}
                      <td className="px-4 py-3 text-right font-mono text-slate-600 font-semibold">
                        {formatPKR(customer.creditLimit)}
                      </td>

                      {/* Current Balance */}
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-mono text-sm sm:text-base font-black ${
                            hasDue ? "text-rose-600" : "text-emerald-600"
                          }`}
                        >
                          {formatPKR(customer.currentBalance)}
                        </span>
                        {hasDue && (
                          <span className="block text-[10px] font-bold text-rose-500 uppercase">
                            Due
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* WhatsApp Reminder */}
                          {hasDue && (
                            <a
                              href={whatsappLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Send WhatsApp Payment Reminder"
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </a>
                          )}

                          {/* Receive Payment */}
                          {hasDue && (
                            <button
                              onClick={() => {
                                setPaymentCustomer(customer);
                                setIsPaymentModalOpen(true);
                              }}
                              title="Receive Payment"
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition-colors border border-emerald-200"
                            >
                              Pay In
                            </button>
                          )}

                          {/* View Ledger */}
                          <button
                            onClick={() => {
                              setSelectedLedgerCustomer(customer);
                              setIsLedgerModalOpen(true);
                            }}
                            title="View Transaction Ledger History"
                            className="p-1.5 text-slate-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>

                          {/* Edit Customer */}
                          <button
                            onClick={() => {
                              setEditingCustomer(customer);
                              setIsCustomerModalOpen(true);
                            }}
                            title="Edit Customer"
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Delete Customer */}
                          <button
                            onClick={() => handleDelete(customer)}
                            title="Delete Customer"
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
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700 text-sm">No Khata customers found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Click &quot;New Khata Customer&quot; to register.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        initialCustomer={editingCustomer}
        onSubmit={(customerData) => {
          if (editingCustomer) {
            updateCustomer(editingCustomer.id, customerData);
            showToast("Customer profile updated.");
          } else {
            addCustomer(customerData);
            showToast("New Khata customer registered.");
          }
        }}
      />

      {/* Customer Ledger Modal */}
      <CustomerLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        customer={selectedLedgerCustomer}
        ledger={ledger}
        settings={settings}
        onOpenPaymentModal={(cust) => {
          setPaymentCustomer(cust);
          setIsPaymentModalOpen(true);
        }}
      />

      {/* Receive Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        customer={paymentCustomer}
        onReceivePayment={(customerId, amount, method, ref, notes) => {
          recordCustomerPayment(customerId, amount, method, ref, notes);
          showToast(`Recorded payment of ${formatPKR(amount)}!`);
        }}
      />

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

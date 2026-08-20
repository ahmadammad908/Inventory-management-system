"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  DollarSign,
  Search,
  UserPlus,
  History,
  Trash2,
  Loader2,
} from "lucide-react";
import { formatPKR } from "@/lib/utils";

interface Employee {
  _id: string;
  name: string;
  role: string;
  phone: string;
  baseSalary: number;
  status: "Active" | "Inactive";
}

interface SalaryPayment {
  _id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  monthYear: string;
  paymentDate: string;
  paymentMethod: "Cash" | "Bank Transfer" | "EasyPaisa/JazzCash";
  notes?: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payments, setPayments] = useState<SalaryPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newEmp, setNewEmp] = useState({ name: "", role: "", phone: "", baseSalary: "" });

  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMonth, setPayMonth] = useState("August 2026");
  const [payMethod, setPayMethod] = useState<SalaryPayment["paymentMethod"]>("Cash");
  const [payNotes, setPayNotes] = useState("");

  // ---- Data fetching ----
  const loadEmployees = useCallback(async () => {
    const res = await fetch("/api/employees");
    const json = await res.json();
    if (json.success) setEmployees(json.data);
  }, []);

  const loadPayments = useCallback(async () => {
    const res = await fetch("/api/salary-payments");
    const json = await res.json();
    if (json.success) setPayments(json.data);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadEmployees(), loadPayments()]);
      } catch (e) {
        setError("Failed to load data. Please refresh.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadEmployees, loadPayments]);

  // ---- Add Employee ----
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.baseSalary) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newEmp.name,
          role: newEmp.role || "Staff Member",
          phone: newEmp.phone || "N/A",
          baseSalary: Number(newEmp.baseSalary),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setEmployees((prev) => [json.data, ...prev]);
      setNewEmp({ name: "", role: "", phone: "", baseSalary: "" });
      setIsAddEmpModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to add employee");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Record Salary Payment ----
  const handlePaySalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !payAmount) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/salary-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmpId,
          amount: Number(payAmount),
          monthYear: payMonth,
          paymentMethod: payMethod,
          notes: payNotes,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      setPayments((prev) => [json.data, ...prev]);
      setIsPayModalOpen(false);
      setSelectedEmpId("");
      setPayAmount("");
      setPayNotes("");
    } catch (err: any) {
      alert(err.message || "Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  // ---- Delete Employee ----
  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Remove this employee? This won't delete their past payment history.")) return;
    try {
      const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setEmployees((prev) => prev.filter((emp) => emp._id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete employee");
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMonthlyPayroll = employees.reduce((acc, curr) => acc + curr.baseSalary, 0);
  const totalPaidThisMonth = payments.reduce((acc, curr) => acc + curr.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-300">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading payroll data...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-slate-950 text-slate-100 min-h-screen">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-400" />
            Employee Salaries & Payroll
          </h1>
          <p className="text-xs text-slate-400 mt-1">Manage staff records, monthly salaries, and payout histories.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAddEmpModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition"
          >
            <UserPlus className="w-4 h-4 text-emerald-400" /> Add Employee
          </button>
          <button
            onClick={() => setIsPayModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-900/30 transition"
          >
            <DollarSign className="w-4 h-4" /> Record Salary Payment
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Total Employees</div>
          <div className="text-2xl font-bold text-white mt-1">{employees.length} Staff Members</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Total Monthly Commitment</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">{formatPKR(totalMonthlyPayroll)}</div>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="text-xs text-slate-400">Total Payouts Recorded</div>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1">{formatPKR(totalPaidThisMonth)}</div>
        </div>
      </div>

      {/* Employees List */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-bold text-slate-200 text-lg">Staff List</h2>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search staff..."
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
                <th className="p-3">ID & Name</th>
                <th className="p-3">Role</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Monthly Base Salary</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 text-xs">
                    No employees found. Click "Add Employee" to get started.
                  </td>
                </tr>
              )}
              {filteredEmployees.map((emp) => (
                <tr key={emp._id} className="hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-bold text-white">{emp.name}</div>
                    <div className="text-[11px] text-slate-500">{emp._id.slice(-6).toUpperCase()}</div>
                  </td>
                  <td className="p-3 text-slate-300">{emp.role}</td>
                  <td className="p-3 font-mono text-xs">{emp.phone}</td>
                  <td className="p-3 font-mono text-emerald-400 font-bold">{formatPKR(emp.baseSalary)}</td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => {
                        setSelectedEmpId(emp._id);
                        setPayAmount(emp.baseSalary.toString());
                        setIsPayModalOpen(true);
                      }}
                      className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-lg text-xs font-semibold"
                    >
                      Pay Salary
                    </button>
                    <button
                      onClick={() => handleDeleteEmployee(emp._id)}
                      className="px-2 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 rounded-lg text-xs"
                      title="Remove employee"
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

      {/* Salary Payment History */}
      <div className="bg-slate-900/60 rounded-2xl border border-slate-800 p-5 space-y-4">
        <h2 className="font-bold text-slate-200 text-lg flex items-center gap-2">
          <History className="w-5 h-5 text-emerald-400" /> Payout History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Employee</th>
                <th className="p-3">For Month</th>
                <th className="p-3">Method</th>
                <th className="p-3">Amount Paid</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {payments.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 text-xs">
                    No salary payments recorded yet.
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr key={p._id} className="hover:bg-slate-800/40">
                  <td className="p-3 text-xs font-mono text-slate-400">
                    {new Date(p.paymentDate).toLocaleDateString()}
                  </td>
                  <td className="p-3 font-medium text-white">{p.employeeName}</td>
                  <td className="p-3 text-xs text-slate-300">{p.monthYear}</td>
                  <td className="p-3 text-xs font-mono text-slate-400">{p.paymentMethod}</td>
                  <td className="p-3 font-mono text-rose-400 font-bold">{formatPKR(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add Employee */}
      {isAddEmpModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Add New Staff Member</h3>
            <form onSubmit={handleAddEmployee} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Full Name</label>
                <input
                  required
                  type="text"
                  value={newEmp.name}
                  onChange={(e) => setNewEmp({ ...newEmp, name: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Designation / Role</label>
                <input
                  type="text"
                  placeholder="e.g. Sales Cashier"
                  value={newEmp.role}
                  onChange={(e) => setNewEmp({ ...newEmp, role: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Phone Number</label>
                <input
                  type="text"
                  placeholder="0300-XXXXXXX"
                  value={newEmp.phone}
                  onChange={(e) => setNewEmp({ ...newEmp, phone: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Monthly Base Salary (PKR)</label>
                <input
                  required
                  type="number"
                  value={newEmp.baseSalary}
                  onChange={(e) => setNewEmp({ ...newEmp, baseSalary: e.target.value })}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddEmpModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pay Salary */}
      {isPayModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-white">Record Salary Payout</h3>
            <form onSubmit={handlePaySalary} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Select Employee</label>
                <select
                  required
                  value={selectedEmpId}
                  onChange={(e) => {
                    setSelectedEmpId(e.target.value);
                    const emp = employees.find((emp) => emp._id === e.target.value);
                    if (emp) setPayAmount(emp.baseSalary.toString());
                  }}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Staff --</option>
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name} ({formatPKR(e.baseSalary)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Amount Paid (PKR)</label>
                <input
                  required
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Payment Month & Year</label>
                <input
                  type="text"
                  value={payMonth}
                  onChange={(e) => setPayMonth(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Payment Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as any)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="EasyPaisa/JazzCash">EasyPaisa / JazzCash</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Notes (optional)</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2 justify-end pt-3">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
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
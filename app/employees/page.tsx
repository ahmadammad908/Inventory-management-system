"use client";

import React, { useState } from "react";
import { 
  Users, 
  Plus, 
  DollarSign, 
  Calendar, 
  Search, 
  CheckCircle2, 
  UserPlus, 
  History,
  CreditCard
} from "lucide-react";
import { formatPKR } from "@/lib/utils";

interface Employee {
  id: string;
  name: string;
  role: string;
  phone: string;
  baseSalary: number;
  status: "Active" | "Inactive";
}

interface SalaryPayment {
  id: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  monthYear: string; // e.g., "August 2026"
  paymentDate: string;
  paymentMethod: "Cash" | "Bank Transfer" | "EasyPaisa/JazzCash";
  notes?: string;
}

export default function EmployeesPage() {
  // Sample Initial Data (In real app, load from Context / LocalStorage / Database)
  const [employees, setEmployees] = useState<Employee[]>([
    { id: "EMP-001", name: "Ali Raza", role: "Sales Cashier", phone: "0300-1234567", baseSalary: 35000, status: "Active" },
    { id: "EMP-002", name: "Usman Ahmed", role: "Inventory Helper", phone: "0321-7654321", baseSalary: 28000, status: "Active" },
  ]);

  const [payments, setPayments] = useState<SalaryPayment[]>([
    { id: "PAY-101", employeeId: "EMP-001", employeeName: "Ali Raza", amount: 35000, monthYear: "July 2026", paymentDate: "2026-08-01", paymentMethod: "Cash", notes: "Monthly full salary" },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddEmpModalOpen, setIsAddEmpModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);

  // New Employee Form State
  const [newEmp, setNewEmp] = useState({ name: "", role: "", phone: "", baseSalary: "" });

  // Salary Payment Form State
  const [selectedEmpId, setSelectedEmpId] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payMonth, setPayMonth] = useState("August 2026");
  const [payMethod, setPayMethod] = useState<SalaryPayment["paymentMethod"]>("Cash");
  const [payNotes, setPayNotes] = useState("");

  // Handle Add Employee
  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmp.name || !newEmp.baseSalary) return;

    const createdEmp: Employee = {
      id: `EMP-00${employees.length + 1}`,
      name: newEmp.name,
      role: newEmp.role || "Staff Member",
      phone: newEmp.phone || "N/A",
      baseSalary: Number(newEmp.baseSalary),
      status: "Active",
    };

    setEmployees([...employees, createdEmp]);
    setNewEmp({ name: "", role: "", phone: "", baseSalary: "" });
    setIsAddEmpModalOpen(false);
  };

  // Handle Pay Salary
  const handlePaySalary = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmpId);
    if (!emp || !payAmount) return;

    const newPayment: SalaryPayment = {
      id: `PAY-${Date.now().toString().slice(-4)}`,
      employeeId: emp.id,
      employeeName: emp.name,
      amount: Number(payAmount),
      monthYear: payMonth,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: payMethod,
      notes: payNotes,
    };

    setPayments([newPayment, ...payments]);
    setIsPayModalOpen(false);
    setSelectedEmpId("");
    setPayAmount("");
    setPayNotes("");
  };

  const filteredEmployees = employees.filter(
    (e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalMonthlyPayroll = employees.reduce((acc, curr) => acc + curr.baseSalary, 0);
  const totalPaidThisMonth = payments.reduce((acc, curr) => acc + curr.amount, 0);

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
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-bold text-white">{emp.name}</div>
                    <div className="text-[11px] text-slate-500">{emp.id}</div>
                  </td>
                  <td className="p-3 text-slate-300">{emp.role}</td>
                  <td className="p-3 font-mono text-xs">{emp.phone}</td>
                  <td className="p-3 font-mono text-emerald-400 font-bold">{formatPKR(emp.baseSalary)}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedEmpId(emp.id);
                        setPayAmount(emp.baseSalary.toString());
                        setIsPayModalOpen(true);
                      }}
                      className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 rounded-lg text-xs font-semibold"
                    >
                      Pay Salary
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
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40">
                  <td className="p-3 text-xs font-mono text-slate-400">{p.paymentDate}</td>
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
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                >
                  Save Employee
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
                    const emp = employees.find((emp) => emp.id === e.target.value);
                    if (emp) setPayAmount(emp.baseSalary.toString());
                  }}
                  className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="">-- Choose Staff --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
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
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
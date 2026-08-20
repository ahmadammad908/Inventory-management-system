import mongoose, { Schema, models, model, Document } from "mongoose";

export interface IReportTotals {
  revenue: number; // net sales revenue (subtotal - discountTotal), excludes tax
  taxCollected: number; // sales tax collected from customers — a liability, not profit
  grandTotalBilled: number; // total amount actually invoiced to customers (incl. tax)
  costOfInventorySold: number; // COGS - cost of goods sold in the period
  grossProfit: number; // revenue - costOfInventorySold
  employeePayments: number; // salaries paid in the period
  supplierPayments: number; // amount paid to suppliers in the period
  otherExpenses: number; // any other ledger expenses in the period
  totalExpenses: number; // employeePayments + supplierPayments + otherExpenses
  netProfit: number; // grossProfit - employeePayments - otherExpenses
  currentInventoryValue: number; // point-in-time stock value at generation time
  totalSalesCount: number;
}

export interface IReport {
  type: "daily" | "monthly" | "annual";
  periodLabel: string; // e.g. "19 Aug 2026", "August 2026", "2026"
  periodStart: Date;
  periodEnd: Date;
  totals: IReportTotals;
  generatedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IReportDocument extends IReport, Document {}

const ReportTotalsSchema = new Schema<IReportTotals>(
  {
    revenue: { type: Number, default: 0 },
    costOfInventorySold: { type: Number, default: 0 },
    grossProfit: { type: Number, default: 0 },
    employeePayments: { type: Number, default: 0 },
    supplierPayments: { type: Number, default: 0 },
    otherExpenses: { type: Number, default: 0 },
    totalExpenses: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    currentInventoryValue: { type: Number, default: 0 },
    totalSalesCount: { type: Number, default: 0 },
  },
  { _id: false }
);

const ReportSchema = new Schema<IReportDocument>(
  {
    type: { type: String, enum: ["daily", "monthly", "annual"], required: true },
    periodLabel: { type: String, required: true },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    totals: { type: ReportTotalsSchema, required: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One saved snapshot per type+period (re-saving overwrites, keeping history clean)
ReportSchema.index({ type: 1, periodStart: 1 }, { unique: true });

export default models.Report || model<IReportDocument>("Report", ReportSchema);
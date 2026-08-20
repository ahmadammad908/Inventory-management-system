import { connectDB } from "@/lib/mongodb"; // adjust path if your DB helper lives elsewhere
import PurchaseOrder from "@/models/PurchaseOrder";
import SalaryPayment from "@/models/SalaryPayment";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import { IReportTotals } from "@/models/Report";

export interface ReportPeriod {
  start: Date;
  end: Date;
  label: string;
}

export function getDailyPeriod(dateStr?: string): ReportPeriod {
  const date = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
  const label = start.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
  return { start, end, label };
}

export function getMonthlyPeriod(monthStr?: string): ReportPeriod {
  // monthStr format: "YYYY-MM"
  const [y, m] = monthStr ? monthStr.split("-").map(Number) : [new Date().getFullYear(), new Date().getMonth() + 1];
  const start = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const end = new Date(y, m, 0, 23, 59, 59, 999); // last day of month
  const label = start.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  return { start, end, label };
}

export function getAnnualPeriod(yearStr?: string): ReportPeriod {
  const y = yearStr ? Number(yearStr) : new Date().getFullYear();
  const start = new Date(y, 0, 1, 0, 0, 0, 0);
  const end = new Date(y, 11, 31, 23, 59, 59, 999);
  return { start, end, label: String(y) };
}

/**
 * Computes a full financial report for the given period.
 * Pulls: Sales (net revenue + COGS + tax collected), SalaryPayment (employee
 * payments), PurchaseOrder (supplier payments), Product (current inventory value).
 */
export async function computeReport(period: ReportPeriod): Promise<IReportTotals> {
  await connectDB();

  // Only count completed sales — refunded sales are excluded from revenue/COGS.
  const sales = await Sale.find({
    createdAt: { $gte: period.start, $lte: period.end },
    status: "completed",
  });

  const totalSalesCount = sales.length;

  // Net revenue = subtotal - discountTotal (excludes tax, which isn't company income)
  const revenue = sales.reduce(
    (sum: number, sale: any) => sum + ((sale.subtotal || 0) - (sale.discountTotal || 0)),
    0
  );

  // Tax collected from customers on behalf of the government (a payable, not profit)
  const taxCollected = sales.reduce((sum: number, sale: any) => sum + (sale.taxAmount || 0), 0);

  // Total invoiced amount (what customers were actually billed, incl. tax)
  const grandTotalBilled = sales.reduce((sum: number, sale: any) => sum + (sale.grandTotal || 0), 0);

  // COGS: sum of each line item's costPrice * quantity
  const costOfInventorySold = sales.reduce((sum: number, sale: any) => {
    const items = sale.items || [];
    const itemsCost = items.reduce(
      (s: number, item: any) => s + (item.costPrice || 0) * (item.quantity || 0),
      0
    );
    return sum + itemsCost;
  }, 0);

  const grossProfit = revenue - costOfInventorySold;

  // ---- Employee Payments (salaries paid in this period) ----
  const salaryPayments = await SalaryPayment.find({
    paymentDate: { $gte: period.start, $lte: period.end },
  });
  const employeePayments = salaryPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  // ---- Supplier Payments (cash paid out to vendors in this period) ----
  const purchaseOrders = await PurchaseOrder.find({
    purchaseDate: { $gte: period.start, $lte: period.end },
  });
  const supplierPayments = purchaseOrders.reduce((sum: number, po: any) => sum + (po.paidAmount || 0), 0);

  // ---- Other Expenses ----
  // Plug in your Ledger/Expense model here if you track misc expenses
  // (rent, utilities, etc.) separately. Left at 0 until that's wired up.
  const otherExpenses = 0;

  const totalExpenses = employeePayments + supplierPayments + otherExpenses;
  const netProfit = grossProfit - employeePayments - otherExpenses;
  // Note: supplierPayments is cash paid for inventory (a cash-flow item), while
  // costOfInventorySold (COGS) is what's already reflected against revenue in
  // grossProfit — so supplierPayments is tracked for cash-flow visibility but
  // intentionally not subtracted again in netProfit to avoid double-counting.

  // ---- Current Inventory Value (point-in-time snapshot, not period-bound) ----
  const products = await Product.find({});
  const currentInventoryValue = products.reduce(
    (sum: number, p: any) => sum + (p.stock || 0) * (p.costPrice || 0),
    0
  );

  return {
    revenue,
    taxCollected,
    grandTotalBilled,
    costOfInventorySold,
    grossProfit,
    employeePayments,
    supplierPayments,
    otherExpenses,
    totalExpenses,
    netProfit,
    currentInventoryValue,
    totalSalesCount,
  };
}
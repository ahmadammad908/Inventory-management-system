import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import Customer from "@/models/Customer";
import LedgerEntry from "@/models/LedgerEntry";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const sale = await Sale.findById(params.id);
  if (!sale || sale.status === "refunded") {
    return NextResponse.json({ error: "Invalid sale" }, { status: 400 });
  }

  // Replenish stock
  for (const item of sale.items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: item.quantity },
      updatedAt: new Date(),
    });
  }

  sale.status = "refunded";
  sale.notes = (sale.notes ? sale.notes + " | " : "") + `Refunded/Voided on ${new Date().toLocaleDateString()}`;
  await sale.save();

  // Reverse udhaar
  if (sale.paymentMethod === "udhaar" && sale.customerId) {
    const customer = await Customer.findById(sale.customerId);
    if (customer) {
      const newBalance = Math.max(0, customer.currentBalance - sale.grandTotal);
      await LedgerEntry.create({
        customerId: customer._id,
        type: "adjustment",
        amount: -sale.grandTotal,
        balanceAfter: newBalance,
        invoiceId: sale._id.toString(),
        invoiceNo: sale.invoiceNo,
        notes: `Reversal of voided bill ${sale.invoiceNo}`,
        date: new Date(),
      });
      customer.currentBalance = newBalance;
      customer.updatedAt = new Date();
      await customer.save();
    }
  }

  return NextResponse.json(sale);
}
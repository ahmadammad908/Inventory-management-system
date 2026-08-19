import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import Customer from "@/models/Customer";
import LedgerEntry from "@/models/LedgerEntry";

export async function GET() {
  await connectDB();
  const sales = await Sale.find().sort({ createdAt: -1 });
  return NextResponse.json(sales);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const { items, customerId, paymentMethod, amountPaid, changeReturned, notes, reference, cashierName } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const salesCount = await Sale.countDocuments();
  const invoiceNo = `INV-${String(salesCount + 1).padStart(5, "0")}`;

  let customer = null;
  if (customerId) customer = await Customer.findById(customerId);

  const subtotal = items.reduce((sum: number, i: any) => sum + i.total, 0);
  const grandTotal = body.grandTotal ?? subtotal;

  const sale = await Sale.create({
    invoiceNo,
    items,
    subtotal,
    discountTotal: body.discountTotal || 0,
    taxRate: body.taxRate || 0,
    taxAmount: body.taxAmount || 0,
    grandTotal,
    paymentMethod,
    amountPaid: paymentMethod === "udhaar" ? 0 : amountPaid,
    changeReturned,
    customerId: customer?._id,
    customerName: customer ? customer.name : "Walk-in Customer",
    customerPhone: customer?.phone,
    paymentReference: reference,
    cashierName,
    status: "completed",
    notes,
  });

  // Deduct stock
  for (const item of items) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: -item.quantity },
      updatedAt: new Date(),
    });
  }

  // Udhaar ledger
  if (paymentMethod === "udhaar" && customer) {
    const newBalance = customer.currentBalance + grandTotal;
    await LedgerEntry.create({
      customerId: customer._id,
      type: "debit_sale",
      amount: grandTotal,
      balanceAfter: newBalance,
      invoiceId: sale._id.toString(),
      invoiceNo,
      notes: `POS Bill ${invoiceNo} (${items.length} items)`,
      date: new Date(),
    });
    customer.currentBalance = newBalance;
    customer.updatedAt = new Date();
    await customer.save();
  }

  return NextResponse.json(sale, { status: 201 });
}
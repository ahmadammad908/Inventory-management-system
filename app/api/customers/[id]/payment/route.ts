import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import LedgerEntry from "@/models/LedgerEntry";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const { amount, paymentMethod, referenceNo, notes } = await req.json();

  const customer = await Customer.findById(params.id);
  if (!customer || amount <= 0) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const newBalance = Math.max(0, customer.currentBalance - amount);

  const entry = await LedgerEntry.create({
    customerId: customer._id,
    type: "credit_payment",
    amount,
    balanceAfter: newBalance,
    paymentMethod,
    referenceNo,
    notes: notes || `Payment received via ${paymentMethod}`,
    date: new Date(),
  });

  customer.currentBalance = newBalance;
  customer.updatedAt = new Date();
  await customer.save();

  return NextResponse.json({ customer, entry });
}
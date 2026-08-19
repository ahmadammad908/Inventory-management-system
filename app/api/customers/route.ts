import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";

export async function GET() {
  await connectDB();
  const customers = await Customer.find().sort({ createdAt: -1 });
  return NextResponse.json(customers);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const customer = await Customer.create({ ...body, currentBalance: 0 });
  return NextResponse.json(customer, { status: 201 });
}
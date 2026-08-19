import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ParkedCart from "@/models/ParkedCart";

export async function GET() {
  await connectDB();
  const parkedCarts = await ParkedCart.find().sort({ createdAt: -1 });
  return NextResponse.json(parkedCarts);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();

  const { title, items, customerId, discount } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
  }

  const parkedCart = await ParkedCart.create({
    title: title || `Order (${items.length} items)`,
    items,
    customerId,
    discount: discount || 0,
  });

  return NextResponse.json(parkedCart, { status: 201 });
}
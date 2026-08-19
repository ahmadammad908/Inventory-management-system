import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const { delta } = await req.json();

  const product = await Product.findById(params.id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  product.stock = Math.max(0, product.stock + delta);
  product.updatedAt = new Date();
  await product.save();

  return NextResponse.json(product);
}
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import ParkedCart from "@/models/ParkedCart";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  await ParkedCart.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
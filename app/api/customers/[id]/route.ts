import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const body = await req.json();
  const updated = await Customer.findByIdAndUpdate(
    params.id,
    { ...body, updatedAt: new Date() },
    { new: true }
  );
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  await Customer.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}
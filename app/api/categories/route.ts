import { NextResponse } from "next/server";
import { connectDB }from "../../../lib/mongodb"; // apke actual db connect util ka path lagayen
import { Category } from "@/models/category";

// GET: sab categories laane ke liye
export async function GET() {
  await connectDB();
  const categories = await Category.find().sort({ name: 1 });
  return NextResponse.json(categories);
}

// POST: nayi category save karne ke liye
export async function POST(req: Request) {
  await connectDB();

  const body = await req.json();
  const name = body?.name?.trim();

  if (!name) {
    return NextResponse.json(
      { error: "Category name is required." },
      { status: 400 }
    );
  }

  const existing = await Category.findOne({
    name: { $regex: `^${name}$`, $options: "i" },
  });

  if (existing) {
    return NextResponse.json(existing); // already exists, wahi return kar do
  }

  const category = await Category.create({ name });
  return NextResponse.json(category, { status: 201 });
}
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // adjust path if your DB helper lives elsewhere
import Supplier from "@/models/Supplier";

// GET /api/suppliers -> list all suppliers (optional ?search=&status=)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const query: Record<string, any> = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { contactPerson: { $regex: search, $options: "i" } },
        { category: { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.status = status;

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: suppliers });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}

// POST /api/suppliers -> create new supplier
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name || !body.phone) {
      return NextResponse.json(
        { success: false, message: "Supplier name and phone are required" },
        { status: 400 }
      );
    }

    const supplier = await Supplier.create({
      name: body.name,
      contactPerson: body.contactPerson || "",
      phone: body.phone,
      email: body.email || "",
      address: body.address || "",
      category: body.category || "General",
      status: body.status || "Active",
    });

    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create supplier" },
      { status: 500 }
    );
  }
}
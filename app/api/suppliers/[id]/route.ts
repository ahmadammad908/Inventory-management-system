import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Supplier from "@/models/Supplier";
import PurchaseOrder from "@/models/PurchaseOrder";

interface Params {
  params: { id: string };
}

// GET /api/suppliers/:id -> supplier details + their purchase history
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const supplier = await Supplier.findById(params.id);

    if (!supplier) {
      return NextResponse.json({ success: false, message: "Supplier not found" }, { status: 404 });
    }

    const purchaseHistory = await PurchaseOrder.find({ supplierId: params.id }).sort({
      purchaseDate: -1,
    });

    return NextResponse.json({ success: true, data: { supplier, purchaseHistory } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch supplier" },
      { status: 500 }
    );
  }
}

// PUT /api/suppliers/:id -> update supplier details
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const body = await req.json();

    const updated = await Supplier.findByIdAndUpdate(
      params.id,
      {
        ...(body.name && { name: body.name }),
        ...(body.contactPerson !== undefined && { contactPerson: body.contactPerson }),
        ...(body.phone && { phone: body.phone }),
        ...(body.email !== undefined && { email: body.email }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.category && { category: body.category }),
        ...(body.status && { status: body.status }),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update supplier" },
      { status: 500 }
    );
  }
}

// DELETE /api/suppliers/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    const existingPOs = await PurchaseOrder.countDocuments({ supplierId: params.id });
    if (existingPOs > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This supplier has purchase history. Set status to Inactive instead of deleting.",
        },
        { status: 400 }
      );
    }

    const deleted = await Supplier.findByIdAndDelete(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Supplier not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Supplier deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete supplier" },
      { status: 500 }
    );
  }
}
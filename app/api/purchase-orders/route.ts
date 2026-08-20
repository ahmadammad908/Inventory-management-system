import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PurchaseOrder from "@/models/PurchaseOrder";
import Supplier from "@/models/Supplier";

// GET /api/purchase-orders -> list all purchase orders (optional ?supplierId=&status=)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const supplierId = searchParams.get("supplierId");
    const paymentStatus = searchParams.get("status");

    const query: Record<string, any> = {};
    if (supplierId) query.supplierId = supplierId;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    const orders = await PurchaseOrder.find(query).sort({ purchaseDate: -1 });

    return NextResponse.json({ success: true, data: orders });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch purchase orders" },
      { status: 500 }
    );
  }
}

// POST /api/purchase-orders -> record a new purchase (goods received from supplier)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.supplierId || !body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: "supplierId and at least one item are required" },
        { status: 400 }
      );
    }

    const supplier = await Supplier.findById(body.supplierId);
    if (!supplier) {
      return NextResponse.json({ success: false, message: "Supplier not found" }, { status: 404 });
    }

    const totalAmount = body.items.reduce(
      (sum: number, item: any) => sum + Number(item.quantity) * Number(item.unitCost),
      0
    );
    const paidAmount = Number(body.paidAmount) || 0;

    const order = await PurchaseOrder.create({
      supplierId: supplier._id,
      supplierName: supplier.name,
      items: body.items,
      totalAmount,
      paidAmount,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
      notes: body.notes || "",
    });

    // Keep supplier's lifetime totals in sync (drives outstandingDue)
    supplier.totalPurchased = (supplier.totalPurchased || 0) + totalAmount;
    supplier.totalPaid = (supplier.totalPaid || 0) + paidAmount;
    await supplier.save();

    // NOTE: If you also want purchases to auto-flow into your existing
    // `ledger` module as inventory-cost/expense entries, add that call here,
    // similar to how salary payments can post to the ledger.

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create purchase order" },
      { status: 500 }
    );
  }
}
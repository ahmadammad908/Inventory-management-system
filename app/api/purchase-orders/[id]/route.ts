import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PurchaseOrder from "@/models/PurchaseOrder";
import Supplier from "@/models/Supplier";

interface Params {
  params: { id: string };
}

// PUT /api/purchase-orders/:id -> record a payment against this PO's due amount
// Body: { payAmount: number }
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const body = await req.json();
    const payAmount = Number(body.payAmount);

    if (!payAmount || payAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "payAmount must be greater than 0" },
        { status: 400 }
      );
    }

    const order = await PurchaseOrder.findById(params.id);
    if (!order) {
      return NextResponse.json({ success: false, message: "Purchase order not found" }, { status: 404 });
    }

    if (payAmount > order.dueAmount) {
      return NextResponse.json(
        { success: false, message: `Payment exceeds remaining due (${order.dueAmount})` },
        { status: 400 }
      );
    }

    order.paidAmount += payAmount;
    await order.save(); // pre-save hook recalculates dueAmount & paymentStatus

    const supplier = await Supplier.findById(order.supplierId);
    if (supplier) {
      supplier.totalPaid = (supplier.totalPaid || 0) + payAmount;
      await supplier.save();
    }

    return NextResponse.json({ success: true, data: order });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to record payment" },
      { status: 500 }
    );
  }
}

// DELETE /api/purchase-orders/:id -> remove a wrongly recorded purchase order
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const order = await PurchaseOrder.findById(params.id);
    if (!order) {
      return NextResponse.json({ success: false, message: "Purchase order not found" }, { status: 404 });
    }

    // Reverse the supplier's totals before deleting
    const supplier = await Supplier.findById(order.supplierId);
    if (supplier) {
      supplier.totalPurchased = Math.max(0, (supplier.totalPurchased || 0) - order.totalAmount);
      supplier.totalPaid = Math.max(0, (supplier.totalPaid || 0) - order.paidAmount);
      await supplier.save();
    }

    await PurchaseOrder.findByIdAndDelete(params.id);

    return NextResponse.json({ success: true, message: "Purchase order deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete purchase order" },
      { status: 500 }
    );
  }
}
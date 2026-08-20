import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SalaryPayment from "@/models/SalaryPayment";

interface Params {
  params: { id: string };
}

// DELETE /api/salary-payments/:id -> remove a wrongly recorded payment
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const deleted = await SalaryPayment.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Payment record deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete payment" },
      { status: 500 }
    );
  }
}
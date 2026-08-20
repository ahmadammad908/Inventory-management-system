import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SalaryPayment from "@/models/SalaryPayment";
import Employee from "@/models/Employee";

// NOTE: Adjust this import to match your actual Ledger model/path (you already
// have an `app/api/ledger` folder). This keeps salary payments flowing into
// your existing financial dashboard/reports automatically.
// import Ledger from "@/models/Ledger";

// GET /api/salary-payments -> list all payments (optional ?employeeId=&month=)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");
    const month = searchParams.get("month");

    const query: Record<string, any> = {};
    if (employeeId) query.employeeId = employeeId;
    if (month) query.monthYear = month;

    const payments = await SalaryPayment.find(query).sort({ paymentDate: -1 });

    return NextResponse.json({ success: true, data: payments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST /api/salary-payments -> record a new salary payout
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.employeeId || !body.amount || !body.monthYear) {
      return NextResponse.json(
        { success: false, message: "employeeId, amount and monthYear are required" },
        { status: 400 }
      );
    }

    const employee = await Employee.findById(body.employeeId);
    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    const payment = await SalaryPayment.create({
      employeeId: employee._id,
      employeeName: employee.name,
      amount: Number(body.amount),
      monthYear: body.monthYear,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
      paymentMethod: body.paymentMethod || "Cash",
      notes: body.notes || "",
    });

    // --- Auto-create a matching Ledger/Expense entry so it flows into
    // --- your Daily/Monthly/Annual reports and Financial Dashboard.
    // --- Uncomment and adjust field names to match your existing Ledger model.
    /*
    await Ledger.create({
      type: "expense",
      category: "Employee Salary",
      amount: payment.amount,
      description: `Salary - ${employee.name} (${payment.monthYear})`,
      date: payment.paymentDate,
      reference: payment._id,
    });
    */

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to record payment" },
      { status: 500 }
    );
  }
}
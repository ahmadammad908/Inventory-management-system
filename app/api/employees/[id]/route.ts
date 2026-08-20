import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Employee from "@/models/Employee";

interface Params {
  params: { id: string };
}

// GET /api/employees/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const employee = await Employee.findById(params.id);

    if (!employee) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: employee });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch employee" },
      { status: 500 }
    );
  }
}

// PUT /api/employees/:id -> update employee details
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const body = await req.json();

    const updated = await Employee.findByIdAndUpdate(
      params.id,
      {
        ...(body.name && { name: body.name }),
        ...(body.role && { role: body.role }),
        ...(body.phone && { phone: body.phone }),
        ...(body.baseSalary !== undefined && { baseSalary: Number(body.baseSalary) }),
        ...(body.status && { status: body.status }),
      },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to update employee" },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const deleted = await Employee.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Employee not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Employee deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete employee" },
      { status: 500 }
    );
  }
}
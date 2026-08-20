import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb"; // adjust path if your DB helper lives elsewhere
import Employee from "@/models/Employee";

// GET /api/employees  -> list all employees (optional ?search=&status=)
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
        { role: { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.status = status;

    const employees = await Employee.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: employees });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch employees" },
      { status: 500 }
    );
  }
}

// POST /api/employees -> create new employee
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name || body.baseSalary === undefined || body.baseSalary === null) {
      return NextResponse.json(
        { success: false, message: "Name and baseSalary are required" },
        { status: 400 }
      );
    }

    const employee = await Employee.create({
      name: body.name,
      role: body.role || "Staff Member",
      phone: body.phone || "N/A",
      baseSalary: Number(body.baseSalary),
      status: body.status || "Active",
    });

    return NextResponse.json({ success: true, data: employee }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create employee" },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Report from "@/models/Report";

interface Params {
  params: { id: string };
}

// GET /api/reports/:id -> fetch a single saved report snapshot
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const report = await Report.findById(params.id);

    if (!report) {
      return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to fetch report" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/:id -> remove a saved snapshot
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const deleted = await Report.findByIdAndDelete(params.id);

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Report deleted" });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to delete report" },
      { status: 500 }
    );
  }
}
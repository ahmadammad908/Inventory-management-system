import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Report from "@/models/Report";
import {
  computeReport,
  getDailyPeriod,
  getMonthlyPeriod,
  getAnnualPeriod,
  ReportPeriod,
} from "@/lib/reportEngine";

function resolvePeriod(type: string, dateParam: string | null): ReportPeriod {
  if (type === "monthly") return getMonthlyPeriod(dateParam || undefined);
  if (type === "annual") return getAnnualPeriod(dateParam || undefined);
  return getDailyPeriod(dateParam || undefined); // default: daily
}

// GET /api/reports?type=daily|monthly|annual&date=...           -> live-computed report
// GET /api/reports?archived=true&type=monthly                   -> list saved snapshots
// date format: daily -> "YYYY-MM-DD", monthly -> "YYYY-MM", annual -> "YYYY"
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "daily";
    const dateParam = searchParams.get("date");
    const archived = searchParams.get("archived");

    if (!["daily", "monthly", "annual"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "type must be daily, monthly, or annual" },
        { status: 400 }
      );
    }

    // Return saved/archived snapshots for this type, most recent first
    if (archived === "true") {
      const reports = await Report.find({ type }).sort({ periodStart: -1 }).limit(50);
      return NextResponse.json({ success: true, data: reports });
    }

    const period = resolvePeriod(type, dateParam);
    const totals = await computeReport(period);

    return NextResponse.json({
      success: true,
      data: {
        type,
        periodLabel: period.label,
        periodStart: period.start,
        periodEnd: period.end,
        totals,
        generatedAt: new Date(),
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}

// POST /api/reports -> compute AND save/archive a snapshot for record-keeping
// Body: { type: "daily"|"monthly"|"annual", date?: string }
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const type = body.type || "daily";

    if (!["daily", "monthly", "annual"].includes(type)) {
      return NextResponse.json(
        { success: false, message: "type must be daily, monthly, or annual" },
        { status: 400 }
      );
    }

    const period = resolvePeriod(type, body.date || null);
    const totals = await computeReport(period);

    // Upsert: re-generating the same period overwrites the saved snapshot
    const saved = await Report.findOneAndUpdate(
      { type, periodStart: period.start },
      {
        type,
        periodLabel: period.label,
        periodStart: period.start,
        periodEnd: period.end,
        totals,
        generatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, data: saved }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to save report" },
      { status: 500 }
    );
  }
}
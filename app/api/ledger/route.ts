import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import LedgerEntry from "@/models/LedgerEntry";

export async function GET() {
  await connectDB();
  const ledger = await LedgerEntry.find().sort({ createdAt: -1 });
  return NextResponse.json(ledger);
}
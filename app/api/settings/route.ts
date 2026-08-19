import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import StoreSettings from "@/models/StoreSettings";

export async function GET() {
  await connectDB();
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create({});
  }
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create(body);
  } else {
    Object.assign(settings, body);
    await settings.save();
  }
  return NextResponse.json(settings);
}
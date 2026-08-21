import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { Category } from "@/models/category";
import Customer from "@/models/Customer";
import Sale from "@/models/Sale";
import LedgerEntry from "@/models/LedgerEntry";
import ParkedCart from "@/models/ParkedCart";
import StoreSettings from "@/models/StoreSettings";

export async function POST() {
  await connectDB();

  await Promise.all([
    Product.deleteMany({}),
    Category.deleteMany({}),
    Customer.deleteMany({}),
    Sale.deleteMany({}),
    LedgerEntry.deleteMany({}),
    ParkedCart.deleteMany({}),
    StoreSettings.deleteMany({}),
  ]);

  return NextResponse.json({ success: true, message: "All data has been reset." });
}
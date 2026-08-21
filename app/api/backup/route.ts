import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { Category } from "@/models/category";
import Customer from "@/models/Customer";
import Sale from "@/models/Sale";
import LedgerEntry from "@/models/LedgerEntry";
import ParkedCart from "@/models/ParkedCart";
import StoreSettings from "@/models/StoreSettings";

const BACKUP_VERSION = 1;

export async function GET() {
  await connectDB();

  const [products, categories, customers, sales, ledger, parkedCarts, settings] = await Promise.all([
    Product.find().lean(),
    Category.find().lean(),
    Customer.find().lean(),
    Sale.find().lean(),
    LedgerEntry.find().lean(),
    ParkedCart.find().lean(),
    StoreSettings.find().lean(),
  ]);

  return NextResponse.json({
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: { products, categories, customers, sales, ledger, parkedCarts, settings },
  });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json().catch(() => null);

  if (!body?.data) {
    return NextResponse.json({ error: "Invalid backup file format." }, { status: 400 });
  }

  const { products, categories, customers, sales, ledger, parkedCarts, settings } = body.data;

  try {
    await Promise.all([
      Product.deleteMany({}),
      Category.deleteMany({}),
      Customer.deleteMany({}),
      Sale.deleteMany({}),
      LedgerEntry.deleteMany({}),
      ParkedCart.deleteMany({}),
      StoreSettings.deleteMany({}),
    ]);

    if (Array.isArray(categories) && categories.length) await Category.insertMany(categories);
    if (Array.isArray(products) && products.length) await Product.insertMany(products);
    if (Array.isArray(customers) && customers.length) await Customer.insertMany(customers);
    if (Array.isArray(sales) && sales.length) await Sale.insertMany(sales);
    if (Array.isArray(ledger) && ledger.length) await LedgerEntry.insertMany(ledger);
    if (Array.isArray(parkedCarts) && parkedCarts.length) await ParkedCart.insertMany(parkedCarts);
    if (Array.isArray(settings) && settings.length) await StoreSettings.insertMany(settings);

    return NextResponse.json({ success: true, message: "Backup restored successfully." });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Restore failed." }, { status: 500 });
  }
}
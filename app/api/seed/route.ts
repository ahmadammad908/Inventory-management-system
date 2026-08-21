import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import { Category } from "@/models/category";
import Customer from "@/models/Customer";

const SAMPLE_CATEGORIES = [
  "Beverages",
  "Rice & Grains",
  "Cooking Oil & Ghee",
  "Spices & Masala",
  "Dairy & Bakery",
  "Snacks & Biscuits",
  "Personal Care",
  "Household",
];

const SAMPLE_PRODUCTS: {
  name: string;
  sku: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStockAlert: number;
  category: string;
}[] = [
  { name: "Shan Chicken Karahi Masala 50g", sku: "SHN-CK-050", unit: "pcs", costPrice: 55, sellingPrice: 70, stock: 40, minStockAlert: 10, category: "Spices & Masala" },
  { name: "National Biryani Masala 50g", sku: "NAT-BR-050", unit: "pcs", costPrice: 50, sellingPrice: 65, stock: 35, minStockAlert: 10, category: "Spices & Masala" },
  { name: "Tapal Danedar 190g", sku: "TPL-DN-190", unit: "pcs", costPrice: 210, sellingPrice: 250, stock: 30, minStockAlert: 8, category: "Beverages" },
  { name: "Lipton Yellow Label 100 Bags", sku: "LPT-YL-100", unit: "pcs", costPrice: 380, sellingPrice: 440, stock: 20, minStockAlert: 5, category: "Beverages" },
  { name: "Olper's Milk 1L", sku: "OLP-MK-1L", unit: "pcs", costPrice: 190, sellingPrice: 215, stock: 50, minStockAlert: 15, category: "Dairy & Bakery" },
  { name: "Nestle Milkpak 1L", sku: "NST-MP-1L", unit: "pcs", costPrice: 195, sellingPrice: 220, stock: 45, minStockAlert: 15, category: "Dairy & Bakery" },
  { name: "Rooh Afza 800ml", sku: "HMD-RA-800", unit: "pcs", costPrice: 330, sellingPrice: 380, stock: 25, minStockAlert: 6, category: "Beverages" },
  { name: "Dalda Cooking Oil 1L", sku: "DLD-CO-1L", unit: "pcs", costPrice: 480, sellingPrice: 530, stock: 30, minStockAlert: 8, category: "Cooking Oil & Ghee" },
  { name: "Kashmir Banaspati Ghee 1kg", sku: "KSH-GH-1KG", unit: "pcs", costPrice: 520, sellingPrice: 575, stock: 20, minStockAlert: 5, category: "Cooking Oil & Ghee" },
  { name: "Guard Rice Super Basmati 1kg", sku: "GRD-RC-1KG", unit: "pcs", costPrice: 280, sellingPrice: 320, stock: 40, minStockAlert: 10, category: "Rice & Grains" },
  { name: "Sunridge Chanay Ki Daal 1kg", sku: "SNR-DL-1KG", unit: "pcs", costPrice: 220, sellingPrice: 255, stock: 30, minStockAlert: 8, category: "Rice & Grains" },
  { name: "LU Prince Biscuits", sku: "LU-PRN-001", unit: "pcs", costPrice: 35, sellingPrice: 45, stock: 60, minStockAlert: 15, category: "Snacks & Biscuits" },
  { name: "Lays Chips 40g", sku: "LAY-CH-040", unit: "pcs", costPrice: 40, sellingPrice: 50, stock: 55, minStockAlert: 15, category: "Snacks & Biscuits" },
  { name: "Coca Cola 1.5L", sku: "COK-15L-001", unit: "pcs", costPrice: 140, sellingPrice: 165, stock: 35, minStockAlert: 10, category: "Beverages" },
  { name: "Lifebuoy Soap 100g", sku: "LFB-SP-100", unit: "pcs", costPrice: 45, sellingPrice: 60, stock: 50, minStockAlert: 12, category: "Personal Care" },
  { name: "Surf Excel 1kg", sku: "SRF-EX-1KG", unit: "pcs", costPrice: 320, sellingPrice: 365, stock: 25, minStockAlert: 6, category: "Household" },
];

const SAMPLE_CUSTOMERS = [
  { name: "Imran Traders", phone: "0300-1112233", address: "Model Town, Lahore", currentBalance: 2500 },
  { name: "Bilal General Store", phone: "0301-2223344", address: "Satellite Town, Rahim Yar Khan", currentBalance: 0 },
  { name: "Ayesha Fatima", phone: "0333-4445566", address: "DHA Phase 5, Karachi", currentBalance: 850 },
  { name: "Usman Cash & Carry", phone: "0345-5556677", address: "G-9 Markaz, Islamabad", currentBalance: 4200 },
  { name: "Sana Khalid", phone: "0312-6667788", address: "Gulberg, Lahore", currentBalance: 0 },
];

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json().catch(() => ({}));
  const sample = body?.sample !== false;

  if (!sample) {
    return NextResponse.json({ success: true, message: "No sample flag set, nothing seeded." });
  }

  const categoryDocs: Record<string, any> = {};
  for (const name of SAMPLE_CATEGORIES) {
    const cat = await Category.findOneAndUpdate({ name }, { name }, { upsert: true, new: true });
    categoryDocs[name] = cat;
  }

  for (const p of SAMPLE_PRODUCTS) {
    const exists = await Product.findOne({ sku: p.sku });
    if (exists) continue;
    const { category, ...rest } = p;
    await Product.create({ ...rest, categoryId: categoryDocs[category]?._id });
  }

  for (const c of SAMPLE_CUSTOMERS) {
    const exists = await Customer.findOne({ phone: c.phone });
    if (exists) continue;
    await Customer.create(c);
  }

  return NextResponse.json({ success: true, message: "Sample Pakistani retail data seeded." });
}
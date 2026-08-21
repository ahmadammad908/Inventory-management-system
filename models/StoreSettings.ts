import { Schema, models, model } from "mongoose";

const StoreSettingsSchema = new Schema(
  {
    storeName: { type: String, default: "My Store" },
    tagline: { type: String, default: "" },
    phone: { type: String, default: "" },
    whatsapp: { type: String, default: "" },
    address: { type: String, default: "" },
    city: { type: String, default: "" },
    ntnNumber: { type: String, default: "" },
    strnNumber: { type: String, default: "" },
    receiptFooter: { type: String, default: "" },
    receiptHeaderNotice: { type: String, default: "" },
    defaultTaxRate: { type: Number, default: 0 },
    enableTax: { type: Boolean, default: false },
    currencySymbol: { type: String, default: "Rs." },
    defaultLowStockThreshold: { type: Number, default: 10 },
    receiptPaperSize: { type: String, enum: ["80mm", "58mm"], default: "80mm" },
    cashierName: { type: String, default: "Admin" },
  },
  { timestamps: true }
);

export default models.StoreSettings || model("StoreSettings", StoreSettingsSchema);
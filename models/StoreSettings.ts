import { Schema, models, model } from "mongoose";

const StoreSettingsSchema = new Schema(
  {
    storeName: { type: String, default: "My Store" },
    address: { type: String },
    phone: { type: String },
    defaultTaxRate: { type: Number, default: 0 },
    enableTax: { type: Boolean, default: false },
    cashierName: { type: String, default: "Admin" },
    currencySymbol: { type: String, default: "Rs." },
  },
  { timestamps: true }
);

export default models.StoreSettings || model("StoreSettings", StoreSettingsSchema);
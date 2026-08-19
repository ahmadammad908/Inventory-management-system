import { Schema, models, model } from "mongoose";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, required: true, unique: true },
    unit: { type: String, default: "pcs" },
    costPrice: { type: Number, required: true, default: 0 },
    sellingPrice: { type: Number, required: true, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    minStockAlert: { type: Number, default: 5 },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    barcode: { type: String },
    imageUrl: { type: String },
  },
  { timestamps: true }
);

export default models.Product || model("Product", ProductSchema);
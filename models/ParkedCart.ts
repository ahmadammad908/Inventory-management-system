import { Schema, models, model } from "mongoose";

const ParkedCartItemSchema = new Schema(
  {
    product: { type: Schema.Types.Mixed, required: true }, // snapshot of product
    quantity: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    discountType: { type: String, enum: ["fixed", "percent"], default: "fixed" },
    finalUnitPrice: { type: Number, required: true },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const ParkedCartSchema = new Schema(
  {
    title: { type: String, required: true },
    items: [ParkedCartItemSchema],
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    discount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.ParkedCart || model("ParkedCart", ParkedCartSchema);
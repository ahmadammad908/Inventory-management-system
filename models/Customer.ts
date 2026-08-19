import { Schema, models, model } from "mongoose";

const CustomerSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    currentBalance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default models.Customer || model("Customer", CustomerSchema);
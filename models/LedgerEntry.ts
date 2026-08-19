import { Schema, models, model } from "mongoose";

const LedgerEntrySchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    type: { type: String, enum: ["debit_sale", "credit_payment", "adjustment"], required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    invoiceId: { type: String },
    invoiceNo: { type: String },
    paymentMethod: { type: String },
    referenceNo: { type: String },
    notes: { type: String },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default models.LedgerEntry || model("LedgerEntry", LedgerEntrySchema);
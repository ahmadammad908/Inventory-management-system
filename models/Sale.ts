import { Schema, models, model } from "mongoose";

const SaleItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    sku: { type: String },
    costPrice: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const SaleSchema = new Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    items: [SaleItemSchema],
    subtotal: { type: Number, required: true },
    discountTotal: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },
    paymentMethod: { type: String, required: true }, // cash | card | udhaar | etc
    amountPaid: { type: Number, default: 0 },
    changeReturned: { type: Number, default: 0 },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String, default: "Walk-in Customer" },
    customerPhone: { type: String },
    paymentReference: { type: String },
    cashierName: { type: String },
    status: { type: String, enum: ["completed", "refunded"], default: "completed" },
    notes: { type: String },
  },
  { timestamps: true }
);

export default models.Sale || model("Sale", SaleSchema);
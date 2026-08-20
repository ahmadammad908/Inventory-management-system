import mongoose, { Schema, models, model, Document } from "mongoose";

export interface IPurchaseItem {
  productName: string;
  quantity: number;
  unitCost: number;
}

export interface IPurchaseOrder {
  supplierId: mongoose.Types.ObjectId | string;
  supplierName: string;
  items: IPurchaseItem[];
  totalAmount: number; // sum of all items (qty * unitCost)
  paidAmount: number; // how much has been paid so far against this PO
  dueAmount: number; // totalAmount - paidAmount (auto-calculated)
  paymentStatus: "Unpaid" | "Partial" | "Paid";
  purchaseDate: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Document version used by the schema/model/hooks (adds Mongoose's Document methods)
export interface IPurchaseOrderDocument extends IPurchaseOrder, Document {}

const PurchaseItemSchema = new Schema<IPurchaseItem>(
  {
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitCost: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrderDocument>(
  {
    supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    supplierName: { type: String, required: true },
    items: { type: [PurchaseItemSchema], required: true, default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, default: 0, min: 0 },
    dueAmount: { type: Number, default: 0, min: 0 },
    paymentStatus: { type: String, enum: ["Unpaid", "Partial", "Paid"], default: "Unpaid" },
    purchaseDate: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

// Keep dueAmount & paymentStatus in sync before saving
PurchaseOrderSchema.pre<IPurchaseOrderDocument>("save", function () {
  this.dueAmount = Math.max(0, this.totalAmount - this.paidAmount);
  if (this.paidAmount <= 0) this.paymentStatus = "Unpaid";
  else if (this.dueAmount <= 0) this.paymentStatus = "Paid";
  else this.paymentStatus = "Partial";
});

export default models.PurchaseOrder ||
  model<IPurchaseOrderDocument>("PurchaseOrder", PurchaseOrderSchema);

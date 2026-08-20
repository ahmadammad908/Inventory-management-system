import mongoose, { Schema, models, model } from "mongoose";

export interface ISupplier {
  _id?: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  address?: string;
  category?: string; // e.g. "Raw Material", "Packaging", "Electronics"
  status: "Active" | "Inactive";
  totalPurchased: number; // lifetime total value of goods purchased (auto-updated)
  totalPaid: number; // lifetime total amount paid to this supplier (auto-updated)
  createdAt?: Date;
  updatedAt?: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true, default: "" },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: "" },
    address: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "General" },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    totalPurchased: { type: Number, default: 0 },
    totalPaid: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Virtual: outstanding balance = totalPurchased - totalPaid
SupplierSchema.virtual("outstandingDue").get(function (this: ISupplier) {
  return Math.max(0, (this.totalPurchased || 0) - (this.totalPaid || 0));
});
SupplierSchema.set("toJSON", { virtuals: true });
SupplierSchema.set("toObject", { virtuals: true });

export default models.Supplier || model<ISupplier>("Supplier", SupplierSchema);
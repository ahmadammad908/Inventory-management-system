import mongoose, { Schema, models, model } from "mongoose";

export interface ISalaryPayment {
  _id?: string;
  employeeId: mongoose.Types.ObjectId | string;
  employeeName: string;
  amount: number;
  monthYear: string; // e.g. "August 2026"
  paymentDate: Date;
  paymentMethod: "Cash" | "Bank Transfer" | "EasyPaisa/JazzCash";
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const SalaryPaymentSchema = new Schema<ISalaryPayment>(
  {
    employeeId: { type: Schema.Types.ObjectId, ref: "Employee", required: true },
    employeeName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    monthYear: { type: String, required: true },
    paymentDate: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Bank Transfer", "EasyPaisa/JazzCash"],
      default: "Cash",
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default models.SalaryPayment ||
  model<ISalaryPayment>("SalaryPayment", SalaryPaymentSchema);
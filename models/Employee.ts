import mongoose, { Schema, models, model } from "mongoose";

export interface IEmployee {
  _id?: string;
  name: string;
  role: string;
  phone: string;
  baseSalary: number;
  status: "Active" | "Inactive";
  joinDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true, default: "Staff Member" },
    phone: { type: String, trim: true, default: "N/A" },
    baseSalary: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    joinDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Prevents "OverwriteModelError" during Next.js hot-reload
export default models.Employee || model<IEmployee>("Employee", EmployeeSchema);
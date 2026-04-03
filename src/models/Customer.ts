import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomerDocument extends Document {
  customerNumber: string;
  name: string;
  mobile: string;
  creditBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomerDocument>(
  {
    customerNumber: {
      type: String,
      required: [true, "Customer number is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
    },
    creditBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

CustomerSchema.index({ name: "text", customerNumber: "text", mobile: "text" });

const Customer: Model<ICustomerDocument> =
  mongoose.models.Customer ??
  mongoose.model<ICustomerDocument>("Customer", CustomerSchema);

export default Customer;
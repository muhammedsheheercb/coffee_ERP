import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISupplierDocument extends Document {
  supplierNumber: string;
  name: string;
  itemsProvided: mongoose.Types.ObjectId[];
  creditBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplierDocument>(
  {
    supplierNumber: {
      type: String,
      required: [true, "Supplier number is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
    },
    itemsProvided: [
      {
        type: Schema.Types.ObjectId,
        ref: "Item",
      },
    ],
    creditBalance: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

SupplierSchema.index({ name: "text", supplierNumber: "text" });

const Supplier: Model<ISupplierDocument> =
  mongoose.models.Supplier ??
  mongoose.model<ISupplierDocument>("Supplier", SupplierSchema);

export default Supplier;
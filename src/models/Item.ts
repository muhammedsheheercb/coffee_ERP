import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItemDocument extends Document {
  itemNumber: string;
  name: string;
  price: number;
  quantity: number;
  supplierRef?: mongoose.Types.ObjectId;
  supplierName?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema = new Schema<IItemDocument>(
  {
    itemNumber: {
      type: String,
      required: [true, "Item number is required"],
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    supplierRef: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },
    supplierName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

ItemSchema.index({ name: "text", itemNumber: "text" });

const Item: Model<IItemDocument> =
  mongoose.models.Item ?? mongoose.model<IItemDocument>("Item", ItemSchema);

export default Item;
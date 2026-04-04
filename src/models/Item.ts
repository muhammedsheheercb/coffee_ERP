import mongoose, { Schema, Document, Model } from "mongoose";

export interface IItemDocument extends Document {
  itemNumber: string;
  name: string;
  salesAmount: number; 
  purchaseAmount: number;
  quantity: number;
  manufacturingDate?: Date;
  expiryDate?: Date;
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
    salesAmount: {
      type: Number,
      required: false,
      default: 0,
    },
    purchaseAmount: {
      type: Number,
      required: false,
      default: 0,
    },
    quantity: {
      type: Number,
      required: false,
      min: [0, "Quantity cannot be negative"],
      default: 0,
    },
    manufacturingDate: { type: Date },
    expiryDate: { type: Date },
    supplierRef: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
    },
    supplierName: {
      type: String,
      trim: true,
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

ItemSchema.virtual("stockValue").get(function() {
  return (this.purchaseAmount || 0) * (this.quantity || 0);
});

ItemSchema.index({ name: "text", itemNumber: "text" });

if (mongoose.models.Item) {
  delete mongoose.models.Item;
}

const Item: Model<IItemDocument> = mongoose.model<IItemDocument>("Item", ItemSchema);

export default Item;
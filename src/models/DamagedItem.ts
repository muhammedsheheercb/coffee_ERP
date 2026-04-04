import mongoose, { Schema, Document } from "mongoose";

export interface IDamagedItem extends Document {
    itemNumber: string;
    itemName: string;
    itemId: string;
    quantity: number;
    reason: string;
    date: Date;
    disposed: boolean;
}

const DamagedItemSchema = new Schema<IDamagedItem>({
    itemNumber: { type: String, required: true },
    itemName: { type: String, required: true },
    itemId: { type: String, required: true, ref: "Item" },
    quantity: { type: Number, required: true },
    reason: { type: String, required: true },
    date: { type: Date, default: Date.now },
    disposed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.models.DamagedItem || mongoose.model<IDamagedItem>("DamagedItem", DamagedItemSchema);

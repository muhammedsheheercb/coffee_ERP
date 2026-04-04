import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DamagedItem from "@/models/DamagedItem";
import Item from "@/models/Item";
import mongoose from "mongoose";

export async function GET() {
  try {
    await connectDB();
    const items = await DamagedItem.find().sort({ createdAt: -1 });
    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch damaged items" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    await connectDB();
    const body = await req.json();

    // 1 — Create the damaged record
    const newDamaged = new DamagedItem(body);
    await newDamaged.save({ session: dbSession });

    // 2 — Decrease inventory
    await Item.findByIdAndUpdate(
      body.itemId,
      { $inc: { quantity: -body.quantity } },
      { session: dbSession }
    );

    await dbSession.commitTransaction();
    return NextResponse.json(newDamaged, { status: 201 });
  } catch (error: any) {
    await dbSession.abortTransaction();
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    dbSession.endSession();
  }
}

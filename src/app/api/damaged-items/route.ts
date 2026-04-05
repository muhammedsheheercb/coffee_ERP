import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import DamagedItem from "@/models/DamagedItem";
import Item from "@/models/Item";
import User from "@/models/User";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page  = parseInt(searchParams.get("page")  || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip  = (page - 1) * limit;

    const [items, total] = await Promise.all([
      DamagedItem.find()
        .populate("createdBy", "name")
        .populate("updatedBy", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      DamagedItem.countDocuments()
    ]);

    return NextResponse.json({
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch damaged items" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const body = await req.json();

    // 1 — Create the damaged record
    const newDamaged = new DamagedItem({
      ...body,
      createdBy: session.user.id,
      updatedBy: session.user.id,
    });
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

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Purchase from "@/models/Purchase";
import Item from "@/models/Item";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/purchases/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const purchase = await Purchase.findById(id).lean();
    if (!purchase) return NextResponse.json({ success: false, error: "Purchase not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: purchase });
  } catch (err) {
    console.error("[GET /api/purchases/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// PUT /api/purchases/:id
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const oldPurchase = await Purchase.findById(id);
    if (!oldPurchase) return NextResponse.json({ success: false, error: "Purchase not found" }, { status: 404 });

    // Reverse old inventory impact
    for (const item of oldPurchase.items) {
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: -item.quantity } });
    }

    // Update record
    const purchase = await Purchase.findByIdAndUpdate(id, body, { new: true, runValidators: true });

    // Apply new inventory impact
    if (purchase) {
        for (const item of purchase.items) {
          await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: item.quantity } });
        }
    }

    return NextResponse.json({ success: true, data: purchase });
  } catch (err: unknown) {
    console.error("[PUT /api/purchases/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// DELETE /api/purchases/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    
    const purchase = await Purchase.findById(id);
    if (!purchase) return NextResponse.json({ success: false, error: "Purchase not found" }, { status: 404 });

    // Reverse inventory impact before delete
    for (const item of purchase.items) {
      await Item.findByIdAndUpdate(item.itemId, { $inc: { quantity: -item.quantity } });
    }

    await Purchase.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Purchase deleted" });
  } catch (err) {
    console.error("[DELETE /api/purchases/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
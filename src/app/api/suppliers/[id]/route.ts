import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Supplier from "@/models/Supplier";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/suppliers/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const supplier = await Supplier.findById(id).populate("itemsProvided").lean();
    if (!supplier) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });

    const history = supplier.balanceHistory || [];
    const credit = supplier.creditBalance || 0;

    // AUTO-POPULATE FIX: If history is empty but there's a balance, return it as the first entry!
    if (history.length === 0 && credit !== 0) {
      history.push({
        date: supplier.createdAt || new Date(),
        amount: Math.abs(credit),
        type: credit > 0 ? "adjustment" : "payment",
        note: "Initial Opening Balance",
        paymentMethod: undefined 
      } as any);
    }

    return NextResponse.json({ 
        success: true, 
        data: {
            ...supplier,
            balanceHistory: history
        } 
    });
  } catch (err) {
    console.error("[GET /api/suppliers/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// PUT /api/suppliers/:id
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // Handle manual balance adjustment
    if (body.adjustAmount && body.adjustType) {
      const { adjustAmount, adjustType, note, date, paymentMethod } = body;
      const amount = Number(adjustAmount);
      
      const supplier = await Supplier.findById(id);
      if (!supplier) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });

      // Initialize balanceHistory if it doesn't exist
      if (!supplier.balanceHistory) supplier.balanceHistory = [];

      const prevOpening = supplier.openingBalance || 0;
      const prevCredit = supplier.creditBalance || 0;
      
      const newCredit = adjustType === "add" ? prevCredit + amount : prevCredit - amount;
      const newOpening = adjustType === "add" ? prevOpening + amount : prevOpening - amount;

      supplier.creditBalance = newCredit;
      supplier.openingBalance = newOpening;
      
      if (!supplier.balanceHistory) supplier.balanceHistory = [];
      supplier.balanceHistory.push({
        date: date ? new Date(date) : new Date(),
        amount: amount,
        type: "adjustment", // Map 'add' or 'subtract' to 'adjustment'
        paymentMethod: paymentMethod || "cash",
        note: note || "Manual adjustment"
      });

      await supplier.save();
      return NextResponse.json({ success: true, data: supplier });
    }

    const updates = { ...body };
    // DO NOT allow arbitrary overwriting of creditBalance via PUT /edit form anymore, 
    // it should be done through adjustments.
    if (body.openingBalance !== undefined) {
       // Keep creditBalance unchanged if editing core profile info
    }

    const supplier = await Supplier.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    if (!supplier) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: supplier });
  } catch (err: unknown) {
    console.error("[PUT /api/suppliers/:id]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/suppliers/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const supplier = await Supplier.findByIdAndDelete(id);
    if (!supplier) return NextResponse.json({ success: false, error: "Supplier not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Supplier deleted" });
  } catch (err) {
    console.error("[DELETE /api/suppliers/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
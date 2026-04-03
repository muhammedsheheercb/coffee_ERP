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

    return NextResponse.json({ success: true, data: supplier });
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

    const supplier = await Supplier.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
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
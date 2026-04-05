import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Item from "@/models/Item";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/items/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const item = await Item.findById(id)
      .populate("createdBy", "name")
      .populate("updatedBy", "name")
      .lean();
    if (!item) return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: item });
  } catch (err) {
    console.error("[GET /api/items/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// PUT /api/items/:id
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();
    body.updatedBy = session.user.id;

    const item = await Item.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!item) return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: item });
  } catch (err: unknown) {
    console.error("[PUT /api/items/:id]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/items/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const item = await Item.findByIdAndDelete(id);
    if (!item) return NextResponse.json({ success: false, error: "Item not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Item deleted" });
  } catch (err) {
    console.error("[DELETE /api/items/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
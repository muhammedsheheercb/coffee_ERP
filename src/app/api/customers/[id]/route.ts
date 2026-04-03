import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

// GET /api/customers/:id
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const customer = await Customer.findById(id).lean();
    if (!customer) return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: customer });
  } catch (err) {
    console.error("[GET /api/customers/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// PUT /api/customers/:id
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const customer = await Customer.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!customer) return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });

    return NextResponse.json({ success: true, data: customer });
  } catch (err: unknown) {
    console.error("[PUT /api/customers/:id]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE /api/customers/:id
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { id } = await params;
    const customer = await Customer.findByIdAndDelete(id);
    if (!customer) return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Customer deleted" });
  } catch (err) {
    console.error("[DELETE /api/customers/:id]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
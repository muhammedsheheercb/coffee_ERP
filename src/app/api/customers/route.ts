import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { generateUniqueNumber } from "@/lib/utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/customers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const search    = searchParams.get("search") || "";
    const page      = parseInt(searchParams.get("page") || "1");
    const limit     = parseInt(searchParams.get("limit") || "10");
    const sortBy    = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const skip      = (page - 1) * limit;

    const query = search
      ? { $or: [
          { name: { $regex: search, $options: "i" } },
          { customerNumber: { $regex: search, $options: "i" } },
          { mobile: { $regex: search, $options: "i" } },
        ]}
      : {};

    const [customers, total] = await Promise.all([
      Customer.find(query)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),
      Customer.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      data: customers,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[GET /api/customers]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

// POST /api/customers
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { creditBalance, balanceHistory, ...safeBody } = await req.json();
    const customerNumber = safeBody.customerNumber || generateUniqueNumber("CUST");
    const openingBalance = Number(safeBody.openingBalance || 0);

    const customer = await Customer.create({ 
        ...safeBody, 
        customerNumber,
        openingBalance,
        creditBalance: openingBalance,
        balanceHistory: openingBalance !== 0 ? [{
            date: new Date(),
            amount: openingBalance,
            type: "adjustment",
            paymentMethod: "credit",
            note: "Opening Balance"
        }] : []
    });

    // Re-fetch to ensure the full document with schema defaults and historical updates is returned
    const fullCustomer = await Customer.findById(customer._id).lean();

    return NextResponse.json({ success: true, data: fullCustomer }, { status: 201 });
  } catch (err: unknown) {
    console.error("[POST /api/customers]", err);
    const msg = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
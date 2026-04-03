import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Sale from "@/models/Sale";
import Purchase from "@/models/Purchase";
import Expense from "@/models/Expense";
import Customer from "@/models/Customer";
import Item from "@/models/Item";
import Supplier from "@/models/Supplier";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/dashboard
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { searchParams } = new URL(req.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const startDateParam = searchParams.get("startDate");
    const endDateParam   = searchParams.get("endDate");

    let matchRange: any = {
      date: {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31, 23, 59, 59),
      },
    };

    if (startDateParam && endDateParam) {
      matchRange = {
        date: {
          $gte: new Date(startDateParam),
          $lte: new Date(endDateParam),
        },
      };
    }

    const yearStart = new Date(year, 0, 1);
    const yearEnd   = new Date(year, 11, 31, 23, 59, 59);

    // ── KPI totals ──────────────────────────────────
    const [
      salesAgg,
      purchasesAgg,
      expensesAgg,
      totalCustomers,
      totalItems,
      totalSuppliers,
    ] = await Promise.all([
      Sale.aggregate([
        { $match: matchRange },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Purchase.aggregate([
        { $match: matchRange },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
      Expense.aggregate([
        { $match: matchRange },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Customer.countDocuments(),
      Item.countDocuments(),
      Supplier.countDocuments(),
    ]);

    const totalSales     = salesAgg[0]?.total ?? 0;
    const totalPurchases = purchasesAgg[0]?.total ?? 0;
    const totalExpenses  = expensesAgg[0]?.total ?? 0;
    const totalRevenue   = totalSales - totalPurchases - totalExpenses;

    // ── Monthly chart data ───────────────────────────
    const [monthlySales, monthlyPurchases, monthlyExpenses] = await Promise.all([
      Sale.aggregate([
        { $match: { date: { $gte: yearStart, $lte: yearEnd } } },
        { $group: {
          _id: { month: { $month: "$date" } },
          total: { $sum: "$total" },
        }},
        { $sort: { "_id.month": 1 } },
      ]),
      Purchase.aggregate([
        { $match: { date: { $gte: yearStart, $lte: yearEnd } } },
        { $group: {
          _id: { month: { $month: "$date" } },
          total: { $sum: "$total" },
        }},
        { $sort: { "_id.month": 1 } },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: yearStart, $lte: yearEnd } } },
        { $group: {
          _id: { month: { $month: "$date" } },
          total: { $sum: "$amount" },
        }},
        { $sort: { "_id.month": 1 } },
      ]),
    ]);

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const chartData = months.map((month, i) => {
      const m      = i + 1;
      const sales  = monthlySales.find(s => s._id.month === m)?.total ?? 0;
      const purch  = monthlyPurchases.find(p => p._id.month === m)?.total ?? 0;
      const expens = monthlyExpenses.find(e => e._id.month === m)?.total ?? 0;
      return { month, sales, purchases: purch, expenses: expens, revenue: sales - purch - expens };
    });

    return NextResponse.json({
      success: true,
      kpi: { totalSales, totalPurchases, totalExpenses, totalRevenue, totalCustomers, totalItems, totalSuppliers },
      chartData,
    });
  } catch (err) {
    console.error("[GET /api/dashboard]", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
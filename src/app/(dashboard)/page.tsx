"use client";
import { useEffect, useState, useCallback } from "react";
import { ShoppingBag, ShoppingCart, TrendingUp, Users, Package, Truck, Receipt, ArrowUpRight, ArrowDownRight } from "lucide-react";
import SalesChart from "@/components/dashboard/SalesChart";
import Spinner from "@/components/ui/Spinner";
import Modal from "@/components/ui/Modal";
import { IKpiData, IChartData } from "@/types";
import { formatCurrency } from "@/lib/utils";

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

const kpiConfig = [
    { key: "totalSales", label: "Total Sales", icon: ShoppingBag, color: "#6366f1", bg: "#eef2ff" },
    { key: "totalPurchases", label: "Total Purchases", icon: ShoppingCart, color: "#f59e0b", bg: "#fffbeb" },
    { key: "totalExpenses", label: "Total Expenses", icon: Receipt, color: "#ef4444", bg: "#fef2f2" },
    { key: "totalRevenue", label: "Net Profit", icon: TrendingUp, color: "#10b981", bg: "#ecfdf5" },
    { key: "totalReceivable", label: "Total Receivable", icon: ArrowUpRight, color: "#06b6d4", bg: "#ecfeff" },
    { key: "totalPayable", label: "Total Payable", icon: ArrowDownRight, color: "#f43f5e", bg: "#fff1f2" },
    { key: "totalCustomers", label: "Customers", icon: Users, color: "#3b82f6", bg: "#eff6ff" },
    { key: "totalItems", label: "Items", icon: Package, color: "#8b5cf6", bg: "#f5f3ff" },
    { key: "totalSuppliers", label: "Suppliers", icon: Truck, color: "#ec4899", bg: "#fdf2f8" },
];

export default function DashboardPage() {
    const [kpi, setKpi] = useState<IKpiData | null>(null);
    const [chart, setChart] = useState<IChartData[]>([]);
    const [year, setYear] = useState(new Date().getFullYear());
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [popupType, setPopupType] = useState<"sales" | "purchases" | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            let url = `/api/dashboard?year=${year}`;
            if (startDate && endDate) {
                url += `&startDate=${startDate}&endDate=${endDate}`;
            }
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
                setKpi(data.kpi);
                setChart(data.chartData);
            }
        } catch (err) {
            console.error("Dashboard load error:", err);
        } finally {
            setLoading(false);
        }
    }, [year, startDate, endDate]);

    useEffect(() => { load(); }, [load]);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px", padding: "8px 0" }}>
            {/* header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#111827", margin: 0 }}>Dashboard</h1>
                    <p style={{ fontSize: "14px", color: "#6b7280", margin: "4px 0 0" }}>Business overview</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>Start Date</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} 
                            style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", outline: "none" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>End Date</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} 
                            style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", outline: "none" }} />
                    </div>
                    {startDate && endDate && (
                        <button onClick={() => { setStartDate(""); setEndDate(""); }} 
                            style={{ marginTop: "20px", background: "none", border: "none", color: "#6366f1", fontSize: "13px", cursor: "pointer", fontWeight: 500 }}>Clear</button>
                    )}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "12px", color: "#6b7280", fontWeight: 500 }}>Year</label>
                        <select
                            value={year}
                            onChange={e => setYear((e.target.value === "" ? "" as any : Number(e.target.value)))}
                            style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "6px 12px", fontSize: "13px", outline: "none", minWidth: "100px" }}
                        >
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
                    <Spinner size="lg" />
                </div>
            ) : (
                <>
                    {/* KPI grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {kpiConfig.map(({ key, label, icon: Icon, color, bg }) => {
                            const val = kpi ? Number(kpi[key as keyof IKpiData]) : 0;
                            const isCurrency = ["totalSales", "totalPurchases", "totalExpenses", "totalRevenue", "totalReceivable", "totalPayable"].includes(key);
                            const displayVal = isCurrency ? formatCurrency(val).replace("OMR", "").trim() : String(val);
                            
                            // Net Profit color logic
                            let displayColor = "#111827";
                            if (key === "totalRevenue") {
                                displayColor = val < 0 ? "#ef4444" : "#10b981";
                            }

                            return (
                                <div 
                                    key={key} 
                                    onClick={() => {
                                        if (key === "totalSales") setPopupType("sales");
                                        else if (key === "totalPurchases") setPopupType("purchases");
                                    }}
                                    style={{ 
                                        background: "#fff", 
                                        border: "1px solid #e5e7eb", 
                                        borderRadius: "12px", 
                                        padding: "16px", 
                                        display: "flex", 
                                        alignItems: "center", 
                                        gap: "12px", 
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                                        cursor: (key === "totalSales" || key === "totalPurchases") ? "pointer" : "default" 
                                    }}
                                    className={(key === "totalSales" || key === "totalPurchases") ? "hover:border-indigo-300 transition-colors" : ""}
                                >
                                    <div style={{ background: bg, borderRadius: "10px", padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <Icon size={20} color={color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: "12px", color: "#6b7280", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</p>
                                        <p style={{ fontSize: "18px", fontWeight: 700, color: displayColor, margin: "2px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "flex", alignItems: "center", gap: "4px" }}>
                                            {isCurrency && (
                                                <span style={{ display: "flex", alignItems: "center" }}>
                                                    <img src="/images/money.webp" alt="Currency" style={{ width: "20px", height: "20px", objectFit: "contain" }} />
                                                </span>
                                            )}
                                            {displayVal}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* chart */}
                    <SalesChart data={chart} />

                    {/* Breakdown Modal */}
                    <Modal
                        open={!!popupType}
                        onClose={() => setPopupType(null)}
                        title={popupType === "sales" ? "Total Sales Breakdown" : "Total Purchases Breakdown"}
                    >
                        {popupType && kpi && (
                            <div className="flex flex-col gap-4 p-2">
                                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                                    <span className="font-semibold text-emerald-800">Cash {popupType === "sales" ? "Sales" : "Purchases"}</span>
                                    <span className="font-bold text-emerald-600 text-lg">
                                        {formatCurrency(popupType === "sales" ? (kpi.cashSales || 0) : (kpi.cashPurchases || 0))}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                                    <span className="font-semibold text-indigo-800">Bank (Online) {popupType === "sales" ? "Sales" : "Purchases"}</span>
                                    <span className="font-bold text-indigo-600 text-lg">
                                        {formatCurrency(popupType === "sales" ? (kpi.bankSales || 0) : (kpi.bankPurchases || 0))}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg border border-orange-100">
                                    <span className="font-semibold text-orange-800">Credit {popupType === "sales" ? "Sales" : "Purchases"}</span>
                                    <span className="font-bold text-orange-600 text-lg">
                                        {formatCurrency(popupType === "sales" ? (kpi.creditSales || 0) : (kpi.creditPurchases || 0))}
                                    </span>
                                </div>
                            </div>
                        )}
                    </Modal>
                </>
            )}
        </div>
    );
}
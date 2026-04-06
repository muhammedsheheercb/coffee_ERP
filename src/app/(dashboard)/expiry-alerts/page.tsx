"use client";
import React, { useEffect, useState } from "react";
import { AlertTriangle, Clock } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Badge from "@/components/ui/Badge";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency, formatDate } from "@/lib/utils";

interface ExpiringBatch {
    _id: string;
    itemNumber: string;
    name: string;
    batch: {
        batchNumber: string;
        purchaseNumber: string;
        quantity: number;
        purchasePrice: number;
        salePrice: number;
        manufacturingDate: string;
        expiryDate: string;
    };
}

export default function ExpiryAlertsPage() {
    const [data, setData] = useState<ExpiringBatch[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExpiryData = async () => {
            try {
                const res = await fetch("/api/reports/expiry");
                const result = await res.json();
                if (result.success) {
                    setData(result.data);
                }
            } catch (error) {
                console.error("Failed to fetch expiry data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchExpiryData();
    }, []);

    // Calculate days until expiry
    const getDaysDiff = (TargetDate: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(TargetDate);
        target.setHours(0, 0, 0, 0);
        const diffTime = target.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="page-container">
            <TopBar
                title="Nearest Expiry Products"
                subtitle="Items expiring within 7 days or already expired"
            />

            <div className="table-wrapper mt-4 overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="th">Item / Batch <ArrowUpDownIcon /></th>
                            <th className="th text-center">Status</th>
                            <th className="th text-right">Qty</th>
                            <th className="th text-right">Purchase Price</th>
                            <th className="th text-center">Mfg Date</th>
                            <th className="th text-center">Exp Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="py-16 text-center"><Spinner /></td></tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="py-16 text-center text-gray-400 text-sm">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                                            <AlertTriangle className="text-emerald-500" />
                                        </div>
                                        <p>No products are expiring within the next 7 days.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : data.map((item, idx) => {
                            const days = getDaysDiff(item.batch.expiryDate);
                            const expired = days < 0;
                            const today = days === 0;

                            return (
                                <tr key={`${item._id}-${idx}`} className="tr-hover">
                                    <td className="td">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-800">{item.name}</span>
                                            <span className="text-xs font-mono text-gray-500">
                                                {item.itemNumber} • Batch: {item.batch.batchNumber || item.batch.purchaseNumber || "N/A"}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="td text-center">
                                        {expired ? (
                                            <Badge variant="danger" label={`Expired ${Math.abs(days)}d ago`} />
                                        ) : today ? (
                                            <Badge variant="danger" label="Expires Today" />
                                        ) : (
                                            <Badge variant="warning" label={`Expires in ${days}d`} />
                                        )}
                                    </td>
                                    <td className="td text-right font-bold text-gray-800">
                                        {item.batch.quantity}
                                    </td>
                                    <td className="td text-right font-mono text-xs text-orange-600">
                                        {formatCurrency(item.batch.purchasePrice)}
                                    </td>
                                    <td className="td text-center text-sm text-gray-500">
                                        {item.batch.manufacturingDate ? formatDate(item.batch.manufacturingDate) : "-"}
                                    </td>
                                    <td className="td text-center text-sm font-semibold text-rose-600">
                                        {formatDate(item.batch.expiryDate)}
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const ArrowUpDownIcon = () => null; // Placeholder as Sort is generic to SQL primarily here

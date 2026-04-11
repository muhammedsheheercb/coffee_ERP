"use client";
import { X, FileDown, User, Calendar, Hash, CreditCard, Package } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface InvoiceItem {
    itemName: string;
    itemNumber: string;
    quantity: number;
    price: number;
    total: number;
    isFOC?: boolean;
    manufacturingDate?: string;
    expiryDate?: string;
}

interface InvoiceData {
    _id: string;
    number: string;
    customerOrSupplier: string;
    customerOrSupplierNumber: string;
    date: Date | string;
    paymentType: string;
    items: InvoiceItem[];
    subtotal: number;
    tax: number;
    total: number;
    type: "Sale" | "Purchase";
}

interface InvoiceModalProps {
    open: boolean;
    onClose: () => void;
    data: InvoiceData | null;
}

export default function InvoiceModal({ open, onClose, data }: InvoiceModalProps) {
    if (!open || !data) return null;

    const subtotal = data.subtotal || 0;
    const tax = data.tax || 0;
    const taxAmt = subtotal * (tax / 100);

    const generatePDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text(`${data.type} Invoice`, 14, 20);
        doc.setFontSize(11);
        doc.text(`${data.type === "Sale" ? "Customer" : "Supplier"}: ${data.customerOrSupplier}`, 14, 32);
        doc.text(`Number: ${data.customerOrSupplierNumber}`, 14, 39);
        doc.text(`Invoice #: ${data.number}`, 14, 46);
        doc.text(`Cafe Direct`, 14, 53);
        doc.text(`Date: ${formatDate(data.date)}`, 14, 60);
        doc.text(`Payment: ${data.paymentType.toUpperCase()}`, 14, 67);

        autoTable(doc, {
            startY: 77,
            head: [["#", "Item", "Details", "Qty", "Price", data.type === "Purchase" ? "Stock Value" : "Total"]],
            body: data.items.map((item, i) => [
                i + 1,
                item.itemName + (item.isFOC ? " (FOC)" : ""),
                `MFG: ${item.manufacturingDate ? formatDate(item.manufacturingDate) : "-"}\nEXP: ${item.expiryDate ? formatDate(item.expiryDate) : "-"}`,
                item.quantity,
                item.isFOC ? "0.00" : formatCurrency(item.price),
                formatCurrency(item.total)
            ]),
            foot: [
                ["", "", "", "", "Subtotal", formatCurrency(subtotal)],
                ["", "", "", "", `Tax (${tax}%)`, formatCurrency(taxAmt)],
                ["", "", "", "", "Total", formatCurrency(data.total)],
            ],
            styles: { fontSize: 9 },
            footStyles: { fontStyle: "bold" },
        });

        doc.save(`invoice-${data.number}.pdf`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{data.type} Invoice</h3>
                        <p className="text-sm text-gray-500 font-mono">{data.number}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
                    {/* Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
                                <User size={10} /> {data.type === "Sale" ? "Customer" : "Supplier"}
                            </label>
                            <p className="text-sm font-semibold text-gray-800 truncate">{data.customerOrSupplier}</p>
                            <p className="text-xs text-gray-500">{data.customerOrSupplierNumber}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
                                <Calendar size={10} /> Date
                            </label>
                            <p className="text-sm font-semibold text-gray-800">{formatDate(data.date)}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
                                <CreditCard size={10} /> Payment
                            </label>
                            <Badge 
                                label={data.paymentType} 
                                variant={data.paymentType === "cash" ? "success" : data.paymentType === "credit" ? "warning" : "info"} 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5">
                                <Package size={10} /> Items
                            </label>
                            <p className="text-sm font-semibold text-gray-800">{data.items.length} Units</p>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border border-gray-100 rounded-xl overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider">Item Details</th>
                                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider">MFG / EXP</th>
                                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider text-right">Qty</th>
                                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider text-right">Price</th>
                                    <th className="px-4 py-3 text-[10px] uppercase font-bold text-gray-400 tracking-wider text-right">{data.type === "Purchase" ? "Stock Value" : "Total"}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-sm">
                                {data.items.map((item, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-800">{item.itemName}</p>
                                            <p className="text-[10px] font-mono text-gray-400">{item.itemNumber}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-bold text-gray-400 w-6">MFG</span>
                                                    <span className="text-[10px] text-gray-600 font-medium">{item.manufacturingDate ? formatDate(item.manufacturingDate) : "—"}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] font-bold text-gray-400 w-6">EXP</span>
                                                    <span className="text-[10px] text-amber-600 font-bold">{item.expiryDate ? formatDate(item.expiryDate) : "—"}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right text-gray-600">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right text-gray-600">{item.isFOC ? "—" : formatCurrency(item.price)}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                                            {item.isFOC ? (
                                                <span className="text-emerald-600 font-bold px-1.5 py-0.5 bg-emerald-50 rounded text-[10px] uppercase tracking-wider">FREE</span>
                                            ) : (
                                                formatCurrency(item.total)
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals Section */}
                    <div className="flex justify-end p-2">
                        <div className="w-64 space-y-3">
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Subtotal</span>
                                <span className="font-medium text-gray-700">{formatCurrency(subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-500">
                                <span>Tax ({tax}%)</span>
                                <span className="font-medium text-gray-700">{formatCurrency(taxAmt)}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-gray-800 border-t border-gray-100 pt-3">
                                <span>Total Amount</span>
                                <span className="text-indigo-600">{formatCurrency(data.total)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button icon={<FileDown size={16} />} onClick={generatePDF}>Download PDF</Button>
                </div>
            </div>
        </div>
    );
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SearchSelect from "@/components/ui/SearchSelect";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { usePurchases } from "@/hooks/usePurchases";
import { ISupplier, IItem, IPurchaseItem, ISelectOption, PaymentType } from "@/types";
import { formatCurrency, formatDateInput } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { FileDown } from "lucide-react";

interface CartItem extends IPurchaseItem { _itemRef: IItem }

export default function NewPurchasePage() {
    const router = useRouter();
    const { createPurchase } = usePurchases();

    const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
    const [items, setItems] = useState<IItem[]>([]);
    const [selSupplier, setSelSupplier] = useState<ISelectOption | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentType, setPaymentType] = useState<PaymentType>("cash");
    const [tax, setTax] = useState(0);
    const [date, setDate] = useState(formatDateInput(new Date()));
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            const [sr, ir] = await Promise.all([
                fetch("/api/suppliers?limit=500").then(r => r.json()),
                fetch("/api/items?limit=500").then(r => r.json()),
            ]);
            if (sr.success) setSuppliers(sr.data);
            if (ir.success) setItems(ir.data);
        };
        load();
    }, []);

    const supplierOptions: ISelectOption[] = suppliers.map(s => ({
        value: s._id, label: `${s.name} (${s.supplierNumber})`, data: s,
    }));

    const itemOptions: ISelectOption[] = items.map(i => ({
        value: i._id, label: `${i.name} — ${formatCurrency(i.price)}`, data: i,
    }));

    const addItem = (opt: ISelectOption | null) => {
        if (!opt) return;
        const item = opt.data as IItem;
        if (cart.find(c => c.itemId === item._id)) return;
        setCart(prev => [...prev, {
            itemId: item._id, itemNumber: item.itemNumber, itemName: item.name,
            quantity: 1, price: item.price, total: item.price, _itemRef: item,
        }]);
    };

    const updateQty = (idx: number, qty: number) => {
        setCart(prev => prev.map((c, i) => i === idx ? { ...c, quantity: qty, total: c.price * qty } : c));
    };

    const updatePrice = (idx: number, price: number) => {
        setCart(prev => prev.map((c, i) => i === idx ? { ...c, price, total: price * c.quantity } : c));
    };

    const removeItem = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

    const subtotal = cart.reduce((s, c) => s + c.total, 0);
    const taxAmt = subtotal * (tax / 100);
    const total = subtotal + taxAmt;

    const handleSave = async () => {
        if (!selSupplier || cart.length === 0) return;
        setSaving(true);
        const supplier = selSupplier.data as ISupplier;
        const ok = await createPurchase({
            supplierId: supplier._id, supplierName: supplier.name,
            supplierNumber: supplier.supplierNumber,
            items: cart.map(({ _itemRef: _, ...rest }) => rest),
            subtotal, tax, total, paymentType, date,
        });
        setSaving(false);
        if (ok) router.push("/purchases");
    };

    const generatePDF = () => {
        if (!selSupplier || cart.length === 0) return;
        const supplier = selSupplier.data as ISupplier;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Purchase Invoice", 14, 20);
        doc.setFontSize(11);
        doc.text(`Supplier: ${supplier.name} (${supplier.supplierNumber})`, 14, 32);
        doc.text(`Date: ${date}`, 14, 46);
        doc.text(`Payment: ${paymentType.toUpperCase()}`, 14, 53);
        autoTable(doc, {
            startY: 62,
            head: [["#", "Item", "Qty", "Price", "Total"]],
            body: cart.map((c, i) => [i + 1, c.itemName, c.quantity, formatCurrency(c.price), formatCurrency(c.total)]),
            foot: [
                ["", "", "", "Subtotal", formatCurrency(subtotal)],
                ["", "", "", `Tax (${tax}%)`, formatCurrency(taxAmt)],
                ["", "", "", "Total", formatCurrency(total)],
            ],
            styles: { fontSize: 10 },
            footStyles: { fontStyle: "bold" },
        });
        doc.save(`purchase-${Date.now()}.pdf`);
    };

    return (
        <div className="page-container max-w-4xl">
            <TopBar title="New Purchase" subtitle="Record a new purchase from a supplier" />

            <div className="card p-6 flex flex-col gap-6">
                {/* supplier + date */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <SearchSelect
                            label="Supplier"
                            placeholder="Search supplier…"
                            options={supplierOptions}
                            value={selSupplier}
                            onChange={setSelSupplier}
                            required
                        />
                    </div>
                    <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>

                {/* payment type + tax */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Payment type <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                            {(["cash", "credit", "debit"] as PaymentType[]).map(t => (
                                <button key={t} onClick={() => setPaymentType(t)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize
                    ${paymentType === t ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Input label="Tax (%)" type="number" min={0} max={100} value={tax}
                        onChange={e => setTax(Number(e.target.value))}
                        hint="Enter purchase tax percentage" />
                </div>

                {/* add item */}
                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Add item</label>
                    <SearchSelect placeholder="Search and select item…" options={itemOptions} value={null} onChange={addItem} />
                </div>

                {/* cart */}
                {cart.length > 0 ? (
                    <div className="table-wrapper">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="th">Item</th>
                                    <th className="th text-right w-36">Unit price (₹)</th>
                                    <th className="th text-center w-28">Quantity</th>
                                    <th className="th text-right">Total</th>
                                    <th className="th w-10" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cart.map((c, idx) => (
                                    <tr key={c.itemId}>
                                        <td className="td">
                                            <div className="font-medium text-gray-800">{c.itemName}</div>
                                            <div className="text-xs text-gray-400">{c.itemNumber}</div>
                                        </td>
                                        <td className="td">
                                            <input type="number" min={0} step="0.01" value={c.price}
                                                onChange={e => updatePrice(idx, Number(e.target.value))}
                                                className="input-base text-right w-28 ml-auto block" />
                                        </td>
                                        <td className="td">
                                            <input type="number" min={1} value={c.quantity}
                                                onChange={e => updateQty(idx, Number(e.target.value))}
                                                className="input-base text-center w-24 mx-auto block" />
                                        </td>
                                        <td className="td text-right font-semibold">{formatCurrency(c.total)}</td>
                                        <td className="td text-center">
                                            <Button variant="ghost" size="xs" icon={<Trash2 size={14} className="text-red-500" />}
                                                onClick={() => removeItem(idx)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-200 rounded-xl py-12 text-center text-gray-400">
                        <Plus size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Search and add items above</p>
                    </div>
                )}

                {/* totals */}
                {cart.length > 0 && (
                    <div className="flex flex-col items-end gap-1 text-sm">
                        <div className="flex gap-8 text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                        <div className="flex gap-8 text-gray-500"><span>Tax ({tax}%)</span><span>{formatCurrency(taxAmt)}</span></div>
                        <div className="flex gap-8 text-lg font-bold text-gray-800 border-t border-gray-200 pt-2 mt-1">
                            <span>Total Amount</span><span className="text-amber-600">{formatCurrency(total)}</span>
                        </div>
                    </div>
                )}

                {/* actions */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <Button variant="outline" icon={<FileDown size={16} />} onClick={generatePDF}
                        disabled={!selSupplier || cart.length === 0}>
                        Download PDF
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={() => router.push("/purchases")}>Cancel</Button>
                        <Button onClick={() => setConfirmOpen(true)} disabled={!selSupplier || cart.length === 0}>
                            Save Purchase
                        </Button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleSave}
                title="Confirm Purchase"
                message={`Save purchase of ${formatCurrency(total)} from ${selSupplier?.label ?? ""}? Item quantities will be increased automatically.`}
                confirmLabel="Save Purchase"
                variant="info"
                loading={saving}
            />
        </div>
    );
}
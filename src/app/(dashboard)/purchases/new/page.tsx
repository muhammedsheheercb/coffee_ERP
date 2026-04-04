"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileDown, Minus, Plus as PlusIcon } from "lucide-react";
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
import { useSession } from "next-auth/react";

interface CartItem extends IPurchaseItem {
    _itemRef: IItem;
}

export default function NewPurchasePage() {
    const router = useRouter();
    const { createPurchase } = usePurchases();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            const isAdmin = session?.user?.role === "admin";
            const canCreate = isAdmin || (session?.user?.permissions as any)?.purchases?.create;
            if (!canCreate) {
                router.push("/purchases");
            }
        }
    }, [session, status, router]);

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
        value: s._id,
        label: `${s.name} (${s.supplierNumber})`,
        data: s,
    }));

    const itemOptions: ISelectOption[] = items.map(i => ({
        value: i._id,
        label: `${i.name} — Cost: ${formatCurrency(i.purchaseAmount || 0)} | Sale: ${formatCurrency(i.salesAmount || 0)}`,
        data: i,
    }));

    const addItem = (opt: ISelectOption | null) => {
        if (!opt) return;
        const item = opt.data as IItem;
        if (cart.find(c => c.itemId === item._id)) return;
        setCart(prev => [...prev, {
            itemId: item._id,
            itemNumber: item.itemNumber,
            itemName: item.name,
            quantity: 1,
            price: item.purchaseAmount || 0, // Default to last purchase price
            sellingPrice: item.salesAmount || 0, // Default to current selling price
            total: (item.purchaseAmount || 0),
            manufacturingDate: item.manufacturingDate ? formatDateInput(item.manufacturingDate) : "",
            expiryDate: item.expiryDate ? formatDateInput(item.expiryDate) : "",
            batch: "",
            _itemRef: item,
        }]);
    };

    const updateItem = (idx: number, updates: Partial<CartItem>) => {
        setCart(prev => prev.map((c, i) => {
            if (i !== idx) return c;
            const updated = { ...c, ...updates };
            if (updated.quantity < 1) updated.quantity = 1;
            updated.total = updated.price * updated.quantity;
            return updated;
        }));
    };

    const removeItem = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

    const subtotal = cart.reduce((s, c) => s + c.total, 0);
    const taxAmt = subtotal * (tax / 100);
    const total = subtotal + taxAmt;

    const handleSave = async () => {
        if (!selSupplier || cart.length === 0) return;

        // Validation: Mfg, Exp dates and Selling Price are mandatory
        for (const item of cart) {
            if (!item.manufacturingDate || !item.expiryDate) {
                alert(`Please provide manufacturing and expiry dates for ${item.itemName}`);
                setConfirmOpen(false);
                return;
            }
            if (!item.sellingPrice || item.sellingPrice <= 0) {
                alert(`Please provide a valid Selling Price for ${item.itemName}`);
                setConfirmOpen(false);
                return;
            }
        }

        setSaving(true);
        const supplier = selSupplier.data as ISupplier;
        const ok = await createPurchase({
            supplierId: supplier._id,
            supplierName: supplier.name,
            supplierNumber: supplier.supplierNumber,
            items: cart.map(({ _itemRef: _, ...rest }) => rest),
            subtotal,
            tax,
            total,
            paymentType,
            date,
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
            head: [["#", "Item", "Batch", "Mfg", "Exp", "Qty", "Price", "Stock Value"]],
            body: cart.map((c, i) => [
                i + 1, 
                c.itemName, 
                c.batch || "-", 
                c.manufacturingDate || "-", 
                c.expiryDate || "-", 
                c.quantity, 
                formatCurrency(c.price), 
                formatCurrency(c.total)
            ]),
            foot: [
                ["", "", "", "", "", "Subtotal", formatCurrency(subtotal)],
                ["", "", "", "", "", `Tax (${tax}%)`, formatCurrency(taxAmt)],
                ["", "", "", "", "", "Total", formatCurrency(total)],
            ],
            styles: { fontSize: 8 },
            headStyles: { fillColor: [4, 120, 87] },
            footStyles: { fontStyle: "bold", fillColor: [249, 250, 251], textColor: [31, 41, 55] },
        });
        doc.save(`purchase-${Date.now()}.pdf`);
    };

    return (
        <div className="page-container max-w-6xl">
            <TopBar title="New Purchase" subtitle="Record a new purchase from a supplier" />

            <div className="card p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <SearchSelect
                            label="Supplier"
                            placeholder="Select supplier..."
                            options={supplierOptions}
                            value={selSupplier}
                            onChange={setSelSupplier}
                            required
                        />
                    </div>
                    <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1.5">Payment Method <span className="text-red-500">*</span></label>
                        <div className="flex gap-2">
                            <button 
                              type="button" 
                              onClick={() => setPaymentType("cash")} 
                              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2
                                ${paymentType === 'cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${paymentType === 'cash' ? 'bg-emerald-500' : 'bg-gray-200'}`}></span>
                              CASH
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setPaymentType("bank")} 
                              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2
                                ${paymentType === 'bank' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${paymentType === 'bank' ? 'bg-indigo-500' : 'bg-gray-200'}`}></span>
                              BANK
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setPaymentType("credit")} 
                              className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all flex items-center justify-center gap-2
                                ${paymentType === 'credit' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${paymentType === 'credit' ? 'bg-amber-500' : 'bg-gray-200'}`}></span>
                              CREDIT (DEBT)
                            </button>
                        </div>
                    </div>
                    <Input label="Tax (%)" type="number" min={0} max={100} value={tax}
                        onChange={e => setTax(Number(e.target.value))}
                        placeholder="0"
                        hint="Enter purchase tax percentage" />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Search & Add Items</label>
                    <SearchSelect placeholder="Search items..." options={itemOptions} value={null} onChange={addItem} />
                </div>

                {cart.length > 0 ? (
                    <div className="table-wrapper border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr className="border-b border-gray-200">
                                    <th className="th text-left w-[25%]">Item Details</th>
                                    <th className="th">Batch</th>
                                    <th className="th">Mfg Date</th>
                                    <th className="th">Exp Date</th>
                                    <th className="th text-center w-32">Quantity</th>
                                    <th className="th text-right">Purchase Price</th>
                                    <th className="th text-right">Sales Price</th>
                                    <th className="th text-right">Stock Value</th>
                                    <th className="th w-10 px-0" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cart.map((c, idx) => (
                                    <tr key={c.itemId} className="align-top">
                                        <td className="td text-left">
                                            <div className="font-semibold text-gray-900">{c.itemName}</div>
                                            <div className="text-[10px] font-mono text-gray-400 mt-0.5">{c.itemNumber}</div>
                                        </td>
                                        <td className="td">
                                            <input
                                                type="text"
                                                placeholder="Batch"
                                                value={c.batch}
                                                onChange={e => updateItem(idx, { batch: e.target.value })}
                                                className="w-full px-2 py-1.5 text-xs text-right border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </td>
                                        <td className="td">
                                            <input
                                                type="date"
                                                required
                                                value={c.manufacturingDate}
                                                onChange={e => updateItem(idx, { manufacturingDate: e.target.value })}
                                                className={`w-full px-2 py-1.5 text-[10px] text-right border rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${!c.manufacturingDate ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                            />
                                        </td>
                                        <td className="td">
                                            <input
                                                type="date"
                                                required
                                                value={c.expiryDate}
                                                onChange={e => updateItem(idx, { expiryDate: e.target.value })}
                                                className={`w-full px-2 py-1.5 text-[10px] text-right border rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${!c.expiryDate ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                                            />
                                        </td>
                                        <td className="td">
                                            <div className="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 p-0.5">
                                                <button 
                                                    onClick={() => updateItem(idx, { quantity: c.quantity - 1 })}
                                                    className="p-1 hover:bg-white rounded hover:shadow-xs text-gray-500 transition-all disabled:opacity-30"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <input
                                                    type="number" min={1} value={c.quantity}
                                                    onChange={e => updateItem(idx, { quantity: Number(e.target.value) })}
                                                    className="w-12 text-center bg-transparent text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button 
                                                    onClick={() => updateItem(idx, { quantity: c.quantity + 1 })}
                                                    className="p-1 hover:bg-white rounded hover:shadow-xs text-gray-500 transition-all disabled:opacity-30"
                                                >
                                                    <PlusIcon size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="td">
                                            <input type="number" min={0} step="0.001" value={c.price}
                                                onChange={e => updateItem(idx, { price: Number(e.target.value) })}
                                                className="w-24 px-2 py-1.5 text-xs text-right border border-gray-200 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 ml-auto block" />
                                        </td>
                                        <td className="td">
                                            <input type="number" min={0} step="0.001" value={c.sellingPrice}
                                                onChange={e => updateItem(idx, { sellingPrice: Number(e.target.value) })}
                                                className={`w-24 px-2 py-1.5 text-xs text-right border rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ml-auto block ${!c.sellingPrice ? 'border-red-300 bg-red-50' : 'border-gray-200'}`} />
                                        </td>
                                        <td className="td text-right font-bold text-gray-900">{formatCurrency(c.total)}</td>
                                        <td className="td">
                                            <Button variant="ghost" size="xs" icon={<Trash2 size={15} className="text-red-400 hover:text-red-600" />}
                                                onClick={() => removeItem(idx)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-100 rounded-2xl py-16 text-center text-gray-400 bg-gray-50/30">
                        <Plus size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">Add items from the search bar above</p>
                    </div>
                )}

                {cart.length > 0 && (
                    <div className="flex flex-col items-end gap-1.5 px-2 py-4 bg-gray-50/50 rounded-xl border border-gray-100">
                        <div className="flex gap-12 text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span className="font-mono">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex gap-12 text-sm text-gray-500">
                            <span>Tax ({tax}%)</span>
                            <span className="font-mono">{formatCurrency(taxAmt)}</span>
                        </div>
                        <div className="h-px w-48 bg-gray-200 my-1" />
                        <div className="flex gap-12 text-xl font-bold text-gray-900">
                            <span>Total Payable</span>
                            <span className="text-amber-600 font-mono underline decoration-amber-200 decoration-2 underline-offset-4">{formatCurrency(total)}</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center pt-4">
                    <Button variant="outline" icon={<FileDown size={18} />} onClick={generatePDF}
                        disabled={!selSupplier || cart.length === 0}
                        className="px-6"
                    >
                        Export Purchase Doc
                    </Button>
                    <div className="flex gap-4">
                        <button onClick={() => router.push("/purchases")} className="text-sm font-semibold text-gray-500 hover:text-gray-700 underline-offset-4 hover:underline">
                            Discard
                        </button>
                        <Button onClick={() => setConfirmOpen(true)} disabled={!selSupplier || cart.length === 0} className="px-10 h-11">
                            Complete Purchase
                        </Button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleSave}
                title="Confirm Purchase"
                message={`Save purchase of ${formatCurrency(total)} from ${selSupplier?.label ?? ""}? Item quantities will be updated automatically.`}
                confirmLabel="Confirm Purchase"
                variant="info"
                loading={saving}
            />
        </div>
    );
}
"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Plus, Trash2, Save, FileDown, Pencil } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SearchSelect from "@/components/ui/SearchSelect";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";
import { usePurchases } from "@/hooks/usePurchases";
import { ISupplier, IItem, IPurchaseItem, ISelectOption, PaymentType } from "@/types";
import { formatCurrency, formatDateInput } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import toast from "react-hot-toast";

interface CartItem extends IPurchaseItem { _itemRef?: IItem }

export default function EditPurchasePage() {
    const router = useRouter();
    const { id } = useParams();
    const { updatePurchase } = usePurchases();

    const [suppliers, setSuppliers] = useState<ISupplier[]>([]);
    const [items, setItems] = useState<IItem[]>([]);
    const [selSupplier, setSelSupplier] = useState<ISelectOption | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentType, setPaymentType] = useState<PaymentType>("cash");
    const [tax, setTax] = useState(0);
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [sr, ir, pr] = await Promise.all([
                    fetch("/api/suppliers?limit=500").then(r => r.json()),
                    fetch("/api/items?limit=500").then(r => r.json()),
                    fetch(`/api/purchases/${id}`).then(r => r.json()),
                ]);
                if (sr.success) setSuppliers(sr.data);
                if (ir.success) setItems(ir.data);
                if (pr.success) {
                    const p = pr.data;
                    setSelSupplier({ value: p.supplierId, label: `${p.supplierName} (${p.supplierNumber})`, data: { _id: p.supplierId, name: p.supplierName, supplierNumber: p.supplierNumber } as ISupplier });
                    setCart(p.items);
                    setPaymentType(p.paymentType);
                    setTax(p.tax);
                    setDate(formatDateInput(p.date));
                } else {
                    toast.error("Purchase not found");
                    router.push("/purchases");
                }
            } catch {
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, router]);

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
        const ok = await updatePurchase(id as string, {
            supplierId: supplier._id, supplierName: supplier.name,
            supplierNumber: supplier.supplierNumber,
            items: cart.map(({ _itemRef: _, ...rest }) => rest),
            subtotal, tax, total, paymentType, date,
        });
        setSaving(false);
        if (ok) router.push("/purchases");
    };

    if (loading) return <div className="py-20 text-center"><Spinner /></div>;

    return (
        <div className="page-container max-w-4xl">
            <TopBar title="Edit Purchase" subtitle={`Updating record #${id}`} />

            <div className="card p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <SearchSelect
                            label="Supplier"
                            options={supplierOptions}
                            value={selSupplier}
                            onChange={setSelSupplier}
                            required
                        />
                    </div>
                    <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 block mb-1">Payment type</label>
                        <div className="flex gap-2">
                            {(["cash", "credit", "debit"] as PaymentType[]).map(t => (
                                <button key={t} onClick={() => setPaymentType(t)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors capitalize
                    ${paymentType === t ? "bg-amber-600 text-white border-amber-600 shadow-md" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <Input label="Tax (%)" type="number" min={0} max={100} value={tax} onChange={e => setTax(Number(e.target.value))} />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Add item</label>
                    <SearchSelect placeholder="Search items…" options={itemOptions} value={null} onChange={addItem} />
                </div>

                {cart.length > 0 && (
                    <div className="table-wrapper">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="th">Item</th>
                                    <th className="th text-right">Price</th>
                                    <th className="th text-center">Qty</th>
                                    <th className="th text-right">Total</th>
                                    <th className="th" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cart.map((c, idx) => (
                                    <tr key={c.itemId || idx}>
                                        <td className="td">
                                            <div className="font-medium">{c.itemName}</div>
                                            <div className="text-xs text-gray-400">{c.itemNumber}</div>
                                        </td>
                                        <td className="td text-right">
                                            <input type="number" value={c.price} onChange={e => updatePrice(idx, Number(e.target.value))} className="input-base w-24 text-right ml-auto" />
                                        </td>
                                        <td className="td text-center">
                                            <input type="number" value={c.quantity} onChange={e => updateQty(idx, Number(e.target.value))} className="input-base w-20 text-center mx-auto" />
                                        </td>
                                        <td className="td text-right font-semibold">{formatCurrency(c.total)}</td>
                                        <td className="td text-center">
                                            <Button variant="ghost" size="xs" icon={<Trash2 size={14} className="text-red-500" />} onClick={() => removeItem(idx)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-col items-end gap-1 text-sm border-t border-gray-100 pt-4">
                    <div className="flex gap-8"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                    <div className="flex gap-8"><span>Tax ({tax}%)</span><span>{formatCurrency(taxAmt)}</span></div>
                    <div className="flex gap-8 text-lg font-bold text-amber-600"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <Button variant="outline" onClick={() => router.push("/purchases")}>Cancel</Button>
                    <Button onClick={() => setConfirmOpen(true)} loading={saving} icon={<Save size={16} />}>Update Purchase</Button>
                </div>
            </div>

            <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleSave}
                title="Update Purchase"
                message="Attention: Inventory quantities will be recalculated based on your changes. Old quantities will be reversed and new ones applied. Continue?"
                confirmLabel="Confirm Update"
                variant="warning"
                loading={saving}
            />
        </div>
    );
}

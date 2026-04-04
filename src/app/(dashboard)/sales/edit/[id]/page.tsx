"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Trash2, Save, FileText, ShoppingCart, Pencil } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SearchSelect from "@/components/ui/SearchSelect";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";
import { useSales } from "@/hooks/useSales";
import { ICustomer, IItem, ISaleItem, ISelectOption, PaymentType } from "@/types";
import { formatCurrency, formatDateInput } from "@/lib/utils";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface CartItem extends ISaleItem { _itemRef?: IItem }

export default function EditSalePage() {
    const router = useRouter();
    const { id } = useParams();
    const { updateSale } = useSales();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            const isAdmin = session?.user?.role === "admin";
            const canEdit = isAdmin || (session?.user?.permissions as any)?.sales?.edit;
            if (!canEdit) {
                router.push("/sales");
            }
        }
    }, [session, status, router]);

    const [customers, setCustomers] = useState<ICustomer[]>([]);
    const [items, setItems] = useState<IItem[]>([]);
    const [selCustomer, setSelCustomer] = useState<ISelectOption | null>(null);
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
                const [cr, ir, sr] = await Promise.all([
                    fetch("/api/customers?limit=500").then(r => r.json()),
                    fetch("/api/items?limit=500").then(r => r.json()),
                    fetch(`/api/sales/${id}`).then(r => r.json()),
                ]);
                if (cr.success) setCustomers(cr.data);
                if (ir.success) setItems(ir.data);
                if (sr.success) {
                    const s = sr.data;
                    setSelCustomer({ value: s.customerId, label: `${s.customerName} (${s.customerNumber})`, data: { _id: s.customerId, name: s.customerName, customerNumber: s.customerNumber } as ICustomer });
                    
                    // Format dates for cart items
                    const formattedItems = s.items.map((item: any) => ({
                        ...item,
                        manufacturingDate: formatDateInput(item.manufacturingDate),
                        expiryDate: formatDateInput(item.expiryDate)
                    }));
                    setCart(formattedItems);
                    
                    setPaymentType(s.paymentType);
                    setTax(s.tax);
                    setDate(formatDateInput(s.date));
                } else {
                    toast.error("Sale not found");
                    router.push("/sales");
                }
            } catch {
                toast.error("Failed to load data");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id, router]);

    const customerOptions: ISelectOption[] = customers.map(c => ({
        value: c._id, label: `${c.name} (${c.customerNumber})`, data: c,
    }));

    const itemOptions: ISelectOption[] = items.map(i => ({
        value: i._id, label: `${i.name} — ${formatCurrency(i.salesAmount)}`, data: i,
    }));

    const addItem = (opt: ISelectOption | null) => {
        if (!opt) return;
        const item = opt.data as IItem;
        if (cart.find(c => c.itemId === item._id)) return;
        
        const formatDateStr = (d: any): string => {
            if (!d) return "";
            try {
                const dateObj = new Date(d);
                if (isNaN(dateObj.getTime())) return "";
                return dateObj.toISOString().split('T')[0] || "";
            } catch { return ""; }
        };

        setCart(prev => [...prev, {
            itemId: item._id, itemNumber: item.itemNumber, itemName: item.name,
            quantity: 1, price: item.salesAmount, total: item.salesAmount, batch: "", 
            discount: 0,
            manufacturingDate: formatDateStr(item.manufacturingDate) as string,
            expiryDate: formatDateStr(item.expiryDate) as string,
            _itemRef: item,
        }]);
    };

    const updateQty = (idx: number, qty: number) => {
        setCart(prev => prev.map((c, i) => i === idx ? { ...c, quantity: qty, total: c.price * qty } : c));
    };

    const removeItem = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

    const subtotal = cart.reduce((s, c) => s + c.total, 0);
    const taxAmt = subtotal * (tax / 100);
    const total = subtotal + taxAmt;

    const handleSave = async () => {
        if (!selCustomer || cart.length === 0) return;
        setSaving(true);
        const customer = selCustomer.data as ICustomer;
        const ok = await updateSale(id as string, {
            customerId: customer._id, customerName: customer.name,
            customerNumber: customer.customerNumber,
            items: cart.map(({ _itemRef: _, ...rest }) => rest),
            subtotal, tax, total, paymentType, date,
        });
        setSaving(false);
        if (ok) router.push("/sales");
    };

    if (loading) return <div className="py-20 text-center"><Spinner /></div>;

    return (
        <div className="page-container max-w-4xl">
            <TopBar title="Edit Sale" subtitle={`Updating record #${id}`} />

            <div className="card p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                        <SearchSelect
                            label="Customer"
                            options={customerOptions}
                            value={selCustomer}
                            onChange={(opt) => setSelCustomer(opt)}
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
                    ${paymentType === t ? "bg-emerald-600 text-white border-emerald-600 shadow-md" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}>
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
                                    <th className="th text-left">Item Details</th>
                                    <th className="th text-center">Batch</th>
                                    <th className="th text-center">Mfg Date</th>
                                    <th className="th text-center">Exp Date</th>
                                    <th className="th text-right">Unit Price</th>
                                    <th className="th text-center">Qty</th>
                                    <th className="th text-right">Total</th>
                                    <th className="th" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cart.map((c, idx) => (
                                    <tr key={c.itemId || idx} className="align-top">
                                        <td className="td text-left">
                                            <div className="font-medium text-gray-800">{c.itemName}</div>
                                            <div className="text-[10px] text-gray-400 font-mono tracking-tighter uppercase">{c.itemNumber}</div>
                                        </td>
                                        <td className="td">
                                            <input type="text" value={c.batch} placeholder="Batch"
                                                onChange={e => setCart(prev => prev.map((it, i) => i === idx ? { ...it, batch: e.target.value } : it))}
                                                className="w-full px-2 py-1 text-[10px] text-right border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500" />
                                        </td>
                                        <td className="td">
                                            <input type="date" value={c.manufacturingDate}
                                                onChange={e => setCart(prev => prev.map((it, i) => i === idx ? { ...it, manufacturingDate: e.target.value } : it))}
                                                className="w-32 px-1 py-1 text-[10px] text-right border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500" />
                                        </td>
                                        <td className="td">
                                            <input type="date" value={c.expiryDate}
                                                onChange={e => setCart(prev => prev.map((it, i) => i === idx ? { ...it, expiryDate: e.target.value } : it))}
                                                className="w-32 px-1 py-1 text-[10px] text-right border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500" />
                                        </td>
                                        <td className="td text-right text-gray-600">{formatCurrency(c.price)}</td>
                                        <td className="td text-center">
                                            <input type="number" value={c.quantity} onChange={e => updateQty(idx, Number(e.target.value))} className="w-16 px-1 py-1 text-center border border-gray-200 rounded focus:ring-1 focus:ring-emerald-500 mx-auto block" />
                                        </td>
                                        <td className="td text-right font-semibold text-gray-800">{formatCurrency(c.total)}</td>
                                        <td className="td text-center">
                                            <Button variant="ghost" size="xs" icon={<Trash2 size={14} className="text-red-500" />} onClick={() => removeItem(idx)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="flex flex-col items-end gap-1 text-sm border-t border-gray-100 pt-4 font-medium">
                    <div className="flex gap-10 text-gray-500"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                    <div className="flex gap-10 text-gray-500"><span>Tax ({tax}%)</span><span>{formatCurrency(taxAmt)}</span></div>
                    <div className="flex gap-10 text-lg font-bold text-gray-800 border-t border-gray-100 pt-2 mt-2"><span>Grand Total</span><span className="text-emerald-600">{formatCurrency(total)}</span></div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button variant="outline" onClick={() => router.push("/sales")}>Cancel</Button>
                    <Button onClick={() => setConfirmOpen(true)} loading={saving} icon={<Save size={16} />} className="bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600">Update Sale</Button>
                </div>
            </div>

            <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleSave}
                title="Update Sale"
                message="Inventory quantities will be reconciled based on items and quantities changed. Continue?"
                confirmLabel="Confirm Update"
                variant="success"
                loading={saving}
            />
        </div>
    );
}

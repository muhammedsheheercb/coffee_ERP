"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileDown, Minus, Plus as PlusIcon } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import SearchSelect from "@/components/ui/SearchSelect";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useSales } from "@/hooks/useSales";
import { ICustomer, IItem, ISaleItem, ISelectOption, PaymentType } from "@/types";
import { formatCurrency, formatDateInput } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface CartItem extends ISaleItem {
    _itemRef: IItem;
}

export default function NewSalePage() {
    const router = useRouter();
    const { createSale } = useSales();
    const { data: session, status } = useSession();

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        } else if (status === "authenticated") {
            const isAdmin = session?.user?.role === "admin";
            const canCreate = isAdmin || (session?.user?.permissions as any)?.sales?.create;
            if (!canCreate) {
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
    const [date, setDate] = useState(formatDateInput(new Date()));
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // load customers + items once
    useEffect(() => {
        const load = async () => {
            const [cr, ir] = await Promise.all([
                fetch("/api/customers?limit=500").then(r => r.json()),
                fetch("/api/items?limit=500").then(r => r.json()),
            ]);
            if (cr.success) setCustomers(cr.data);
            if (ir.success) setItems(ir.data);
        };
        load();
    }, []);

    const customerOptions: ISelectOption[] = customers.map(c => ({
        value: c._id,
        label: `${c.name} (${c.customerNumber})`,
        data: c,
    }));

    const itemOptions = items.map(i => ({
        value: i._id,
        label: `${i.name} — Sale: ${formatCurrency(i.salesAmount || 0)} | Stock: ${i.quantity}`,
        data: i,
    }));

    const addItem = useCallback(async (opt: ISelectOption | null) => {
        if (!opt) return;
        const item = opt.data as IItem;

        // Fetch last sale price for this customer and item
        if (selCustomer) {
            try {
                const res = await fetch(`/api/sales/last-price?customerId=${selCustomer.value}&itemId=${item._id}`);
                const data = await res.json();
                if (data.success && data.lastPrice !== null) {
                    toast(`Last sold to this customer at ${formatCurrency(data.lastPrice)}`, {
                        icon: '💰',
                        duration: 6000,
                        style: {
                            borderRadius: '10px',
                            background: '#333',
                            color: '#fff',
                        },
                    });
                }
            } catch (error) {
                console.error("Error fetching last price:", error);
            }
        }
        
        // Helper to format date safely
        const formatDateStr = (d: any): string => {
            if (!d) return "";
            try {
                const dateObj = new Date(d);
                if (isNaN(dateObj.getTime())) return "";
                const iso = dateObj.toISOString().split('T')[0];
                return iso || "";
            } catch { return ""; }
        };

        setCart(prev => [...prev, {
            itemId: item._id,
            itemNumber: item.itemNumber,
            itemName: item.name,
            quantity: 1,
            price: item.salesAmount || 0,
            total: item.salesAmount || 0,
            discount: 0,
            isFOC: false,
            manufacturingDate: formatDateStr(item.manufacturingDate) as string,
            expiryDate: formatDateStr(item.expiryDate) as string,
            batch: "",
            _itemRef: item,
        }]);
    }, [selCustomer, cart]);

    const updateItem = (idx: number, updates: Partial<CartItem>) => {
        setCart(prev => prev.map((c, i) => {
            if (i !== idx) return c;
            const updated = { ...c, ...updates };
            // Ensure qty >= 1
            if (updated.quantity < 1) updated.quantity = 1;

            // FOC Logic: If FOC, total is always 0
            if (updated.isFOC) {
                updated.total = 0;
            } else {
                // Recalculate total: (price * qty) - discount
                updated.total = (updated.price * updated.quantity) - (updated.discount || 0);
            }
            return updated;
        }));
    };

    const removeItem = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

    const subtotal = cart.reduce((s, c) => s + (c.isFOC ? 0 : (c.price * c.quantity)), 0);
    const totalDiscount = cart.reduce((s, c) => s + (c.isFOC ? 0 : (c.discount || 0)), 0);
    const taxableAmount = subtotal - totalDiscount;
    const taxAmt = taxableAmount * (tax / 100);
    const total = taxableAmount + taxAmt;

    const handleSave = async () => {
        if (!selCustomer || cart.length === 0) return;
        
        // Validation: Manufacturing and Expiry dates are mandatory
        for (const item of cart) {
          if (!item.manufacturingDate || !item.expiryDate) {
            alert(`Please provide manufacturing and expiry dates for ${item.itemName}`);
            setConfirmOpen(false);
            return;
          }
        }

        setSaving(true);
        const customer = selCustomer.data as ICustomer;
        const ok = await createSale({
            customerId: customer._id,
            customerName: customer.name,
            customerNumber: customer.customerNumber,
            items: cart.map(({ _itemRef: _, ...rest }) => rest),
            subtotal,
            tax,
            total,
            paymentType,
            date,
        });
        setSaving(false);
        if (ok) router.push("/sales");
    };

    const generatePDF = () => {
        if (!selCustomer || cart.length === 0) return;
        const customer = selCustomer.data as ICustomer;
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Sales Invoice", 14, 20);
        doc.setFontSize(11);
        doc.text(`Customer: ${customer.name} (${customer.customerNumber})`, 14, 32);
        doc.text(`Mobile: ${customer.mobile}`, 14, 39);
        doc.text(`Date: ${date}`, 14, 46);
        doc.text(`Payment: ${paymentType.toUpperCase()}`, 14, 53);
        
        autoTable(doc, {
            startY: 62,
            head: [["#", "Item", "Batch", "Mfg", "Exp", "Qty", "Price", "Disc", "Total"]],
            body: cart.map((c, i) => [
                i + 1, 
                c.itemName + (c.isFOC ? " (FOC)" : ""), 
                c.batch || "-", 
                c.manufacturingDate || "-", 
                c.expiryDate || "-", 
                c.quantity, 
                c.isFOC ? "0.00" : formatCurrency(c.price), 
                c.isFOC ? "0.00" : formatCurrency(c.discount || 0), 
                formatCurrency(c.total)
            ]),
            foot: [
                ["", "", "", "", "", "", "", "Subtotal", formatCurrency(subtotal)],
                ["", "", "", "", "", "", "", "Discount", formatCurrency(totalDiscount)],
                ["", "", "", "", "", "", "", `Tax (${tax}%)`, formatCurrency(taxAmt)],
                ["", "", "", "", "", "", "", "Total", formatCurrency(total)],
            ],
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] },
            footStyles: { fontStyle: "bold", fillColor: [249, 250, 251], textColor: [31, 41, 55] },
        });
        doc.save(`invoice-${customer.name}-${Date.now()}.pdf`);
    };

    return (
        <div className="page-container max-w-6xl">
            <TopBar title="New Sale" subtitle="Create a new sales invoice" />

            <div className="card p-6 flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                        <SearchSelect
                            label="Customer"
                            placeholder="Select customer..."
                            options={customerOptions}
                            value={selCustomer}
                            onChange={setSelCustomer}
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
                              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2
                                ${paymentType === 'cash' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${paymentType === 'cash' ? 'bg-emerald-500' : 'bg-gray-200'}`}></span>
                              CASH
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setPaymentType("bank")} 
                              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2
                                ${paymentType === 'bank' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${paymentType === 'bank' ? 'bg-indigo-500' : 'bg-gray-200'}`}></span>
                              BANK
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setPaymentType("credit")} 
                              className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border-2 transition-all flex items-center justify-center gap-2
                                ${paymentType === 'credit' ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-sm' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}`}
                            >
                              <span className={`w-2 h-2 rounded-full ${paymentType === 'credit' ? 'bg-amber-500' : 'bg-gray-200'}`}></span>
                              CREDIT (DEBT)
                            </button>
                        </div>
                    </div>
                    <Input label="Global Tax (%)" type="number" min={0} max={100} value={tax}
                        onChange={e => setTax(Number(e.target.value))}
                        placeholder="0"
                        hint="Applied to total after discounts" />
                </div>

                <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1.5">Search & Add Items</label>
                    <SearchSelect
                        placeholder="Search items..."
                        options={itemOptions}
                        value={null}
                        onChange={addItem}
                    />
                </div>

                {cart.length > 0 ? (
                    <div className="table-wrapper border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full">
                            <thead className="bg-gray-50/50">
                                <tr className="border-b border-gray-200">
                                    <th className="th text-left w-[20%]">Item Details</th>
                                    <th className="th">Batch</th>
                                    <th className="th">Mfg Date</th>
                                    <th className="th">Exp Date</th>
                                    <th className="th text-center w-32">Quantity</th>
                                    <th className="th">Price</th>
                                    <th className="th">Discount</th>
                                    <th className="th text-center">FOC</th>
                                    <th className="th text-right">Total</th>
                                    <th className="th w-10 px-0" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cart.map((c, idx) => (
                                    <tr key={`${c.itemId}-${idx}`} className="align-top">
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
                                                value={c.manufacturingDate}
                                                onChange={e => updateItem(idx, { manufacturingDate: e.target.value })}
                                                className="w-full px-2 py-1.5 text-[10px] text-right border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        </td>
                                        <td className="td">
                                            <input
                                                type="date"
                                                value={c.expiryDate}
                                                onChange={e => updateItem(idx, { expiryDate: e.target.value })}
                                                className="w-full px-2 py-1.5 text-[10px] text-right border border-gray-200 rounded-md outline-none focus:ring-1 focus:ring-indigo-500"
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
                                                    type="number" min={1} max={c._itemRef.quantity} value={c.quantity}
                                                    onChange={e => updateItem(idx, { quantity: Number(e.target.value) })}
                                                    className="w-12 text-center bg-transparent text-sm font-semibold focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <button 
                                                    onClick={() => updateItem(idx, { quantity: c.quantity + 1 })}
                                                    disabled={c.quantity >= c._itemRef.quantity}
                                                    className="p-1 hover:bg-white rounded hover:shadow-xs text-gray-500 transition-all disabled:opacity-30"
                                                >
                                                    <PlusIcon size={14} />
                                                </button>
                                            </div>
                                            <div className="text-[10px] text-center text-gray-400 mt-1">Stock: {c._itemRef.quantity}</div>
                                        </td>
                                        <td className="td text-right font-medium text-gray-700">{c.isFOC ? "—" : formatCurrency(c.price)}</td>
                                        <td className="td">
                                            <input
                                                type="number"
                                                step="0.001"
                                                placeholder="0.000"
                                                disabled={c.isFOC}
                                                value={c.discount || ''}
                                                onChange={e => updateItem(idx, { discount: Number(e.target.value) })}
                                                className={`w-20 px-2 py-1.5 text-xs text-right border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 ${c.isFOC ? 'bg-gray-50 opacity-50 cursor-not-allowed' : ''}`}
                                            />
                                        </td>
                                        <td className="td text-center">
                                            <input
                                                type="checkbox"
                                                checked={c.isFOC || false}
                                                onChange={e => updateItem(idx, { isFOC: e.target.checked })}
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                            />
                                        </td>
                                        <td className="td text-right font-bold text-gray-900">{c.isFOC ? <span className="text-emerald-600 font-bold px-1.5 py-0.5 bg-emerald-50 rounded text-[10px] uppercase tracking-wider">FREE</span> : formatCurrency(c.total)}</td>
                                        <td className="td">
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    title="Split this row"
                                                    onClick={() => {
                                                        const newItem = { ...c, quantity: 1 };
                                                        // Update current row quantity (if > 1)
                                                        if (c.quantity > 1) {
                                                            updateItem(idx, { quantity: c.quantity - 1 });
                                                        }
                                                        // Add new item to cart
                                                        setCart(prev => {
                                                            const newCart = [...prev];
                                                            newCart.splice(idx + 1, 0, newItem);
                                                            return newCart;
                                                        });
                                                    }}
                                                    className="p-1 text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                >
                                                    <PlusIcon size={14} />
                                                </button>
                                                <Button variant="ghost" size="xs" icon={<Trash2 size={15} className="text-red-400 hover:text-red-600" />}
                                                    onClick={() => removeItem(idx)} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="border-2 border-dashed border-gray-100 rounded-2xl py-16 text-center text-gray-400 bg-gray-50/30">
                        <Plus size={40} className="mx-auto mb-3 opacity-20" />
                        <p className="text-sm font-medium">Add some items to start the sale</p>
                    </div>
                )}

                {cart.length > 0 && (
                    <div className="flex flex-col items-end gap-1.5 px-2 py-4 bg-gray-50/50 rounded-xl border border-gray-100">
                        <div className="flex gap-12 text-sm text-gray-500">
                            <span>Total Items Price</span>
                            <span className="font-mono">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex gap-12 text-sm text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            <span>Total Discount</span>
                            <span className="font-mono">-{formatCurrency(totalDiscount)}</span>
                        </div>
                        <div className="flex gap-12 text-sm text-gray-500">
                            <span>Taxable ({tax}%)</span>
                            <span className="font-mono">{formatCurrency(taxAmt)}</span>
                        </div>
                        <div className="h-px w-48 bg-gray-200 my-1" />
                        <div className="flex gap-12 text-xl font-bold text-gray-900">
                            <span>Final Total</span>
                            <span className="text-indigo-600 font-mono underline decoration-indigo-200 decoration-2 underline-offset-4">{formatCurrency(total)}</span>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center pt-4">
                    <Button variant="outline" icon={<FileDown size={18} />} onClick={generatePDF}
                        disabled={!selCustomer || cart.length === 0}
                        className="px-6"
                    >
                        Export Invoice
                    </Button>
                    <div className="flex gap-4">
                        <button onClick={() => router.push("/sales")} className="text-sm font-semibold text-gray-500 hover:text-gray-700 underline-offset-4 hover:underline">
                            Discard
                        </button>
                        <Button
                            onClick={() => setConfirmOpen(true)}
                            disabled={!selCustomer || cart.length === 0}
                            className="px-10 h-11"
                        >
                            Complete Order
                        </Button>
                    </div>
                </div>
            </div>

            <ConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleSave}
                title="Confirm Sale Instance"
                message={`You are about to issue a ${paymentType} sale to ${selCustomer?.data?.name}. Total: ${formatCurrency(total)}. Confirm to proceed?`}
                confirmLabel="Confirm & Save"
                variant="info"
                loading={saving}
            />
        </div>
    );
}
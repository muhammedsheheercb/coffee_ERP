"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Calendar, Tag, DollarSign, CreditCard, Pencil } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Spinner from "@/components/ui/Spinner";
import { useExpenses } from "@/hooks/useExpenses";
import { IExpense, PaymentType } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const LIMIT = 10;
const CATEGORIES = ["Office", "Travel", "Utilities", "Marketing", "Salaries", "Rent", "Others"];

export default function ExpensesPage() {
    const { expenses, total, totalPages, totalAmount, loading, fetchExpenses, deleteExpense } = useExpenses();

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [category, setCategory] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(() => {
        fetchExpenses({
            search, page, limit: LIMIT, category, startDate, endDate
        });
    }, [search, page, category, startDate, endDate, fetchExpenses]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search, category, startDate, endDate]);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const ok = await deleteExpense(deleteId);
        setDeleting(false);
        if (ok) { setDeleteId(null); load(); }
    };

    return (
        <div className="page-container">
            <TopBar
                title="Expenses"
                subtitle={`${total} records — Total: ${formatCurrency(totalAmount)}`}
                actions={
                    <Link href="/expenses/new">
                        <Button icon={<Plus size={16} />}>Record Expense</Button>
                    </Link>
                }
            />

            {/* filters */}
            <div className="filter-bar">
                <Input
                    placeholder="Search title, category, ref…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    leftIcon={<Search size={15} />}
                    wrapperClassName="w-64"
                />
                <select className="input-base w-40" value={category} onChange={e => setCategory(e.target.value)}>
                    <option value="">All Categories</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                
                <div className="flex items-center gap-2">
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} 
                        className="input-base w-36 text-xs h-10" />
                    <span className="text-gray-400 text-sm">to</span>
                    <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} 
                        className="input-base w-36 text-xs h-10" />
                    {(startDate || endDate) && (
                        <button onClick={() => { setStartDate(""); setEndDate(""); }} 
                            className="text-red-600 text-xs font-semibold px-1">Clear</button>
                    )}
                </div>
            </div>

            {/* total bar */}
            <div className="card px-5 py-3 flex items-center justify-between border-l-4 border-red-500">
                <span className="text-sm text-gray-500 flex items-center gap-2"><DollarSign size={14} /> Total Expenses</span>
                <span className="text-lg font-bold text-red-600">{formatCurrency(totalAmount)}</span>
            </div>

            {/* table */}
            <div className="table-wrapper">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="th">Expense #</th>
                            <th className="th">Title</th>
                            <th className="th text-center">Category</th>
                            <th className="th">Date</th>
                            <th className="th text-right">Amount</th>
                            <th className="th text-center">Payment</th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={7} className="py-16 text-center"><Spinner /></td></tr>
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan={7} className="py-16 text-center text-gray-400 text-sm">No expenses found</td></tr>
                        ) : expenses.map((e: IExpense) => (
                            <tr key={e._id} className="tr-hover">
                                <td className="td font-mono text-xs text-gray-500">{e.expenseNumber}</td>
                                <td className="td">
                                    <div className="font-medium text-gray-800">{e.title}</div>
                                    {e.reference && <div className="text-[10px] text-gray-400">Ref: {e.reference}</div>}
                                </td>
                                <td className="td text-center">
                                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] uppercase font-bold">
                                        {e.category}
                                    </span>
                                </td>
                                <td className="td text-gray-500 text-xs">{formatDate(e.date)}</td>
                                <td className="td text-right font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                                <td className="td text-center">
                                    <Badge
                                        label={e.paymentType}
                                        variant={e.paymentType === "cash" ? "success" : e.paymentType === "credit" ? "warning" : "info"}
                                    />
                                </td>
                                <td className="td text-right flex justify-end gap-1">
                                    <Link href={`/expenses/edit/${e._id}`}>
                                        <Button variant="ghost" size="xs" icon={<Pencil size={14} className="text-indigo-500" />} />
                                    </Link>
                                    <Button variant="ghost" size="xs" icon={<Trash2 size={14} className="text-red-500" />}
                                        onClick={() => setDeleteId(e._id)} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="border-t border-gray-100 px-2">
                    <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />
                </div>
            </div>

            <ConfirmModal
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Expense"
                message="Are you sure you want to delete this expense record? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
                loading={deleting}
            />
        </div>
    );
}

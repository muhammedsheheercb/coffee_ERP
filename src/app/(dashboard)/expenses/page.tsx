"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Trash2, Calendar, Tag, CreditCard, Pencil, FileText } from "lucide-react";
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
import { useSession } from "next-auth/react";

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
    const [showFilters, setShowFilters] = useState(false);

    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";
    const perms = (session?.user?.permissions as any)?.expenses;
    const canCreate = isAdmin || perms?.create;
    const canEdit = isAdmin || perms?.edit;
    const canDelete = isAdmin || perms?.delete;

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
                    <div className="flex gap-2">
                        <Button 
                            variant="outline" 
                            icon={<Search size={16} />} 
                            onClick={() => setShowFilters(!showFilters)}
                            className={showFilters ? "bg-red-50 border-red-200 text-red-600" : ""}
                        >
                            {showFilters ? "Hide Filters" : "Filters"}
                        </Button>
                        {canCreate && (
                            <Link href="/expenses/new">
                                <Button icon={<Plus size={16} />} className="bg-red-600 hover:bg-red-700 border-red-600">Record Expense</Button>
                            </Link>
                        )}
                    </div>
                }
            />

            {showFilters && (
                <div className="filter-bar animate-in fade-in slide-in-from-top-2 duration-200">
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
            )}

            {/* total summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="card px-5 py-4 flex items-center justify-between border-l-4 border-red-500 bg-red-50/20 shadow-sm">
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1 flex items-center gap-1.5 line-clamp-1">
                            <CreditCard size={10} className="text-red-500" /> Total Expense Value
                        </p>
                        <p className="text-2xl font-black text-red-600 tabular-nums">{formatCurrency(totalAmount)}</p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-start justify-center">
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1 flex items-center gap-1.5 line-clamp-1">
                        <FileText size={10} /> Records Count
                    </p>
                    <p className="text-2xl font-black text-gray-800 tabular-nums">{total}</p>
                </div>
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
                                    {canEdit && (
                                        <Link href={`/expenses/edit/${e._id}`}>
                                            <Button variant="ghost" size="xs" icon={<Pencil size={14} className="text-indigo-500" />} />
                                        </Link>
                                    )}
                                    {canDelete && (
                                        <Button variant="ghost" size="xs" icon={<Trash2 size={14} className="text-red-500" />}
                                            onClick={() => setDeleteId(e._id)} />
                                    )}
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

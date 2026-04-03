"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Search, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CustomerModal from "@/components/customers/CustomerModal";
import Spinner from "@/components/ui/Spinner";
import { useCustomers } from "@/hooks/useCustomers";
import { ICustomer } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const LIMIT = 10;

export default function CustomersPage() {
    const { customers, total, totalPages, loading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer } = useCustomers();

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [modalOpen, setModalOpen] = useState(false);
    const [editCustomer, setEditCustomer] = useState<ICustomer | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(() => {
        fetchCustomers({ search, page, limit: LIMIT, sortBy, sortOrder });
    }, [search, page, sortBy, sortOrder, fetchCustomers]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search]);

    const handleSort = (col: string) => {
        if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
        else { setSortBy(col); setSortOrder("asc"); }
    };

    const handleSubmit = async (data: Parameters<typeof createCustomer>[0]) => {
        setSaving(true);
        const ok = editCustomer ? await updateCustomer(editCustomer._id, data) : await createCustomer(data);
        setSaving(false);
        if (ok) { setModalOpen(false); setEditCustomer(null); load(); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const ok = await deleteCustomer(deleteId);
        setDeleting(false);
        if (ok) { setDeleteId(null); load(); }
    };

    const SortBtn = ({ col }: { col: string }) => (
        <button onClick={() => handleSort(col)} className="ml-1 opacity-50 hover:opacity-100 transition-opacity">
            <ArrowUpDown size={13} />
        </button>
    );

    return (
        <div className="page-container">
            <TopBar
                title="Customers"
                subtitle={`${total} customers total`}
                actions={
                    <Button icon={<Plus size={16} />} onClick={() => { setEditCustomer(null); setModalOpen(true); }}>
                        New Customer
                    </Button>
                }
            />

            <div className="filter-bar">
                <Input
                    placeholder="Search by name, number or mobile…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    leftIcon={<Search size={15} />}
                    wrapperClassName="w-80"
                />
            </div>

            <div className="table-wrapper">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="th">Customer # <SortBtn col="customerNumber" /></th>
                            <th className="th">Name <SortBtn col="name" /></th>
                            <th className="th">Mobile</th>
                            <th className="th text-right">Credit Balance <SortBtn col="creditBalance" /></th>
                            <th className="th">Joined <SortBtn col="createdAt" /></th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="py-16 text-center"><Spinner /></td></tr>
                        ) : customers.length === 0 ? (
                            <tr><td colSpan={6} className="py-16 text-center text-gray-400 text-sm">No customers found</td></tr>
                        ) : customers.map((c: ICustomer) => (
                            <tr key={c._id} className="tr-hover">
                                <td className="td font-mono text-xs text-gray-500">{c.customerNumber}</td>
                                <td className="td font-medium text-gray-800">{c.name}</td>
                                <td className="td text-gray-500">{c.mobile}</td>
                                <td className="td text-right">
                                    <Badge
                                        label={formatCurrency(c.creditBalance)}
                                        variant={c.creditBalance > 0 ? "warning" : c.creditBalance < 0 ? "success" : "default"}
                                    />
                                </td>
                                <td className="td text-gray-400 text-xs">{formatDate(c.createdAt)}</td>
                                <td className="td text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="xs" icon={<Pencil size={14} />}
                                            onClick={() => { setEditCustomer(c); setModalOpen(true); }} />
                                        <Button variant="ghost" size="xs" icon={<Trash2 size={14} className="text-red-500" />}
                                            onClick={() => setDeleteId(c._id)} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="border-t border-gray-100 px-2">
                    <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />
                </div>
            </div>

            <CustomerModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditCustomer(null); }}
                onSubmit={handleSubmit}
                customer={editCustomer}
                loading={saving}
            />
            <ConfirmModal
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Customer"
                message="Are you sure you want to delete this customer?"
                confirmLabel="Delete"
                loading={deleting}
            />
        </div>
    );
}
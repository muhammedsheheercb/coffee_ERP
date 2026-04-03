"use client";
import { useEffect, useState, useCallback } from "react";
import { Plus, Search, ArrowUpDown, Pencil, Trash2 } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import ConfirmModal from "@/components/ui/ConfirmModal";
import SupplierModal from "@/components/suppliers/SupplierModal";
import Spinner from "@/components/ui/Spinner";
import { useSuppliers } from "@/hooks/useSuppliers";
import { ISupplier } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";

const LIMIT = 10;

export default function SuppliersPage() {
    const { suppliers, total, totalPages, loading, fetchSuppliers, createSupplier, updateSupplier, deleteSupplier } = useSuppliers();

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [modalOpen, setModalOpen] = useState(false);
    const [editSupplier, setEditSupplier] = useState<ISupplier | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const load = useCallback(() => {
        fetchSuppliers({ search, page, limit: LIMIT, sortBy, sortOrder });
    }, [search, page, sortBy, sortOrder, fetchSuppliers]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search]);

    const handleSort = (col: string) => {
        if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
        else { setSortBy(col); setSortOrder("asc"); }
    };

    const handleSubmit = async (data: Parameters<typeof createSupplier>[0]) => {
        setSaving(true);
        const ok = editSupplier ? await updateSupplier(editSupplier._id, data) : await createSupplier(data);
        setSaving(false);
        if (ok) { setModalOpen(false); setEditSupplier(null); load(); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const ok = await deleteSupplier(deleteId);
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
                title="Suppliers"
                subtitle={`${total} suppliers total`}
                actions={
                    <Button icon={<Plus size={16} />} onClick={() => { setEditSupplier(null); setModalOpen(true); }}>
                        New Supplier
                    </Button>
                }
            />

            <div className="filter-bar">
                <Input
                    placeholder="Search by name or number…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    leftIcon={<Search size={15} />}
                    wrapperClassName="w-72"
                />
            </div>

            <div className="table-wrapper">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="th">Supplier # <SortBtn col="supplierNumber" /></th>
                            <th className="th">Name <SortBtn col="name" /></th>
                            <th className="th text-center">Items Provided</th>
                            <th className="th text-right">Credit Balance <SortBtn col="creditBalance" /></th>
                            <th className="th">Created <SortBtn col="createdAt" /></th>
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={6} className="py-16 text-center"><Spinner /></td></tr>
                        ) : suppliers.length === 0 ? (
                            <tr><td colSpan={6} className="py-16 text-center text-gray-400 text-sm">No suppliers found</td></tr>
                        ) : suppliers.map((s: ISupplier) => (
                            <tr key={s._id} className="tr-hover">
                                <td className="td font-mono text-xs text-gray-500">{s.supplierNumber}</td>
                                <td className="td font-medium text-gray-800">{s.name}</td>
                                <td className="td text-center">
                                    <Badge label={`${s.itemsProvided?.length ?? 0} items`} variant="info" />
                                </td>
                                <td className="td text-right">
                                    <Badge
                                        label={formatCurrency(s.creditBalance)}
                                        variant={s.creditBalance > 0 ? "warning" : "default"}
                                    />
                                </td>
                                <td className="td text-gray-400 text-xs">{formatDate(s.createdAt)}</td>
                                <td className="td text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <Button variant="ghost" size="xs" icon={<Pencil size={14} />}
                                            onClick={() => { setEditSupplier(s); setModalOpen(true); }} />
                                        <Button variant="ghost" size="xs" icon={<Trash2 size={14} className="text-red-500" />}
                                            onClick={() => setDeleteId(s._id)} />
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

            <SupplierModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditSupplier(null); }}
                onSubmit={handleSubmit}
                supplier={editSupplier}
                loading={saving}
            />
            <ConfirmModal
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Supplier"
                message="Are you sure you want to delete this supplier?"
                confirmLabel="Delete"
                loading={deleting}
            />
        </div>
    );
}
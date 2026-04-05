"use client"
import React, { useEffect, useState, useCallback } from "react";
import { Plus, Search, ArrowUpDown, Pencil, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ItemModal from "@/components/items/ItemModal";
import Spinner from "@/components/ui/Spinner";
import { useItems } from "@/hooks/useItems";
import { IItem } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useSession } from "next-auth/react";

const LIMIT = 10;

export default function ItemsPage() {
    const { items, total, totalAmount, totalPages, loading, fetchItems, createItem, updateItem, deleteItem } = useItems();

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"new" | "opening_stock">("new");
    const [editItem, setEditItem] = useState<IItem | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";
    const perms = (session?.user?.permissions as any)?.items;
    const canCreate = isAdmin || perms?.create;
    const canEdit = isAdmin || perms?.edit;
    const canDelete = isAdmin || perms?.delete;

    const load = useCallback(() => {
        fetchItems({ search, page, limit: LIMIT, sortBy, sortOrder });
    }, [search, page, sortBy, sortOrder, fetchItems]);

    useEffect(() => { load(); }, [load]);

    // reset to page 1 on search change
    useEffect(() => { setPage(1); }, [search]);

    const handleSort = (col: string) => {
        if (sortBy === col) setSortOrder(o => o === "asc" ? "desc" : "asc");
        else { setSortBy(col); setSortOrder("asc"); }
    };

    const handleSubmit = async (data: Parameters<typeof createItem>[0]) => {
        setSaving(true);
        const ok = editItem ? await updateItem(editItem._id, data) : await createItem(data);
        setSaving(false);
        if (ok) { setModalOpen(false); setEditItem(null); load(); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        const ok = await deleteItem(deleteId);
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
                title="Items"
                subtitle={`${total} items total`}
                actions={
                    canCreate && (
                        <div className="flex gap-2">
                            <Button variant="outline" icon={<Plus size={16} />} onClick={() => { setModalMode("new"); setEditItem(null); setModalOpen(true); }}>
                                New Item
                            </Button>
                            <Button icon={<Plus size={16} />} onClick={() => { setModalMode("opening_stock"); setEditItem(null); setModalOpen(true); }}>
                                Opening Stock
                            </Button>
                        </div>
                    )
                }
            />

            {/* summary box */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">Total Items</p>
                    <p className="text-base sm:text-2xl font-bold text-gray-800">{total}</p>
                </div>
                <div className="bg-white p-2 sm:p-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden text-ellipsis whitespace-nowrap">
                    <p className="text-xs sm:text-sm text-gray-500 mb-0.5 sm:mb-1">Total Stock</p>
                    <p className="text-base sm:text-2xl font-bold text-primary">{formatCurrency(totalAmount)}</p>
                </div>
            </div>

            {/* filters */}
            <div className="filter-bar">
                <Input
                    placeholder="Search by name or number…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    leftIcon={<Search size={15} />}
                    wrapperClassName="w-72"
                />
            </div>

            {/* table */}
            <div className="table-wrapper">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="th">Item Number <SortBtn col="itemNumber" /></th>
                            <th className="th">Item Name <SortBtn col="name" /></th>
                            <th className="th text-right">Qty <SortBtn col="quantity" /></th>
                            <th className="th text-right">Purchase Price <SortBtn col="purchaseAmount" /></th>
                            <th className="th text-right">Sales Price <SortBtn col="salesAmount" /></th>
                            <th className="th text-right">Mfg Date <SortBtn col="manufacturingDate" /></th>
                            <th className="th text-right">Exp Date <SortBtn col="expiryDate" /></th>
                            {isAdmin && <th className="th text-right">Created By</th>}
                            <th className="th text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={isAdmin ? 9 : 8} className="py-16 text-center"><Spinner /></td></tr>
                        ) : items.length === 0 ? (
                            <tr><td colSpan={isAdmin ? 9 : 8} className="py-16 text-center text-gray-400 text-sm">No items found</td></tr>
                        ) : items.map((item: IItem) => (
                            <React.Fragment key={item._id}>
                                <tr className="tr-hover">
                                    <td className="td font-mono text-[10px] text-gray-400">{item.itemNumber}</td>
                                    <td className="td font-medium text-gray-800">{item.name}</td>
                                    <td className="td text-right">
                                        <Badge
                                            label={String(item.quantity)}
                                            variant={item.quantity === 0 ? "danger" : item.quantity < 10 ? "warning" : "success"}
                                        />
                                    </td>
                                    <td className="td text-right font-mono text-xs text-orange-600">{formatCurrency(item.purchaseAmount || 0)}</td>
                                    <td className="td text-right font-mono text-xs text-indigo-600">{formatCurrency(item.salesAmount || 0)}</td>
                                    <td className="td text-right text-[10px] text-gray-500">{item.manufacturingDate ? formatDate(item.manufacturingDate) : "-"}</td>
                                    <td className="td text-right text-[10px] text-gray-500">{item.expiryDate ? formatDate(item.expiryDate) : "-"}</td>
                                    {isAdmin && (
                                        <td className="td text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-medium text-gray-800">{item.createdBy?.name || "Admin"}</span>
                                                {item.updatedBy && item.updatedBy.name !== item.createdBy?.name && (
                                                    <span className="text-[9px] text-gray-400 italic">Edit: {item.updatedBy.name}</span>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    <td className="td text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="ghost" size="xs"
                                                title="View Batches"
                                                icon={expandedItemId === item._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                onClick={() => setExpandedItemId(expandedItemId === item._id ? null : item._id)}
                                            />
                                            {canEdit && (
                                                <Button
                                                    variant="ghost" size="xs"
                                                    icon={<Pencil size={14} />}
                                                    onClick={() => { setEditItem(item); setModalOpen(true); }}
                                                />
                                            )}
                                            {canDelete && (
                                                <Button
                                                    variant="ghost" size="xs"
                                                    icon={<Trash2 size={14} className="text-red-500" />}
                                                    onClick={() => setDeleteId(item._id)}
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                {expandedItemId === item._id && (
                                    <tr className="bg-amber-50/30">
                                        <td colSpan={isAdmin ? 9 : 8} className="p-4 border-t border-amber-100">
                                            <div className="text-xs font-bold text-amber-800 mb-2 px-1 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                                ITEM BATCH HISTORY
                                            </div>
                                            {item.batches && item.batches.length > 0 ? (
                                                <div className="overflow-hidden rounded-lg border border-amber-100 bg-white">
                                                    <table className="w-full text-[11px]">
                                                        <thead className="bg-amber-50/50">
                                                            <tr>
                                                                <th className="px-3 py-2 text-left font-semibold text-amber-900 border-b border-amber-100">Purchase #</th>
                                                                <th className="px-3 py-2 text-left font-semibold text-amber-900 border-b border-amber-100">Batch</th>
                                                                <th className="px-3 py-2 text-right font-semibold text-amber-900 border-b border-amber-100">Qty</th>
                                                                <th className="px-3 py-2 text-right font-semibold text-amber-900 border-b border-amber-100">Purchase Price</th>
                                                                <th className="px-3 py-2 text-right font-semibold text-amber-900 border-b border-amber-100">Sales Price</th>
                                                                <th className="px-3 py-2 text-center font-semibold text-amber-900 border-b border-amber-100">Mfg Date</th>
                                                                <th className="px-3 py-2 text-center font-semibold text-amber-900 border-b border-amber-100">Exp Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-amber-50">
                                                            {item.batches.map((batch, bi) => (
                                                                <tr key={bi} className="hover:bg-amber-50/50 transition-colors">
                                                                    <td className="px-3 py-2 font-mono text-gray-500">{batch.purchaseNumber || "-"}</td>
                                                                    <td className="px-3 py-2">{batch.batchNumber || "-"}</td>
                                                                    <td className="px-3 py-2 text-right font-bold text-amber-700">{batch.quantity}</td>
                                                                    <td className="px-3 py-2 text-right">{formatCurrency(batch.purchasePrice)}</td>
                                                                    <td className="px-3 py-2 text-right font-semibold text-indigo-600">{formatCurrency(batch.salePrice)}</td>
                                                                    <td className="px-3 py-2 text-center text-gray-500">{batch.manufacturingDate ? formatDate(batch.manufacturingDate) : "-"}</td>
                                                                    <td className="px-3 py-2 text-center text-gray-500">{batch.expiryDate ? formatDate(batch.expiryDate) : "-"}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : (
                                                <div className="py-4 text-center text-xs text-gray-400 italic">
                                                    No historical batch data found for this item.
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>

                <div className="border-t border-gray-100 px-2">
                    <Pagination page={page} totalPages={totalPages} total={total} limit={LIMIT} onPageChange={setPage} />
                </div>
            </div>

            <ItemModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditItem(null); }}
                onSubmit={handleSubmit}
                item={editItem}
                loading={saving}
                mode={modalMode}
            />

            <ConfirmModal
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Item"
                message="Are you sure you want to delete this item? This action cannot be undone."
                confirmLabel="Delete"
                loading={deleting}
            />
        </div>
    );
}
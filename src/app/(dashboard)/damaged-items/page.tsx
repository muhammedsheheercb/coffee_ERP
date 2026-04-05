"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
    Ban, Plus, Package, Calendar, AlertTriangle, 
    Trash2, Eye, Trash
} from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "react-select";
import { toast } from "react-hot-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { IItem } from "@/types";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function DamagedItemsPage() {
    const [damagedItems, setDamagedItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [items, setItems] = useState<IItem[]>([]);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [formData, setFormData] = useState({
        itemId: "",
        itemNumber: "",
        itemName: "",
        quantity: 1,
        batch: "",
        reason: "",
        date: new Date().toISOString().split('T')[0]
    });

    const [selectedItemBatches, setSelectedItemBatches] = useState<any[]>([]);

    const [editingDamage, setEditingDamage] = useState<any | null>(null);

    useEffect(() => {
        fetchDamagedItems();
        fetchItems();
    }, [page]);

    const fetchDamagedItems = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/damaged-items?page=${page}&limit=10`);
            const data = await res.json();
            setDamagedItems(data.data || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            toast.error("Failed to fetch damaged items");
        } finally {
            setLoading(false);
        }
    };

    const fetchItems = async () => {
        try {
            const res = await fetch("/api/items");
            const data = await res.json();
            setItems(data.data || []);
        } catch (error) {
            toast.error("Failed to fetch items");
        }
    };

    const handleItemSelect = (item: IItem) => {
        setFormData({
            ...formData,
            itemId: item._id,
            itemNumber: item.itemNumber,
            itemName: item.name,
            batch: ""
        });
        setSelectedItemBatches(item.batches || []);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.itemId) {
            toast.error("Please select an item");
            return;
        }

        const selectedItem = items.find(i => i._id === formData.itemId);
        if (selectedItem) {
            let maxQuantity = 0;
            if (formData.batch) {
                const batchObj = selectedItem.batches?.find(b => b.batchNumber === formData.batch);
                maxQuantity = batchObj?.quantity || 0;
            } else {
                maxQuantity = selectedItem.quantity || 0;
            }

            if (editingDamage && editingDamage.itemId === formData.itemId && editingDamage.batch === formData.batch) {
                maxQuantity += editingDamage.quantity;
            }
            
            if (Number(formData.quantity) > maxQuantity) {
                toast.error(`Cannot add more than available quantity (${maxQuantity})`);
                return;
            }
        }

        try {
            const url = editingDamage ? `/api/damaged-items/${editingDamage._id}` : "/api/damaged-items";
            const method = editingDamage ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(editingDamage ? "Record updated" : "Damaged item recorded");
                setModalOpen(false);
                fetchDamagedItems();
                fetchItems();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to save damaged item");
            }
        } catch (error) {
            toast.error("An error occurred");
        }
    };

    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const { data: session } = useSession();
    const isAdmin = session?.user?.role === "admin";
    const perms = (session?.user?.permissions as any)?.damaged_items;
    const canCreate = isAdmin || perms?.create;
    const canEdit = isAdmin || perms?.edit;
    const canDelete = isAdmin || perms?.delete;

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            const res = await fetch(`/api/damaged-items/${deleteId}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Record deleted and quantity restored");
                setDeleteId(null);
                fetchDamagedItems();
                fetchItems();
            } else {
                const data = await res.json();
                toast.error(data.error || "Failed to delete");
            }
        } catch (error) {
            toast.error("Failed to delete record");
        } finally {
            setDeleting(false);
        }
    };

    return (
        <main className="flex-1 p-6">
            <div className="max-w-6xl mx-auto">
                <TopBar
                    title="Damaged / Disposed Items"
                    subtitle="Track inventory shrinkage and damaged stock"
                    actions={
                        canCreate && (
                            <Button onClick={() => {
                                setEditingDamage(null);
                                setFormData({
                                    itemId: "",
                                    itemNumber: "",
                                    itemName: "",
                                    batch: "",
                                    quantity: 1,
                                    reason: "",
                                    date: new Date().toISOString().split('T')[0]
                                });
                                setModalOpen(true);
                            }} icon={<Plus size={18} />}>
                                Record Damage
                            </Button>
                        )
                    }
                />

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 border-r border-gray-200 text-center">Item</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 border-r border-gray-200 text-center">Quantity</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 border-r border-gray-200 text-center">Reason</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 border-r border-gray-200 text-center">Date</th>
                                {isAdmin && <th className="px-6 py-4 text-sm font-semibold text-gray-900 border-r border-gray-200 text-center">Created By</th>}
                                <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {damagedItems.map((item) => (
                                <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 border-r border-gray-200">
                                        <div className="font-medium text-gray-900 text-center">{item.itemName}</div>
                                        <div className="text-xs text-gray-500 text-center">{item.itemNumber}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center border-r border-gray-200 font-bold text-red-600">
                                        -{item.quantity}
                                    </td>
                                    <td className="px-6 py-4 border-r border-gray-200 text-gray-600 text-center italic">
                                        "{item.reason}"
                                    </td>
                                    <td className="px-6 py-4 text-center border-r border-gray-200 text-gray-500">
                                        {formatDate(item.date)}
                                    </td>
                                    {isAdmin && (
                                        <td className="px-6 py-4 text-center border-r border-gray-200">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-medium text-gray-800">{item.createdBy?.name || "Admin"}</span>
                                                {item.updatedBy && item.updatedBy.name !== item.createdBy?.name && (
                                                    <span className="text-[9px] text-gray-400 italic">Edit: {item.updatedBy.name}</span>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex justify-center gap-2">
                                            {canEdit && (
                                                <button
                                                    onClick={() => {
                                                        setEditingDamage(item);
                                                        setFormData({
                                                            itemId: item.itemId,
                                                            itemNumber: item.itemNumber,
                                                            itemName: item.itemName,
                                                            batch: item.batch || "",
                                                            quantity: item.quantity,
                                                            reason: item.reason,
                                                            date: item.date.split("T")[0]
                                                        });
                                                        setModalOpen(true);
                                                    }}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    onClick={() => setDeleteId(item._id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {damagedItems.length === 0 && !loading && (
                        <div className="p-12 text-center text-gray-500">No damaged items recorded.</div>
                    )}
                    <div className="border-t border-gray-100 px-2 mt-4">
                        <Pagination 
                            page={page} 
                            totalPages={totalPages} 
                            total={total} 
                            limit={10} 
                            onPageChange={setPage} 
                        />
                    </div>
                </div>
            </div>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                title={editingDamage ? "Edit Damaged Record" : "Record Damaged Item"}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Item</label>
                        <Select
                            options={items.filter(i => i.quantity > 0).map(i => ({ value: i._id, label: `${i.itemNumber} - ${i.name} (Qty: ${i.quantity})`, data: i }))}
                            value={formData.itemId ? { value: formData.itemId, label: `${formData.itemNumber} - ${formData.itemName}`, data: items.find(i => i._id === formData.itemId) } : null}
                            onChange={(opt: any) => handleItemSelect(opt.data)}
                            placeholder="Search item..."
                        />
                    </div>

                    {selectedItemBatches.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select Batch (Optional)</label>
                            <Select
                                options={selectedItemBatches.filter(b => b.quantity > 0).map(b => ({ value: b.batchNumber, label: `${b.batchNumber || 'Unnamed'} (Qty: ${b.quantity})` }))}
                                value={formData.batch ? { value: formData.batch, label: formData.batch } : null}
                                onChange={(opt: any) => setFormData({ ...formData, batch: opt?.value || "" })}
                                isClearable
                                placeholder="Select a specific batch..."
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                            label="Quantity"
                            type="number"
                            min="1"
                            value={formData.quantity}
                            onChange={(e) => {
                                const val = e.target.value;
                                setFormData({ ...formData, quantity: val === "" ? "" as any : parseInt(val) });
                            }}
                            required
                        />
                        <Input
                            label="Date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>

                    <Input
                        label="Reason for Damage / Disposal"
                        placeholder="e.g. Expired, Broken during handling..."
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        required
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
                        <Button type="submit" variant="danger">Confirm Disposal</Button>
                    </div>
                </form>
            </Modal>

            <ConfirmModal
                open={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDelete}
                title="Delete Damaged Record"
                message="Are you sure you want to delete this record? The item quantity will be restored to inventory."
                confirmLabel="Delete"
                loading={deleting}
            />
        </main>
    );
}

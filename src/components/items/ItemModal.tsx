"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import SearchSelect from "@/components/ui/SearchSelect";
import { IItem } from "@/types";

const schema = z.object({
    itemId: z.string().optional(),
    itemNumber: z.string().min(1, "Item number is required"),
    name: z.string().min(1, "Name is required"),
    salesAmount: z.coerce.number().min(0, "Sales price cannot be negative").default(0),
    purchaseAmount: z.coerce.number().min(0, "Purchase price cannot be negative").default(0),
    quantity: z.coerce.number().min(0, "Quantity cannot be negative").default(0),
    manufacturingDate: z.string().optional(),
    expiryDate: z.string().optional(),
    batchNumber: z.string().optional(),
    batchDate: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface ItemModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
    item?: IItem | null;
    loading?: boolean;
    mode?: "new" | "opening_stock";
}

export default function ItemModal({ open, onClose, onSubmit, item, loading, mode = "new" }: ItemModalProps) {
    const isEdit = !!item;
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema) as any,
    });

    const [existingItems, setExistingItems] = useState<IItem[]>([]);
    
    useEffect(() => {
        if (mode === "opening_stock" && open) {
            fetch("/api/items").then(res => res.json()).then(data => setExistingItems(data.data || data));
        }
    }, [mode, open]);

    useEffect(() => {
        if (open) {
            reset(item
                ? { 
                    itemNumber: item.itemNumber, 
                    name: item.name,
                    salesAmount: item.salesAmount || 0,
                    purchaseAmount: item.purchaseAmount || 0,
                    quantity: item.quantity || 0,
                    manufacturingDate: item.manufacturingDate ? new Date(item.manufacturingDate).toISOString().split('T')[0] : "",
                    expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : "",
                    batchNumber: `OPN-${Date.now().toString().slice(-6)}`,
                    batchDate: new Date().toISOString().split('T')[0],
                  }
                : { 
                    itemNumber: `ITM-${Date.now().toString().slice(-6)}`, 
                    name: "",
                    salesAmount: 0,
                    purchaseAmount: 0,
                    quantity: 0,
                    manufacturingDate: "",
                    expiryDate: "",
                    batchNumber: `OPN-${Date.now().toString().slice(-6)}`,
                    batchDate: new Date().toISOString().split('T')[0],
                  }
            );
        }
    }, [open, item, reset, mode]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? "Edit Item" : (mode === "opening_stock" ? "Opening Stock" : "Create Item")}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button form="item-form" type="submit" loading={loading}>
                        {isEdit ? "Save Changes" : (mode === "opening_stock" ? "Create Opening Stock" : "Create Item")}
                    </Button>
                </>
            }
        >
            <form id="item-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                {mode === "new" || isEdit ? (
                    <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Item Number" required readOnly disabled error={errors.itemNumber?.message} {...register("itemNumber")} hint="Automatically generated" />
                            <Input label="Item Name" placeholder="Enter item name" required error={errors.name?.message} {...register("name")} />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        <SearchSelect
                            label="Select Existing Item"
                            options={existingItems.map((i: IItem) => ({
                                label: `${i.itemNumber} - ${i.name} (Available: ${i.quantity})`,
                                value: i._id,
                                data: i
                            }))}
                            onChange={(opt) => {
                                if (opt && opt.data) {
                                    const selected = opt.data as IItem;
                                    reset({
                                        itemId: selected._id,
                                        itemNumber: selected.itemNumber,
                                        name: selected.name,
                                        purchaseAmount: selected.purchaseAmount || 0,
                                        salesAmount: selected.salesAmount || 0,
                                        quantity: 0,
                                        manufacturingDate: "",
                                        expiryDate: "",
                                        batchNumber: `OPN-${Date.now().toString().slice(-6)}`,
                                        batchDate: new Date().toISOString().split('T')[0],
                                    });
                                } else {
                                    reset({
                                      itemNumber: `ITM-${Date.now().toString().slice(-6)}`, 
                                      name: "",
                                      salesAmount: 0,
                                      purchaseAmount: 0,
                                      quantity: 0,
                                      manufacturingDate: "",
                                      expiryDate: "",
                                      batchNumber: `OPN-${Date.now().toString().slice(-6)}`,
                                      batchDate: new Date().toISOString().split('T')[0],
                                    });
                                }
                            }}
                            placeholder="Select an item to update..."
                        />
                        {errors.itemNumber && <p className="text-sm text-red-500">{errors.itemNumber.message}</p>}
                    </div>
                )}
                {/* Opening Stock Info */}
                {mode === "opening_stock" && (
                    <>
                        <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-100">
                            <p className="text-sm font-semibold text-gray-700">Stock & Batch Details</p>
                            <div className="grid grid-cols-1 gap-4">
                                <Input label="Batch Number" required readOnly disabled error={errors.batchNumber?.message} {...register("batchNumber")} hint="Auto-generated opening batch" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                            <Input label="Purchase Price" type="number" step="0.001" placeholder="0.000" error={errors.purchaseAmount?.message} {...register("purchaseAmount")} />
                            <Input label="Sales Price" type="number" step="0.001" placeholder="0.000" error={errors.salesAmount?.message} {...register("salesAmount")} />
                            <Input label="Opening Quantity" type="number" step="1" placeholder="0" error={errors.quantity?.message} {...register("quantity")} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Input label="Manufacturing Date" type="date" error={errors.manufacturingDate?.message} {...register("manufacturingDate")} />
                            <Input label="Expiry Date" type="date" error={errors.expiryDate?.message} {...register("expiryDate")} />
                        </div>
                    </>
                )}
            </form>
        </Modal>
    );
}
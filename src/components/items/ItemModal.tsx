"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { IItem } from "@/types";

const schema = z.object({
    itemNumber: z.string().min(1, "Item number is required"),
    name: z.string().min(1, "Name is required"),
    price: z.coerce.number().min(0, "Price must be ≥ 0"),
    quantity: z.coerce.number().min(0, "Quantity must be ≥ 0"),
    supplierName: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

interface ItemModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: FormData) => Promise<void>;
    item?: IItem | null;
    loading?: boolean;
}

export default function ItemModal({ open, onClose, onSubmit, item, loading }: ItemModalProps) {
    const isEdit = !!item;
    const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
        resolver: zodResolver(schema),
    });

    useEffect(() => {
        if (open) {
            reset(item
                ? { itemNumber: item.itemNumber, name: item.name, price: item.price, quantity: item.quantity, supplierName: item.supplierName ?? "" }
                : { itemNumber: "", name: "", price: 0, quantity: 0, supplierName: "" }
            );
        }
    }, [open, item, reset]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={isEdit ? "Edit Item" : "Create Item"}
            footer={
                <>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
                    <Button form="item-form" type="submit" loading={loading}>
                        {isEdit ? "Save Changes" : "Create Item"}
                    </Button>
                </>
            }
        >
            <form id="item-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Item number" placeholder="ITM-001" required error={errors.itemNumber?.message} {...register("itemNumber")} />
                    <Input label="Name" placeholder="Item name" required error={errors.name?.message}       {...register("name")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <Input label="Price (₹)" type="number" step="0.01" placeholder="0.00" required error={errors.price?.message}    {...register("price")} />
                    <Input label="Quantity" type="number" placeholder="0" required error={errors.quantity?.message} {...register("quantity")} />
                </div>
                <Input label="Supplier name" placeholder="Optional" error={errors.supplierName?.message} {...register("supplierName")} />
            </form>
        </Modal>
    );
}
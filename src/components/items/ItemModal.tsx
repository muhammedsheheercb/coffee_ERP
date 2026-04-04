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
                ? { itemNumber: item.itemNumber, name: item.name }
                : { itemNumber: `ITM-${Date.now().toString().slice(-6)}`, name: "" }
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
                <div className="grid grid-cols-1 gap-4">
                    <Input label="Item Number" required readOnly disabled error={errors.itemNumber?.message} {...register("itemNumber")} hint="Automatically generated" />
                    <Input label="Item Name" placeholder="Enter item name" required error={errors.name?.message}       {...register("name")} />
                </div>
            </form>
        </Modal>
    );
}
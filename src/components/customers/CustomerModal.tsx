"use client";
import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { ICustomer } from "@/types";

import { generateCustomerID } from "@/lib/utils";

const schema = z.object({
  customerNumber: z.string().min(1, "Customer number is required"),
  name: z.string().min(1, "Name is required"),
  mobile: z.string().regex(/^\d{8}$/, "Mobile must be exactly 8 digits without spaces/symbols"),
  openingBalance: z.coerce.number().min(0, "Opening balance cannot be negative").default(0),
});
type FormData = z.infer<typeof schema>;

interface CustomerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: FormData) => Promise<void>;
  customer?: ICustomer | null;
  loading?: boolean;
}

export default function CustomerModal({
  open,
  onClose,
  onSubmit,
  customer,
  loading,
}: CustomerModalProps) {
  const isEdit = !!customer;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  });

  useEffect(() => {
    if (open) {
      reset(
        customer
          ? {
              customerNumber: customer.customerNumber,
              name: customer.name,
              mobile: customer.mobile,
              openingBalance: customer.openingBalance || 0,
            }
          : { 
              customerNumber: generateCustomerID(), 
              name: "", 
              mobile: "", 
              openingBalance: 0 
            },
      );
    }
  }, [open, customer, reset]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Customer" : "Create Customer"}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button form="customer-form" type="submit" loading={loading}>
            {isEdit ? "Save Changes" : "Create Customer"}
          </Button>
        </>
      }
    >
      <form
        id="customer-form"
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Customer number"
            placeholder="CUST-001"
            required
            readOnly
            disabled
            error={errors.customerNumber?.message}
            {...register("customerNumber")}
          />
          <Input
            label="Full name"
            placeholder="Customer name"
            required
            error={errors.name?.message}
            {...register("name")}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Mobile number"
            placeholder="9876543210"
            required
            error={errors.mobile?.message}
            {...register("mobile")}
          />
          <Input
            label="Balance (OMR)"
            type="number"
            step="0.001"
            placeholder="0.000"
            error={errors.openingBalance?.message}
            {...register("openingBalance")}
          />
        </div>
        {isEdit && (
          <p className="text-xs text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
            Opening balance can be adjusted manually from the customer list.
          </p>
        )}
      </form>
    </Modal>
  );
}

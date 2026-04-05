"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { toast } from "react-hot-toast";

interface BalanceAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { adjustAmount: number; adjustType: "add" | "subtract"; date: string; paymentMethod: "cash" | "bank" | "credit" }) => Promise<void>;
  entityName: string;
  isSupplier?: boolean;
  loading?: boolean;
}

export default function BalanceAdjustmentModal({ 
  open, onClose, onSubmit, entityName, isSupplier, loading 
 }: BalanceAdjustmentModalProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0] || "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "credit">("cash");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;
    
    // Always subtract for customers (Payment mode)
    await onSubmit({
      adjustAmount: parseFloat(amount),
      adjustType: "subtract",
      date,
      paymentMethod
    });
    
    setAmount("");
    setDate(new Date().toISOString().split("T")[0] || "");
    setPaymentMethod("cash");
  };

  return (
    <Modal open={open} onClose={onClose} title={`Record Payment: ${entityName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info Box */}
        <div className={`px-4 py-2 rounded-lg text-sm font-medium border ${isSupplier ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
          {isSupplier ? 'Payment Mode: Subtracting from owed balance' : 'Payment Mode: Recording customer payment'}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              className="input-base w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as "cash" | "bank" | "credit")}
            >
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              {!isSupplier && <option value="credit">Credit (Unpaid)</option>}
            </select>
          </div>
        </div>

        <Input
          label="Amount (OMR)"
          type="number"
          step="0.001"
          placeholder="0.000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Record Payment</Button>
        </div>
      </form>
    </Modal>
  );
}

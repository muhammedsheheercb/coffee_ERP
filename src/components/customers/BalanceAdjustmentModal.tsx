"use client";
import { useState } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import { formatCurrency, formatDate } from "@/lib/utils";

interface BalanceAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { adjustAmount: number; adjustType: "add" | "subtract"; date: string; paymentMethod: "cash" | "bank" | "credit" }) => Promise<void>;
  entityName: string;
  customerNumber?: string;
  currentBalance?: number;
  isSupplier?: boolean;
  loading?: boolean;
}

export default function BalanceAdjustmentModal({ 
  open, onClose, onSubmit, entityName, customerNumber, currentBalance, isSupplier, loading 
 }: BalanceAdjustmentModalProps) {
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0] || "");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | "credit">("cash");

  const generatePDF = (amountVal: number) => {
    const doc = new jsPDF({ unit: "mm", format: [80, 150] });
    const newBalance = (currentBalance || 0) - amountVal;

    doc.setFontSize(14);
    doc.text("CAFE DIRECT", 40, 12, { align: "center" });
    doc.setFontSize(9);
    doc.text("PAYMENT RECEIPT", 40, 18, { align: "center" });
    doc.text("------------------------------------------", 40, 22, { align: "center" });

    doc.setFontSize(8);
    const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
    doc.setFontSize(8);
    doc.text(`Receipt #: ${receiptNo}`, 10, 25);
    
    doc.text(`Date: ${formatDate(date)}`, 10, 30);
    doc.text(`Customer: ${entityName}`, 10, 35);
    doc.text(`Cust #: ${customerNumber || "N/A"}`, 10, 40);
    doc.text(`Method: ${paymentMethod.toUpperCase()}`, 10, 45);

    doc.text("------------------------------------------", 40, 50, { align: "center" });
    
    doc.setFontSize(10);
    doc.text(`PAID AMOUNT:`, 10, 60);
    doc.text(`${formatCurrency(amountVal)}`, 70, 60, { align: "right" });
    
    doc.setFontSize(8);
    doc.text(`Previous Balance:`, 10, 70);
    doc.text(`${formatCurrency(currentBalance || 0)}`, 70, 70, { align: "right" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`NEW BALANCE:`, 10, 80);
    doc.text(`${formatCurrency(newBalance)}`, 70, 80, { align: "right" });
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("------------------------------------------", 40, 90, { align: "center" });
    doc.text("Thank you for your business!", 40, 100, { align: "center" });

    doc.save(`Receipt-${receiptNo}.pdf`);
  };

  const handleSubmit = async (e: React.FormEvent, shouldPrint: boolean = false) => {
    if (e) e.preventDefault();
    const val = parseFloat(amount);
    if (!amount || isNaN(val)) return;

    if (!isSupplier && (currentBalance || 0) <= 0) {
        toast.error("You don't have balance amount");
        return;
    }
    
    if (shouldPrint && !isSupplier) {
        generatePDF(val);
    }

    // Always subtract for customers (Payment mode)
    await onSubmit({
      adjustAmount: val,
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
      <form onSubmit={(e) => handleSubmit(e)} className="space-y-4">
        {/* Info Box */}
        <div className={`px-4 py-2 rounded-lg text-sm font-medium border ${isSupplier ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
          {isSupplier ? 'Payment Mode: Subtracting from owed balance' : `Current Balance: ${formatCurrency(currentBalance || 0)}`}
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
        
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
          <Button variant="outline" type="button" onClick={onClose} className="order-3 sm:order-1">Cancel</Button>
          {!isSupplier && (
              <Button type="button" variant="outline" onClick={() => handleSubmit(null as any, true)} loading={loading} className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 order-2">
                Record & Print PDF
              </Button>
          )}
          <Button type="submit" loading={loading} className="order-1 sm:order-3">Record Payment</Button>
        </div>
      </form>
    </Modal>
  );
}

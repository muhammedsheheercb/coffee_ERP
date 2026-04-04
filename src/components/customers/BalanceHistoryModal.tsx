"use client";
import Modal from "@/components/ui/Modal";
import { formatCurrency, formatDate } from "@/lib/utils";
import { IBalanceHistory } from "@/types";

interface BalanceHistoryModalProps {
  open: boolean;
  onClose: () => void;
  entityName: string;
  history: IBalanceHistory[];
}

export default function BalanceHistoryModal({ open, onClose, entityName, history }: BalanceHistoryModalProps) {
  // Sort history with the latest (newest) record at the TOP
  const displayHistory = history 
    ? [...history].sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      }) 
    : [];

  return (
    <Modal open={open} onClose={onClose} title={`Financial Record: ${entityName}`} size="lg">
      <div className="flex flex-col gap-4">
        <div className="overflow-hidden bg-white ring-1 ring-gray-100 rounded-2xl shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Transaction Date</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-right">Amount</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest text-center">Payment Mode</th>
                <th className="px-6 py-4 text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">Entry Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayHistory.length > 0 ? (
                displayHistory.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80 transition-all group">
                    <td className="px-6 py-5 text-sm font-semibold text-gray-700 whitespace-nowrap">
                      {item.date ? formatDate(item.date) : "Recent"}
                    </td>
                    <td className={`px-6 py-5 text-sm font-black text-right whitespace-nowrap ${item.type === 'payment' ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {item.type === 'payment' ? '-' : '+'}{formatCurrency(item.amount || 0)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border-2 
                        ${item.paymentMethod === 'credit' || (item.type === 'adjustment' && !item.paymentMethod) ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                          item.paymentMethod === 'cash' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                          'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                        {item.paymentMethod === 'credit' ? 'CREDIT' : (!item.paymentMethod && item.type === 'adjustment' ? 'CREDIT/Old' : (item.paymentMethod || 'CASH'))}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold text-gray-700">{item.note || "System Adjustment"}</span>
                        {item.type === 'payment' && (
                          <span className="text-[10px] text-gray-400 font-medium">Recorded payment subtracted from debt.</span>
                        )}
                        {item.type === 'adjustment' && (
                          <span className="text-[10px] text-gray-400 font-medium">Balance entry added to record debt.</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <p className="text-2xl font-black text-gray-300">VOID</p>
                      <p className="text-sm font-medium text-gray-400 italic">No historical activities logged for this account.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-gray-50/50 p-4 rounded-xl flex items-center justify-between border border-gray-100">
           <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ledger Total</span>
           <span className="text-lg font-black text-gray-800">Verified Activity Records</span>
        </div>
      </div>
    </Modal>
  );
}

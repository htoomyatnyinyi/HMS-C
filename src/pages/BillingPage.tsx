import React, { useState } from "react";
import { Plus, Receipt, DollarSign, Clock } from "lucide-react";
import {
  useGetInvoicesQuery,
  useCreateInvoiceMutation,
  useRecordPaymentMutation,
  type Invoice,
} from "../features/billing/billingApi";
import { useGetPatientsQuery } from "../features/patients/patientsApi";
import { useAppDispatch } from "../app/hooks";
import { addToast } from "../features/toast/toastSlice";
import { PageHeader, LoadingBlock, EmptyState, Badge } from "../components/ui/shared";
import { formatDateTime } from "../lib/utils";

export const BillingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);

  const { data: invoicesData, isLoading } = useGetInvoicesQuery({});
  const { data: patientsData } = useGetPatientsQuery({ limit: 100 });
  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
  const [recordPayment, { isLoading: isPaying }] = useRecordPaymentMutation();

  const [invoiceForm, setInvoiceForm] = useState({
    patientId: "",
    totalAmount: 25000,
  });

  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  const invoices = invoicesData?.data || [];
  const patients = patientsData?.data?.data || [];

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceForm.patientId) return;
    try {
      await createInvoice({
        patientId: invoiceForm.patientId,
        totalAmount: Number(invoiceForm.totalAmount),
        paidAmount: 0,
        balanceAmount: Number(invoiceForm.totalAmount),
        status: "ISSUED",
      }).unwrap();
      setIsInvoiceModalOpen(false);
      setInvoiceForm({ patientId: "", totalAmount: 25000 });
      dispatch(addToast({ type: "success", title: "Invoice Generated", message: "Folio statement billed to patient" }));
    } catch (err: any) {
      dispatch(addToast({ type: "error", title: "Billing Failed", message: err?.data?.error || "Error occurred" }));
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice || paymentAmount <= 0) return;
    try {
      await recordPayment({
        invoiceId: paymentModalInvoice.id,
        amount: Number(paymentAmount),
        paymentMethod,
      }).unwrap();
      setPaymentModalInvoice(null);
      dispatch(addToast({ type: "success", title: "Payment Recorded", message: "Cashier receipt printed" }));
    } catch (err: any) {
      dispatch(addToast({ type: "error", title: "Payment Error", message: err?.data?.error || "Error occurred" }));
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Billing & Cashier"
        description="Patient invoicing, outpatient settlement, pharmacy folios, and payment receipts"
        actions={
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20"
          >
            <Plus size={15} />
            Generate Bill
          </button>
        }
      />

      {/* Revenue summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400">Total Billed</span>
          <p className="text-xl font-bold text-slate-800 mt-0.5">
            {invoices.reduce((acc, i) => acc + (Number(i.totalAmount) || 0), 0).toLocaleString()} MMK
          </p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400">Paid In-Cash/Card</span>
          <p className="text-xl font-bold text-emerald-600 mt-0.5">
            {invoices.reduce((acc, i) => acc + (Number(i.paidAmount) || 0), 0).toLocaleString()} MMK
          </p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <span className="text-[11px] font-semibold text-slate-400">Receivables (Outstanding)</span>
          <p className="text-xl font-bold text-amber-600 mt-0.5">
            {invoices.reduce((acc, i) => acc + (Number(i.balanceAmount) || 0), 0).toLocaleString()} MMK
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingBlock text="Loading invoice history..." />
      ) : invoices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-3"
            >
              <div className="flex justify-between items-start">
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                  {inv.invoiceNo}
                </span>
                <Badge variant={inv.status === "PAID" ? "success" : "warning"}>
                  {inv.status}
                </Badge>
              </div>

              <div>
                <p className="text-xl font-bold text-slate-900">{Number(inv.totalAmount).toLocaleString()} MMK</p>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Paid: {Number(inv.paidAmount).toLocaleString()} MMK</span>
                  <span className="text-amber-600 font-semibold">Balance: {Number(inv.balanceAmount).toLocaleString()} MMK</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock size={11} /> {formatDateTime(inv.createdAt)}
                </span>

                {inv.status !== "PAID" && (
                  <button
                    onClick={() => {
                      setPaymentModalInvoice(inv);
                      setPaymentAmount(Number(inv.balanceAmount));
                    }}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <DollarSign size={13} /> Collect
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Receipt size={36} />}
          title="No Billing Invoices"
          description="There are no unsettled or paid invoices logged. Click 'Generate Bill' to invoice a patient."
          action={
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm"
            >
              Generate Bill
            </button>
          }
        />
      )}

      {/* Invoice Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Create Patient Invoice</h3>
            <form onSubmit={handleCreateInvoice} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Patient</label>
                <select
                  required
                  value={invoiceForm.patientId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, patientId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                >
                  <option value="">-- Choose patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Total Amount (MMK)</label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="500"
                  value={invoiceForm.totalAmount}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, totalAmount: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isCreating ? "Creating..." : "Issue Folio Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Collect Settlement</h3>
            <p className="text-xs text-slate-500">Invoice: <strong className="font-mono text-blue-600">{paymentModalInvoice.invoiceNo}</strong></p>

            <form onSubmit={handlePayment} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                >
                  <option value="CASH">Cash Counter</option>
                  <option value="KBZPAY">KBZPay / Mobile Wallet</option>
                  <option value="CB_PAY">CB Pay</option>
                  <option value="AYAPAY">AYA Pay</option>
                  <option value="CREDIT_CARD">Credit / Debit Card</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Amount to Pay (MMK)</label>
                <input
                  type="number"
                  required
                  min="500"
                  max={paymentModalInvoice.balanceAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalInvoice(null)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isPaying ? "Processing..." : "Confirm & Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

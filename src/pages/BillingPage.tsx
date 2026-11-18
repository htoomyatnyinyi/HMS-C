import React, { useState } from "react";
import {
  Plus,
  Receipt,
  DollarSign,
  Clock,
  Printer,
  Trash2,
  X,
  CreditCard,
  Wallet,
  CheckCircle2,
  TrendingUp,
} from "lucide-react";
import {
  useGetInvoicesQuery,
  useGetInvoiceByIdQuery,
  useCreateInvoiceMutation,
  useRecordPaymentMutation,
  type Invoice,
} from "../features/billing/billingApi";
import { useGetPatientsQuery } from "../features/patients/patientsApi";
import { useAppDispatch } from "../app/hooks";
import { addToast } from "../features/toast/toastSlice";
import {
  PageHeader,
  LoadingBlock,
  EmptyState,
  Badge,
  Spinner,
} from "../components/ui/shared";
import { formatDateTime, cn } from "../lib/utils";

interface LineItemForm {
  description: string;
  quantity: number;
  unitPrice: number;
}

export const BillingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [paymentModalInvoice, setPaymentModalInvoice] =
    useState<Invoice | null>(null);
  const [inspectInvoiceId, setInspectInvoiceId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data: invoicesData, isLoading, refetch } = useGetInvoicesQuery({});
  const { data: patientsData } = useGetPatientsQuery({ limit: 100 });
  const { data: inspectedInvoiceData } = useGetInvoiceByIdQuery(
    inspectInvoiceId || "",
    { skip: !inspectInvoiceId },
  );

  const [createInvoice, { isLoading: isCreating }] = useCreateInvoiceMutation();
  const [recordPayment, { isLoading: isPaying }] = useRecordPaymentMutation();

  /* Multi-item invoice builder state */
  const [invoicePatientId, setInvoicePatientId] = useState("");
  const [invoiceItems, setInvoiceItems] = useState<LineItemForm[]>([
    {
      description: "Physician Consultation & Clinical Review",
      quantity: 1,
      unitPrice: 20000,
    },
  ]);

  /* Cashier Payment State */
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("KBZPAY");

  const invoices: Invoice[] = invoicesData?.data || [];
  const patients = patientsData?.data?.data || [];

  // Metrics
  const totalBilled = invoices.reduce(
    (acc, i) => acc + (Number(i.total) || 0),
    0,
  );
  const totalOutstanding = invoices.reduce(
    (acc, i) => acc + (Number(i.balanceDue) || 0),
    0,
  );
  const totalCollected = Math.max(0, totalBilled - totalOutstanding);
  const collectionRate = totalBilled
    ? Math.round((totalCollected / totalBilled) * 100)
    : 100;

  // Filtered invoices
  const filteredInvoices =
    statusFilter === "ALL"
      ? invoices
      : invoices.filter((i) => i.status === statusFilter);

  // Invoice builder calculations
  const calculatedSubtotal = invoiceItems.reduce(
    (acc, item) => acc + item.quantity * item.unitPrice,
    0,
  );

  const handleAddLineItem = () => {
    setInvoiceItems((prev) => [
      ...prev,
      { description: "Prescription Formulary / Lab Test", quantity: 1, unitPrice: 15000 },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (invoiceItems.length <= 1) return;
    setInvoiceItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateLineItem = (
    index: number,
    field: keyof LineItemForm,
    val: string | number,
  ) => {
    setInvoiceItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item)),
    );
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoicePatientId) {
      dispatch(
        addToast({
          type: "error",
          title: "Patient Required",
          message: "Please choose a patient to issue the invoice",
        }),
      );
      return;
    }

    try {
      await createInvoice({
        patientId: invoicePatientId,
        items: invoiceItems.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
        })),
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Invoice Generated",
          message: `Folio billed successfully for MMK ${calculatedSubtotal.toLocaleString()}`,
        }),
      );

      setIsInvoiceModalOpen(false);
      setInvoicePatientId("");
      setInvoiceItems([
        {
          description: "Physician Consultation & Clinical Review",
          quantity: 1,
          unitPrice: 20000,
        },
      ]);
      refetch();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string } }).data?.error
          : "Billing generation failed";
      dispatch(
        addToast({
          type: "error",
          title: "Billing Failed",
          message: errorMsg || "Error occurred",
        }),
      );
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice || paymentAmount <= 0) return;

    try {
      await recordPayment({
        invoiceId: paymentModalInvoice.id,
        amount: Number(paymentAmount),
        method: paymentMethod,
      }).unwrap();

      dispatch(
        addToast({
          type: "success",
          title: "Payment Received",
          message: `Settlement of MMK ${paymentAmount.toLocaleString()} recorded via ${paymentMethod}`,
        }),
      );
      setPaymentModalInvoice(null);
      refetch();
    } catch (err: unknown) {
      const errorMsg =
        err && typeof err === "object" && "data" in err
          ? (err as { data?: { error?: string } }).data?.error
          : "Payment recording failed";
      dispatch(
        addToast({
          type: "error",
          title: "Payment Error",
          message: errorMsg || "Error occurred",
        }),
      );
    }
  };

  const activeInspected = inspectedInvoiceData?.data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Billing, Cashier & Revenue Cycle"
        description="Outpatient settlements, prescription folios, insurance claims, and digital receipts"
        actions={
          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-blue-500/20 active:scale-98"
          >
            <Plus size={15} />
            <span>Generate Bill</span>
          </button>
        }
      />

      {/* Financial Health Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Receipt size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-slate-900 leading-tight">
              {totalBilled.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Gross Billed (MMK)
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600 leading-tight">
              {totalCollected.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Realized Cash (MMK)
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-amber-600 leading-tight">
              {totalOutstanding.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Receivables Due (MMK)
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <TrendingUp size={18} />
          </div>
          <div>
            <div className="text-lg font-bold text-purple-700 leading-tight">
              {collectionRate}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Settlement Rate
            </div>
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 hidden sm:inline">
            Status:
          </span>
          {[
            { id: "ALL", label: "All Invoices" },
            { id: "PENDING", label: "Pending" },
            { id: "PARTIAL", label: "Partial" },
            { id: "PAID", label: "Settled / Paid" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-semibold transition-all whitespace-nowrap",
                statusFilter === item.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          Showing {filteredInvoices.length} billing folios
        </span>
      </div>

      {/* Invoices Grid */}
      {isLoading ? (
        <LoadingBlock text="Loading patient billing ledger…" />
      ) : filteredInvoices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredInvoices.map((inv) => {
            const isSettled = inv.status === "PAID";
            const patient = patients.find((p) => p.id === inv.patientId);

            return (
              <div
                key={inv.id}
                className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {inv.invoiceNo}
                    </span>
                    <Badge variant={isSettled ? "success" : "warning"}>
                      {inv.status}
                    </Badge>
                  </div>

                  {/* Patient Name */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {patient
                        ? `${patient.firstName} ${patient.lastName}`
                        : `Patient: ${inv.patientId.slice(0, 8)}`}
                    </h4>
                    {patient && (
                      <span className="text-[11px] font-mono text-slate-400">
                        MRN: {patient.mrn}
                      </span>
                    )}
                  </div>

                  {/* Amount Breakdown */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Total Billed:</span>
                      <span className="font-mono font-bold text-slate-900">
                        MMK {Number(inv.total).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Balance Due:</span>
                      <span
                        className={cn(
                          "font-mono font-bold",
                          Number(inv.balanceDue) > 0
                            ? "text-rose-600"
                            : "text-emerald-600",
                        )}
                      >
                        MMK {Number(inv.balanceDue).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Clock size={11} /> {formatDateTime(inv.createdAt)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setInspectInvoiceId(inv.id)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Receipt size={13} />
                    Receipt
                  </button>

                  {!isSettled && (
                    <button
                      onClick={() => {
                        setPaymentModalInvoice(inv);
                        setPaymentAmount(Number(inv.balanceDue));
                      }}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 shadow-xs transition-colors"
                    >
                      <DollarSign size={13} />
                      Collect
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Receipt size={36} />}
          title="No Invoices in Ledger"
          description="There are currently no billing invoices matching the criteria."
          action={
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              Issue Invoice
            </button>
          }
        />
      )}

      {/* ─── CREATE INVOICE MODAL (MULTI-ITEM) ─── */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 flex-shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Generate Patient Folio Invoice
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Itemize clinical consultations, medications, and laboratory tests
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsInvoiceModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={handleCreateInvoice}
              className="space-y-4 flex-1 overflow-y-auto pr-1"
            >
              {/* Patient Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Select Patient *
                </label>
                <select
                  required
                  value={invoicePatientId}
                  onChange={(e) => setInvoicePatientId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white"
                >
                  <option value="">-- Choose registered patient --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} (MRN: {p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Billed Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Plus size={13} /> Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {invoiceItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2"
                    >
                      <input
                        required
                        placeholder="Service description"
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateLineItem(
                            idx,
                            "description",
                            e.target.value,
                          )
                        }
                        className="flex-2 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                      <input
                        required
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateLineItem(
                            idx,
                            "quantity",
                            Number(e.target.value),
                          )
                        }
                        className="w-16 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-center font-mono"
                      />
                      <input
                        required
                        type="number"
                        min="0"
                        step="500"
                        placeholder="Price"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleUpdateLineItem(
                            idx,
                            "unitPrice",
                            Number(e.target.value),
                          )
                        }
                        className="w-28 px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/40 font-mono text-right"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        disabled={invoiceItems.length <= 1}
                        className="p-1.5 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded-lg hover:bg-white transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal Card */}
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between text-xs">
                <span className="font-semibold text-blue-900">
                  Calculated Grand Total:
                </span>
                <span className="font-mono text-base font-bold text-blue-900">
                  MMK {calculatedSubtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  {isCreating ? (
                    <>
                      <Spinner size={14} className="text-white" />
                      <span>Generating…</span>
                    </>
                  ) : (
                    <span>Issue Invoice</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── CASHIER SETTLEMENT MODAL ─── */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handlePayment}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cashier Settlement
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Receive payment for Invoice {paymentModalInvoice.invoiceNo}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Total Balance Card */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between">
              <span className="text-xs text-amber-800 font-semibold">
                Outstanding Balance Due:
              </span>
              <span className="font-mono text-base font-bold text-amber-900">
                MMK {Number(paymentModalInvoice.balanceDue).toLocaleString()}
              </span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "KBZPAY", label: "KBZPay", icon: Wallet },
                  { id: "CB_PAY", label: "CB Pay", icon: Wallet },
                  { id: "CASH", label: "Cash Desk", icon: DollarSign },
                  { id: "AYAPAY", label: "AYA Pay", icon: Wallet },
                  { id: "WAVEPAY", label: "WavePay", icon: Wallet },
                  { id: "CREDIT_CARD", label: "Card POS", icon: CreditCard },
                ].map((m) => {
                  const Icon = m.icon;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={cn(
                        "p-2 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all",
                        paymentMethod === m.id
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100",
                      )}
                    >
                      <Icon size={14} />
                      <span className="text-[11px]">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount input */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Amount to Collect (MMK) *
              </label>
              <input
                type="number"
                required
                min="500"
                max={paymentModalInvoice.balanceDue}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:bg-white font-mono font-bold text-slate-900"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPaymentModalInvoice(null)}
                className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPaying}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 shadow-sm shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                {isPaying ? (
                  <>
                    <Spinner size={14} className="text-white" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <span>Collect Settlement</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── PRINTABLE RECEIPT / DOSSIER MODAL ─── */}
      {inspectInvoiceId && activeInspected && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Cashier Receipt & Statement
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Official Central Health HMS Statement
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="p-1.5 text-slate-600 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Print Receipt"
                >
                  <Printer size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setInspectInvoiceId(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3 font-sans text-xs">
              <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                <div>
                  <span className="font-bold text-slate-900 text-sm">
                    CENTRAL HEALTH CLINIC
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Outpatient & Specialist Care Center
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-blue-700">
                    {activeInspected.invoiceNo}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {formatDateTime(activeInspected.createdAt)}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Itemized Charges
                </span>
                <div className="divide-y divide-slate-200 bg-white rounded-lg border border-slate-200 overflow-hidden">
                  {activeInspected.items && activeInspected.items.length > 0 ? (
                    activeInspected.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">
                            {item.description}
                          </span>
                          <span className="text-slate-400 block text-[10px]">
                            Qty: {item.quantity} × MMK{" "}
                            {Number(item.unitPrice).toLocaleString()}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          MMK{" "}
                          {(
                            item.quantity * Number(item.unitPrice)
                          ).toLocaleString()}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-2.5 flex items-center justify-between">
                      <span className="text-slate-700">Clinical Folio</span>
                      <span className="font-mono font-bold text-slate-900">
                        MMK {Number(activeInspected.total).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="pt-2 border-t border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Billed:</span>
                  <span className="font-mono font-bold text-slate-900">
                    MMK {Number(activeInspected.total).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Amount Settled:</span>
                  <span className="font-mono">
                    MMK{" "}
                    {Math.max(
                      0,
                      Number(activeInspected.total) -
                        Number(activeInspected.balanceDue),
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-amber-700 font-bold pt-1 border-t border-slate-200">
                  <span>Remaining Balance:</span>
                  <span className="font-mono">
                    MMK {Number(activeInspected.balanceDue).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setInspectInvoiceId(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
